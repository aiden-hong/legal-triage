"""
Legal Triage - Streamlit Web App
의료광고/법무 리스크 분류 시스템
"""

import streamlit as st
from triage_engine import TriageEngine, TriageInput

# Page config
st.set_page_config(
    page_title="Legal Triage - 법무 리스크 분류",
    page_icon="⚖️",
    layout="wide",
)

# Initialize engine
@st.cache_resource
def get_engine():
    return TriageEngine()

engine = get_engine()

# Custom CSS
st.markdown("""
<style>
.routing-type1 {
    background-color: #ffcccc;
    padding: 20px;
    border-radius: 10px;
    border-left: 5px solid #ff4444;
}
.routing-type2 {
    background-color: #ccffcc;
    padding: 20px;
    border-radius: 10px;
    border-left: 5px solid #44ff44;
}
.red-flag-critical {
    background-color: #ff6b6b;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    margin: 2px;
    display: inline-block;
}
.red-flag-high {
    background-color: #ffa502;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    margin: 2px;
    display: inline-block;
}
.red-flag-medium {
    background-color: #ffd93d;
    color: black;
    padding: 5px 10px;
    border-radius: 5px;
    margin: 2px;
    display: inline-block;
}
.confidence-bar {
    height: 20px;
    border-radius: 10px;
}
</style>
""", unsafe_allow_html=True)

# Header
st.title("⚖️ Legal Triage")
st.markdown("### 의료광고/법무 리스크 1차 분류 시스템")
st.markdown("*보수적 분류: 애매하면 무조건 TYPE_1 (법무 검토 필요)*")
st.divider()

# Main layout
col1, col2 = st.columns([1, 1])

with col1:
    st.subheader("📝 입력")

    # Handle example text from session state
    if 'example_text' not in st.session_state:
        st.session_state.example_text = ""

    # Description input
    description = st.text_area(
        "제품/기능/캠페인 설명",
        value=st.session_state.example_text,
        height=150,
        placeholder="예: SNS에서 보톡스 시술 전후사진과 함께 50% 할인 이벤트를 진행하려고 합니다.",
        help="분류하려는 콘텐츠나 기능에 대해 상세히 설명해주세요."
    )

    # Clear example text after using
    if st.session_state.example_text:
        st.session_state.example_text = ""

    # Optional fields in expander
    with st.expander("추가 정보 (선택사항)", expanded=False):
        exposure = st.selectbox(
            "노출 범위",
            options=[None, "public", "members_only", "specific_group", "internal_test"],
            format_func=lambda x: {
                None: "선택 안함",
                "public": "전체 공개 (public)",
                "members_only": "회원 전용",
                "specific_group": "특정 그룹",
                "internal_test": "내부 테스트",
            }.get(x, x),
        )

        data_usage = st.selectbox(
            "데이터 수집 여부",
            options=[None, "collects", "no_collection", "unclear"],
            format_func=lambda x: {
                None: "선택 안함",
                "collects": "수집함",
                "no_collection": "수집 안함",
                "unclear": "불명확",
            }.get(x, x),
        )

        revenue_model = st.selectbox(
            "수익 모델",
            options=[None, "free", "paid_once", "subscription", "ads", "commission"],
            format_func=lambda x: {
                None: "선택 안함",
                "free": "무료",
                "paid_once": "1회 결제",
                "subscription": "구독",
                "ads": "광고",
                "commission": "수수료",
            }.get(x, x),
        )

        external_communication = st.selectbox(
            "대외 커뮤니케이션",
            options=[None, "customer_facing", "media", "internal"],
            format_func=lambda x: {
                None: "선택 안함",
                "customer_facing": "고객 대상",
                "media": "언론/미디어",
                "internal": "내부용",
            }.get(x, x),
        )

        cross_border = st.selectbox(
            "해외 노출",
            options=[None, "domestic_only", "includes_overseas", "unclear"],
            format_func=lambda x: {
                None: "선택 안함",
                "domestic_only": "국내 전용",
                "includes_overseas": "해외 포함",
                "unclear": "불명확",
            }.get(x, x),
        )

    # Submit button
    analyze_btn = st.button("🔍 분석하기", type="primary", use_container_width=True)

with col2:
    st.subheader("📊 결과")

    if analyze_btn and description:
        # Create input
        input_data = TriageInput(
            description=description,
            exposure=exposure,
            data_usage=data_usage,
            revenue_model=revenue_model,
            external_communication=external_communication,
            cross_border=cross_border,
        )

        # Run triage
        result = engine.triage(input_data)

        # Display routing result
        if result.routing == "TYPE_1":
            st.markdown("""
            <div class="routing-type1">
                <h2>🚨 TYPE_1: 법무 검토 필요</h2>
                <p>법무팀에 검토를 요청하세요.</p>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div class="routing-type2">
                <h2>✅ TYPE_2: 가드레일 적용 후 진행 가능</h2>
                <p>아래 가드레일을 적용하여 진행하세요.</p>
            </div>
            """, unsafe_allow_html=True)

        st.write("")

        # Confidence
        confidence_pct = int(result.confidence * 100)
        st.metric("신뢰도", f"{confidence_pct}%")
        st.progress(result.confidence)

        # Red flags
        if result.red_flags:
            st.subheader("🚩 탐지된 Red Flags")
            for flag in result.red_flags:
                severity_emoji = {
                    "critical": "🔴",
                    "high": "🟠",
                    "medium": "🟡",
                    "low": "🟢",
                }.get(flag.severity, "⚪")

                with st.expander(f"{severity_emoji} [{flag.severity.upper()}] {flag.code}"):
                    st.write(f"**사유:** {flag.reason}")
                    st.write(f"**매칭 키워드:** {', '.join(flag.matched_keywords)}")

        # Missing info questions
        if result.missing_info_questions:
            st.subheader("❓ 추가 확인 필요")
            for i, question in enumerate(result.missing_info_questions, 1):
                st.info(f"{i}. {question}")

        # Guardrails
        if result.safe_guardrails:
            st.subheader("🛡️ 적용할 가드레일")
            for guardrail in result.safe_guardrails:
                if guardrail.startswith("[금지]"):
                    st.error(guardrail)
                elif guardrail.startswith("[수정 필요]"):
                    st.warning(guardrail)
                elif guardrail.startswith("[필수]") or guardrail.startswith("[주의]"):
                    st.warning(guardrail)
                else:
                    st.success(guardrail)

        # Next step
        st.subheader("➡️ 다음 단계")
        if result.recommended_next_step == "LEGAL_REVIEW":
            st.error("**법무팀 검토 요청** - 법무팀에 검토를 요청하세요.")
        else:
            st.success("**가드레일 적용 후 진행** - 위 가드레일을 반영하고 진행하세요.")

        # JSON output
        with st.expander("📄 JSON 출력 (API 연동용)"):
            import json
            output_dict = {
                "routing": result.routing,
                "confidence": result.confidence,
                "red_flags": [
                    {
                        "code": f.code,
                        "reason": f.reason,
                        "matched_keywords": f.matched_keywords,
                        "severity": f.severity,
                    }
                    for f in result.red_flags
                ],
                "missing_info_questions": result.missing_info_questions,
                "safe_guardrails": result.safe_guardrails,
                "recommended_next_step": result.recommended_next_step,
                "timestamp": result.timestamp,
            }
            st.code(json.dumps(output_dict, ensure_ascii=False, indent=2), language="json")

    elif analyze_btn and not description:
        st.warning("설명을 입력해주세요.")

    else:
        st.info("왼쪽에 내용을 입력하고 '분석하기' 버튼을 클릭하세요.")

# Sidebar - Info
with st.sidebar:
    st.header("ℹ️ 사용 안내")
    st.markdown("""
    **Legal Triage**는 제품/기능/캠페인의 법적 리스크를 1차 분류하는 도구입니다.

    ### 분류 결과
    - **TYPE_1**: 법무팀 검토 필요
    - **TYPE_2**: 가드레일 적용 후 자체 진행 가능

    ### 분류 원칙
    - 보수적 분류 (애매하면 TYPE_1)
    - False Negative(놓침) < False Positive(과잉)

    ### 주요 체크 항목
    - 전후사진
    - 환자후기/체험담
    - 효과보장 표현
    - 비교우위/최상급 표현
    - 할인/이벤트
    - 개인정보 수집
    """)

    st.divider()
    st.caption("Legal Triage v1.0 | 강남언니/힐링페이퍼")

    # Quick examples
    st.subheader("📌 예시 입력")
    example1 = st.button("예시 1: 할인 이벤트", use_container_width=True)
    example2 = st.button("예시 2: 정보성 콘텐츠", use_container_width=True)
    example3 = st.button("예시 3: 전후사진 포함", use_container_width=True)

# Handle example buttons (store in session state)
if example1:
    st.session_state.example_text = "인스타그램에서 보톡스 시술 50% 할인 이벤트를 진행하려고 합니다. 선착순 100명 한정입니다."
    st.rerun()
if example2:
    st.session_state.example_text = "블로그에 쌍커풀 수술 종류에 대한 정보성 콘텐츠를 제작하려고 합니다. 특정 병원 언급 없이 일반적인 정보만 제공합니다."
    st.rerun()
if example3:
    st.session_state.example_text = "앱 내에서 리프팅 시술 전후사진을 비교해서 보여주는 기능을 추가하려고 합니다. 환자 동의는 받았습니다."
    st.rerun()
