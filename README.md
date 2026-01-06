# Legal Triage

프로덕트 아이디어, 기능, 캠페인에 대한 보수적 법무 리스크 트리아지 시스템

## 개요

Legal Triage는 프로덕트 아이디어나 기능이 법무 검토가 필요한지 빠르게 판단하는 CLI 도구입니다. **보수적 원칙**을 따릅니다: 애매하면 무조건 법무 검토(TYPE_1)로 라우팅합니다.

**핵심 원칙:**
- **False Negative 최소화**: 불확실하면 항상 TYPE_1(법무 검토)으로 라우팅
- **법률 자문이 아님**: 리스크 트리아지 도구이며, 법무 판단을 대체하지 않음
- **감사 추적**: 모든 결정은 근거와 함께 로깅됨

## 설치

```bash
# 의존성 설치
npm install

# 빌드
npm run build

# 전역 설치 (선택)
npm link
```

## 사용법

### 인터랙티브 모드

```bash
# 인터랙티브 트리아지 시작
legal-triage check -i

# 또는 간단히
legal-triage check
```

### 커맨드 라인 모드

```bash
# 기본 사용법
legal-triage check -d "프로덕트 아이디어 설명"

# 모든 옵션 사용
legal-triage check \
  -d "사용자 구독 결제 기능" \
  -e public \
  -u collects \
  -r subscription \
  -c customer_facing \
  -b domestic_only
```

### 빠른 체크 (한 줄 출력)

```bash
legal-triage quick "단순 UI 버튼 색상 변경"
# 출력: [TYPE_2] confidence=0.90 flags=none next=PROCEED_WITH_GUARDRAILS
```

### 통계 조회

```bash
legal-triage stats
```

## 옵션

| 옵션 | 설명 | 값 |
|------|------|-----|
| `-d, --description` | 아이디어/기능 설명 | 텍스트 |
| `-e, --exposure` | 노출 범위 | `public`, `members_only`, `specific_group`, `internal_test` |
| `-u, --data-usage` | 데이터 사용 | `collects`, `no_collection`, `unclear` |
| `-r, --revenue` | 수익 모델 | `free`, `paid_once`, `subscription`, `ads`, `commission` |
| `-c, --communication` | 대외 커뮤니케이션 | `customer_facing`, `media`, `internal` |
| `-b, --cross-border` | 국경간 범위 | `domestic_only`, `includes_overseas`, `unclear` |
| `-j, --json` | JSON으로만 출력 | - |
| `--no-color` | 색상 출력 비활성화 | - |
| `--no-log` | 감사 로깅 비활성화 | - |
| `-i, --interactive` | 인터랙티브 모드 | - |

## 출력 스키마

```json
{
  "routing": "TYPE_1" | "TYPE_2",
  "confidence": 0.0-1.0,
  "red_flags": [
    {
      "code": "PII_COLLECTION",
      "reason": "개인정보 수집/처리 시 개인정보보호법 검토 필수",
      "matchedKeywords": ["개인정보"],
      "severity": "critical"
    }
  ],
  "missing_info_questions": [
    "서비스/기능의 노출 범위는 어디까지인가요?"
  ],
  "safe_guardrails": [
    "개인정보 수집 시 이용자 동의를 받고 개인정보처리방침에 명시해야 합니다."
  ],
  "recommended_next_step": "LEGAL_REVIEW" | "PROCEED_WITH_GUARDRAILS",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "input_hash": "abc123..."
}
```

## 라우팅 유형

| 유형 | 의미 | 조치 |
|------|------|------|
| **TYPE_1** | 법무 검토 필요 | 법무팀에 검토 요청 |
| **TYPE_2** | 저위험 | 가드레일 준수 후 진행 가능 |

## Red Flag 카테고리

다음 리스크 카테고리를 탐지합니다 (전체 목록은 `rubric.yaml` 참조):

- **개인정보/프라이버시**: PII 수집, 국외 이전, 아동 데이터
- **금융**: 결제 처리, 투자 상품, 대출
- **의료**: 건강 관련 주장, 진단, 치료
- **광고**: 과장 광고, 비교 광고, 유명인 추천
- **법적 책임**: 면책 조항, 자동 갱신, 사용자 콘텐츠
- **지식재산권**: 상표 사용, 저작권 문제
- **규제 산업**: 주류, 도박, 성인 콘텐츠

## 커스터마이징

`rubric.yaml`을 수정하여 다음을 커스터마이징할 수 있습니다:
- Red flag 키워드 및 심각도
- 질문 템플릿
- 가드레일 메시지
- 라우팅 임계값

## 프라이버시 & 로깅

- **로컬 실행**: 모든 처리는 로컬에서 수행
- **프라이버시 모드**: 로그에는 해시와 라벨만 저장, 원문 저장 안 함
- **로깅 비활성화**: `--no-log` 옵션으로 감사 추적 비활성화

로그 파일은 기본적으로 `.legal-triage-logs/`에 저장됩니다.

## 개발

```bash
# 테스트 실행
npm test

# 개발 모드 실행
npm run dev -- check -d "테스트"

# 빌드
npm run build
```

## 예시 시나리오

### TYPE_1 예시 (법무 검토 필요)

```bash
# 개인정보 수집
legal-triage quick "주민등록번호를 수집하여 본인인증에 사용"
# [TYPE_1] confidence=0.95 flags=PII_COLLECTION next=LEGAL_REVIEW

# 아동 대상 서비스
legal-triage quick "14세 미만 아동을 위한 교육 앱"
# [TYPE_1] confidence=0.95 flags=CHILDREN_TARGET next=LEGAL_REVIEW

# 금융 상품
legal-triage quick "소액 투자 서비스로 주식 투자 기능 제공"
# [TYPE_1] confidence=0.95 flags=FINANCIAL_PRODUCT next=LEGAL_REVIEW
```

### TYPE_2 예시 (진행 가능)

```bash
# 단순 내부 도구
legal-triage check -d "팀 내부 일정 관리 도구" -e internal_test -u no_collection
# [TYPE_2] confidence=0.90 next=PROCEED_WITH_GUARDRAILS

# UI 변경
legal-triage quick "버튼 색상을 파란색에서 초록색으로 변경"
# [TYPE_2] confidence=0.90 flags=none next=PROCEED_WITH_GUARDRAILS
```

## 라이선스

ISC
