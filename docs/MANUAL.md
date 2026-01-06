# Legal Triage 사용 매뉴얼

> 법무팀을 위한 의료광고 리스크 분류 시스템 가이드

---

## 목차

1. [시작하기 전에](#1-시작하기-전에)
2. [Claude Code 설치](#2-claude-code-설치)
3. [Legal Triage 설치](#3-legal-triage-설치)
4. [웹 UI 사용법 (Streamlit)](#4-웹-ui-사용법-streamlit) ⭐ NEW
5. [CLI 사용법](#5-cli-사용법)
6. [슬래시 커맨드 사용법](#6-슬래시-커맨드-사용법)
7. [케이스 관리 워크플로우](#7-케이스-관리-워크플로우)
8. [Rubric 업데이트 방법](#8-rubric-업데이트-방법)
9. [자주 묻는 질문 (FAQ)](#9-자주-묻는-질문-faq)
10. [문제 해결](#10-문제-해결)

---

## 1. 시작하기 전에

### 1.1 이 시스템은 무엇인가요?

Legal Triage는 **의료광고 리스크를 자동으로 분류**하는 도구입니다.

- **TYPE_1**: 법무 검토가 필요한 콘텐츠
- **TYPE_2**: 가드레일 적용 후 진행 가능한 콘텐츠

### 1.2 핵심 원칙

```
애매하면 무조건 TYPE_1 (법무 검토)
False Negative(놓침)보다 False Positive(과잉 라우팅)를 선호
```

### 1.3 필요한 것

- Windows 10/11 또는 macOS
- 인터넷 연결
- Anthropic 계정 (Claude 사용을 위해)

---

## 2. Claude Code 설치

### 2.1 Node.js 설치 (필수)

Claude Code를 실행하려면 Node.js가 필요합니다.

**Windows:**
1. https://nodejs.org 접속
2. **LTS 버전** (왼쪽 버튼) 다운로드
3. 설치 파일 실행 → 모두 "Next" 클릭
4. 설치 완료

**설치 확인:**
```bash
# 터미널(명령 프롬프트)에서 실행
node --version
# v20.x.x 또는 v22.x.x가 표시되면 성공
```

### 2.2 Claude Code 설치

터미널(명령 프롬프트 또는 PowerShell)을 열고 다음 명령어를 실행합니다:

```bash
npm install -g @anthropic-ai/claude-code
```

### 2.3 Claude Code 인증

```bash
claude
```

처음 실행하면 Anthropic 계정 로그인 화면이 나타납니다.
브라우저에서 로그인하면 자동으로 인증됩니다.

### 2.4 설치 확인

```bash
claude --version
# 버전 번호가 표시되면 성공
```

---

## 3. Legal Triage 설치

### 3.1 프로젝트 다운로드

**방법 1: Git 사용 (권장)**
```bash
git clone https://github.com/aiden-hong/legal-triage.git
cd legal-triage
```

**방법 2: ZIP 다운로드**
1. GitHub 페이지에서 "Code" → "Download ZIP" 클릭
2. 압축 해제
3. 터미널에서 해당 폴더로 이동

### 3.2 의존성 설치

```bash
npm install
```

### 3.3 빌드

```bash
npm run build
```

### 3.4 전역 설치 (선택사항)

어디서든 `legal-triage` 명령어를 사용하려면:

```bash
npm link
```

### 3.5 설치 확인

```bash
npm test
```

모든 테스트가 통과하면 설치 완료입니다.

```
Test Suites: 3 passed, 3 total
Tests:       50 passed, 50 total
```

---

## 4. 웹 UI 사용법 (Streamlit)

**CLI 없이 브라우저에서 바로 사용할 수 있는 웹 인터페이스입니다.**

### 4.1 Python 설치 (필수)

웹 UI를 실행하려면 Python이 필요합니다.

**Windows:**
1. https://python.org 접속
2. "Downloads" → "Download Python 3.x" 클릭
3. 설치 시 **"Add Python to PATH"** 체크 필수
4. 설치 완료

**설치 확인:**
```bash
python --version
# Python 3.10.x 이상이면 성공
```

### 4.2 웹 UI 의존성 설치

```bash
cd legal-triage
pip install -r web/requirements.txt
```

### 4.3 웹 UI 실행

```bash
cd web
streamlit run streamlit_app.py
```

실행하면 자동으로 브라우저가 열립니다.
열리지 않으면 http://localhost:8501 에 접속하세요.

### 4.4 웹 UI 화면 구성

![웹 UI 메인 화면](images/streamlit-main.png)

웹 UI는 크게 3개 영역으로 구성됩니다:

| 영역 | 설명 |
|------|------|
| **왼쪽 (입력)** | 콘텐츠 설명 및 추가 정보 입력 |
| **오른쪽 (결과)** | 분류 결과, Red Flags, 가드레일 표시 |
| **사이드바** | 사용 안내 및 예시 버튼 |

### 4.5 콘텐츠 분류하기

#### Step 1: 설명 입력

![입력 화면](images/streamlit-input.png)

**"제품/기능/캠페인 설명"** 텍스트 영역에 검토할 내용을 입력합니다.

```
예시:
인스타그램에서 보톡스 시술 50% 할인 이벤트를 진행하려고 합니다.
전후사진도 함께 게시할 예정입니다.
```

#### Step 2: 추가 정보 (선택)

**"추가 정보 (선택사항)"**을 클릭하면 상세 옵션이 나타납니다:

| 옵션 | 설명 |
|------|------|
| 노출 범위 | public, 회원 전용, 내부 테스트 등 |
| 데이터 수집 | 개인정보 수집 여부 |
| 수익 모델 | 무료, 구독, 광고 등 |
| 대외 커뮤니케이션 | 고객 대상, 언론 등 |
| 해외 노출 | 국내 전용, 해외 포함 |

> 💡 추가 정보를 입력하면 더 정확한 분류가 가능합니다.

#### Step 3: 분석 실행

**🔍 분석하기** 버튼을 클릭합니다.

### 4.6 결과 확인하기

![결과 화면](images/streamlit-result.png)

#### 라우팅 결과

```
┌────────────────────────────────────┐
│ 🚨 TYPE_1: 법무 검토 필요          │
│    법무팀에 검토를 요청하세요.      │
└────────────────────────────────────┘
```

또는

```
┌────────────────────────────────────┐
│ ✅ TYPE_2: 가드레일 적용 후 진행    │
│    아래 가드레일을 적용하여 진행    │
└────────────────────────────────────┘
```

#### 신뢰도

분류의 확실성을 0~100%로 표시합니다.
- **90% 이상**: 높은 신뢰도
- **70~89%**: 보통 신뢰도
- **70% 미만**: 낮은 신뢰도 (자동으로 TYPE_1)

#### Red Flags

![Red Flags 화면](images/streamlit-redflags.png)

탐지된 위험 요소가 심각도별로 표시됩니다:

| 아이콘 | 심각도 | 의미 |
|--------|--------|------|
| 🔴 | Critical | 즉시 법무 검토 필요 |
| 🟠 | High | 법무 검토 권장 |
| 🟡 | Medium | 주의 필요 |
| 🟢 | Low | 참고 사항 |

각 Red Flag를 클릭하면 상세 정보가 표시됩니다:
- **사유**: 왜 위험한지
- **매칭 키워드**: 어떤 표현이 감지되었는지

#### 가드레일

![가드레일 화면](images/streamlit-guardrails.png)

적용해야 할 안전장치가 색상별로 표시됩니다:

| 색상 | 의미 | 예시 |
|------|------|------|
| 🔴 빨강 | 금지 | [금지] 전후사진은 의료광고에 사용 불가 |
| 🟡 노랑 | 주의/수정 필요 | [수정 필요] 효과 보장 표현 삭제 |
| 🟢 초록 | 필수 표시 | 개인차 고지 문구 삽입 |

#### JSON 출력

**"📄 JSON 출력 (API 연동용)"**을 클릭하면 결과를 JSON 형식으로 볼 수 있습니다.
복사하여 다른 시스템과 연동할 수 있습니다.

### 4.7 예시 사용하기

사이드바의 **예시 버튼**을 클릭하면 샘플 입력이 자동으로 채워집니다:

| 버튼 | 내용 | 예상 결과 |
|------|------|----------|
| 예시 1: 할인 이벤트 | 보톡스 50% 할인 | TYPE_1 |
| 예시 2: 정보성 콘텐츠 | 쌍커풀 정보 제공 | TYPE_2 |
| 예시 3: 전후사진 포함 | 리프팅 전후사진 | TYPE_1 |

### 4.8 웹 UI vs CLI 비교

| 기능 | 웹 UI | CLI |
|------|-------|-----|
| 설치 난이도 | 쉬움 (Python만 필요) | 보통 (Node.js 필요) |
| 사용 방법 | 클릭 & 입력 | 명령어 입력 |
| 결과 표시 | 시각적, 컬러풀 | 텍스트 기반 |
| 자동화 | 어려움 | 스크립트 연동 가능 |
| 추천 대상 | 비개발자, 빠른 확인 | 개발자, 자동화 |

> 💡 **권장**: 처음 사용자는 웹 UI로 시작하고, 익숙해지면 CLI나 슬래시 커맨드 활용

### 4.9 웹 UI 종료

터미널에서 `Ctrl+C`를 누르면 웹 서버가 종료됩니다.

---

## 5. CLI 사용법

### 5.1 CLI로 분류하기

**대화형 모드:**
```bash
npm run dev
```

**직접 입력:**
```bash
npm run dev -- check -d "보톡스 50% 할인 이벤트"
```

**JSON 출력:**
```bash
npm run dev -- check -d "전후사진 공개" --json
```

### 5.2 출력 결과 이해하기

```
═══════════════════════════════════════════════
 LEGAL TRIAGE RESULT
═══════════════════════════════════════════════

 Routing:     TYPE_1
 Confidence:  95%
 Next Step:   LEGAL_REVIEW

 Red Flags Detected:
 ┌─────────────────────────────────────────────┐
 │ [CRITICAL] BEFORE_AFTER_PHOTO               │
 │ Matched: "전후사진"                          │
 │ Reason: 의료법 제56조 제2항 제9호 위반 가능  │
 └─────────────────────────────────────────────┘
```

| 항목 | 설명 |
|------|------|
| **Routing** | TYPE_1(법무 검토) 또는 TYPE_2(가드레일 적용 후 진행) |
| **Confidence** | 분류 신뢰도 (70% 미만이면 자동으로 TYPE_1) |
| **Red Flags** | 감지된 위험 요소 |
| **Guardrails** | 적용해야 할 안전장치 |

---

## 6. 슬래시 커맨드 사용법

### 6.1 Claude Code에서 프로젝트 열기

```bash
cd legal-triage
claude
```

### 6.2 사용 가능한 커맨드

| 커맨드 | 용도 |
|--------|------|
| `/legal:triage` | 콘텐츠 분류 (TYPE_1/TYPE_2) |
| `/legal:case_intake` | 법무 검토 케이스 저장 |
| `/legal:case_digest` | 케이스에서 규칙 추출 |
| `/legal:rubric_propose` | Rubric 업데이트 제안 |

### 6.3 /legal:triage - 콘텐츠 분류

**사용법:**
```
/legal:triage 검토할 콘텐츠 내용
```

**예시:**
```
/legal:triage 새해맞이 보톡스 이벤트! 전후사진으로 확인하는 확실한 효과.
50% 할인, 인스타그램 광고로 집행 예정
```

**출력 예시:**
```json
{
  "routing": "TYPE_1",
  "confidence": 0.95,
  "red_flags": [
    {
      "code": "BEFORE_AFTER_PHOTO",
      "severity": "critical",
      "matched_keywords": ["전후사진"]
    }
  ],
  "summary": {
    "verdict": "TYPE_1 - 전후사진/효과보장/할인 3중 위반",
    "immediate_action": "전후사진 삭제, '확실한 효과' 삭제 후 법무 검토 요청"
  }
}
```

### 6.4 /legal:case_intake - 케이스 저장

법무 검토가 완료된 후, 향후 참고를 위해 케이스를 저장합니다.

**사용법:**
```
/legal:case_intake

[검토 요청 내용 붙여넣기]

---

[법무 회신 내용 붙여넣기]
```

**주의사항:**
- 실명, 병원명, 연락처는 반드시 익명화
- 이미지 URL 삭제

### 6.5 /legal:case_digest - 규칙 추출

저장된 케이스에서 새로운 규칙 후보를 추출합니다.

**사용법:**
```
/legal:case_digest 2026-01-07_sns-campaign-botox
```

### 6.6 /legal:rubric_propose - Rubric 업데이트

축적된 케이스를 기반으로 분류 규칙 업데이트를 제안합니다.

**사용법:**
```
/legal:rubric_propose
```

---

## 7. 케이스 관리 워크플로우

### 7.1 전체 흐름

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  제품팀     │ ──▶ │  분류       │ ──▶ │  TYPE_1?    │
│  요청       │     │  /legal:triage    │  │  TYPE_2?    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┴───────┐
                    │                                  │
                    ▼                                  ▼
            ┌───────────────┐                  ┌───────────────┐
            │   TYPE_1      │                  │   TYPE_2      │
            │   법무 검토   │                  │   가드레일    │
            │   진행        │                  │   적용 후     │
            └───────┬───────┘                  │   진행        │
                    │                          └───────────────┘
                    ▼
            ┌───────────────┐
            │  케이스 저장  │
            │  /legal:case_intake
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  규칙 추출    │
            │  /legal:case_digest
            └───────┬───────┘
                    │
                    ▼
            ┌───────────────┐
            │  Rubric 개선  │
            │  /legal:rubric_propose
            └───────────────┘
```

### 7.2 케이스 저장 상세 절차

#### Step 1: 케이스 폴더 생성

```bash
# 날짜_주제 형식으로 폴더 생성
mkdir data/cases/2026-01-15_instagram-filler-ad
```

#### Step 2: 익명화 작업

| 원본 | 익명화 |
|------|--------|
| PM 김철수 | PM_A |
| 법무 이영희 | 법무_1 |
| 강남미소성형외과 | 병원_A |
| 010-1234-5678 | [삭제] |
| https://...jpg | [이미지: 전후사진] |

#### Step 3: 파일 저장

```
data/cases/2026-01-15_instagram-filler-ad/
├── case.yaml      # 메타데이터
├── request.md     # 요청 원문 (익명화)
└── response.md    # 회신 원문 (익명화)
```

#### Step 4: 익명화 검증

```bash
npm run case:anonymize data/cases/2026-01-15_instagram-filler-ad
```

#### Step 5: 인덱스 업데이트

```bash
npm run case:ingest
```

### 7.3 규칙 추출 상세 절차

#### Step 1: 규칙 추출 실행

```bash
npm run case:extract
```

또는 Claude Code에서:
```
/legal:case_digest 2026-01-15_instagram-filler-ad
```

#### Step 2: 추출된 규칙 검토

`data/cases/2026-01-15_instagram-filler-ad/extracted_rules.yaml` 파일을 열어 검토합니다.

#### Step 3: 규칙 승인

승인할 규칙의 `reviewed`와 `approved`를 `true`로 변경:

```yaml
rules:
  - source_case_id: "2026-01-15_instagram-filler-ad"
    type: red_flag
    proposed_keywords:
      - "리얼 변화"
    confidence: high
    reviewed: true    # ← 검토 완료
    approved: true    # ← 승인
```

---

## 8. Rubric 업데이트 방법

### 8.1 업데이트 제안 생성

```bash
npm run rubric:propose-update
```

또는 Claude Code에서:
```
/legal:rubric_propose
```

### 8.2 제안 검토

`data/rubric-update-proposal.yaml` 파일에서 제안된 변경사항을 검토합니다.

### 8.3 테스트 실행

변경 적용 전 테스트:

```bash
npm test
```

### 8.4 수동 적용

1. `rubric.yaml` 파일을 직접 수정
2. 버전 번호 업데이트 (예: 2.0 → 2.1)
3. 테스트 재실행

### 8.5 변경사항 저장

```bash
git add rubric.yaml
git commit -m "feat(rubric): 새 키워드 추가 - 리얼 변화"
git push
```

---

## 9. 자주 묻는 질문 (FAQ)

### Q1: TYPE_1과 TYPE_2의 차이는?

| TYPE_1 | TYPE_2 |
|--------|--------|
| 법무 검토 필요 | 가드레일 적용 후 진행 가능 |
| 고위험 콘텐츠 | 저위험 콘텐츠 |
| 즉시 집행 불가 | 조건부 집행 가능 |

### Q2: 왜 모든 것이 TYPE_1로 분류되나요?

시스템은 **보수적**으로 설계되어 있습니다.
- 정보가 부족하면 TYPE_1
- 애매하면 TYPE_1
- 신뢰도 70% 미만이면 TYPE_1

추가 정보를 제공하면 더 정확한 분류가 가능합니다.

### Q3: 새로운 위험 표현을 추가하려면?

1. 케이스를 저장 (`/legal:case_intake`)
2. 규칙 추출 (`/legal:case_digest`)
3. 규칙 승인 (`approved: true`)
4. Rubric 업데이트 (`/legal:rubric_propose`)

### Q4: 잘못된 분류를 발견하면?

1. 해당 케이스를 기록
2. `rubric.yaml`의 키워드나 severity 조정
3. 테스트 추가
4. PR(Pull Request) 생성

### Q5: 오프라인에서 사용할 수 있나요?

CLI 도구(`npm run dev`)는 오프라인에서 사용 가능합니다.
Claude Code 슬래시 커맨드는 인터넷 연결이 필요합니다.

---

## 10. 문제 해결

### 10.1 "command not found: claude"

**원인:** Claude Code가 설치되지 않았거나 PATH에 없음

**해결:**
```bash
npm install -g @anthropic-ai/claude-code
```

### 10.2 "npm test" 실패

**원인:** 의존성 미설치

**해결:**
```bash
npm install
npm run build
npm test
```

### 10.3 익명화 검증 실패

**원인:** 개인정보가 남아있음

**해결:**
1. 오류 메시지에서 위치 확인
2. 해당 파일에서 개인정보 제거/익명화
3. 다시 검증 실행

```bash
npm run case:anonymize data/cases/케이스폴더명
```

### 10.4 "rubric.yaml 파싱 오류"

**원인:** YAML 문법 오류

**해결:**
1. YAML 문법 검사기로 확인 (예: https://yamlvalidator.com)
2. 들여쓰기 확인 (스페이스 2칸)
3. 특수문자 이스케이프 확인

### 10.5 슬래시 커맨드가 안 보여요

**원인:** 프로젝트 폴더에서 Claude Code를 실행하지 않음

**해결:**
```bash
cd legal-triage  # 프로젝트 폴더로 이동
claude           # Claude Code 실행
```

### 10.6 웹 UI가 실행되지 않아요

**원인:** Python 또는 Streamlit 미설치

**해결:**
```bash
python --version  # Python 설치 확인
pip install streamlit pyyaml  # 의존성 설치
```

### 10.7 추가 도움이 필요하면

1. 이슈 등록: https://github.com/aiden-hong/legal-triage/issues
2. 슬랙 채널: #legal-triage-support
3. 담당자: 법무팀 or 개발팀

---

## 부록: 주요 npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm test` | 전체 테스트 실행 |
| `npm run dev` | 개발 모드 실행 |
| `npm run build` | TypeScript 빌드 |
| `npm run case:ingest` | 케이스 인덱스 생성 |
| `npm run case:extract` | 규칙 추출 |
| `npm run case:anonymize` | 익명화 검증 |
| `npm run case:gen-tests` | 회귀테스트 생성 |
| `npm run rubric:propose-update` | Rubric 업데이트 제안 |

---

## 부록: Red Flag 코드 목록

### 의료광고 핵심 (Critical)

| 코드 | 설명 | 법적 근거 |
|------|------|----------|
| BEFORE_AFTER_PHOTO | 전후사진 | 의료법 §56②9 |
| PATIENT_TESTIMONIAL | 환자 후기/체험담 | 의료법 §56②7 |
| EFFECT_GUARANTEE | 효과 보장/단정 | 의료법 §56②1 |
| COMPARATIVE_SUPERIORITY | 비교우위/최상급 | 의료법 §56②2 |
| CELEBRITY_MEDICAL_ENDORSEMENT | 유명인 추천 | 의료법 §56②8 |
| PROCEDURE_VISUAL | 시술 장면 | 의료법 §56②10 |
| NON_MEDICAL_PRACTICE | 비의료인 행위 | 의료법 §27 |
| REMOTE_DIAGNOSIS | 원격 진단 | 의료법 §33 |

### 가격/유인 (High)

| 코드 | 설명 |
|------|------|
| PRICE_DISCOUNT_EVENT | 할인/이벤트 |
| GIFT_INCENTIVE | 경품/사은품 |
| REVIEW_MANIPULATION | 리뷰 보상 |

### 기타

전체 목록은 `rubric.yaml` 파일을 참조하세요.

---

*마지막 업데이트: 2026-01-07*
*버전: 2.1 (웹 UI 추가)*
