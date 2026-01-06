# Legal Triage 사용 매뉴얼

> 법무팀을 위한 의료광고 리스크 분류 시스템 가이드

---

## 목차

1. [시작하기 전에](#1-시작하기-전에)
2. [Claude Code 설치](#2-claude-code-설치)
3. [Legal Triage 설치](#3-legal-triage-설치)
4. [기본 사용법](#4-기본-사용법)
5. [슬래시 커맨드 사용법](#5-슬래시-커맨드-사용법)
6. [케이스 관리 워크플로우](#6-케이스-관리-워크플로우)
7. [Rubric 업데이트 방법](#7-rubric-업데이트-방법)
8. [자주 묻는 질문 (FAQ)](#8-자주-묻는-질문-faq)
9. [문제 해결](#9-문제-해결)

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

## 4. 기본 사용법

### 4.1 CLI로 분류하기

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

### 4.2 출력 결과 이해하기

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

## 5. 슬래시 커맨드 사용법

### 5.1 Claude Code에서 프로젝트 열기

```bash
cd legal-triage
claude
```

### 5.2 사용 가능한 커맨드

| 커맨드 | 용도 |
|--------|------|
| `/legal:triage` | 콘텐츠 분류 (TYPE_1/TYPE_2) |
| `/legal:case_intake` | 법무 검토 케이스 저장 |
| `/legal:case_digest` | 케이스에서 규칙 추출 |
| `/legal:rubric_propose` | Rubric 업데이트 제안 |

### 5.3 /legal:triage - 콘텐츠 분류

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

### 5.4 /legal:case_intake - 케이스 저장

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

### 5.5 /legal:case_digest - 규칙 추출

저장된 케이스에서 새로운 규칙 후보를 추출합니다.

**사용법:**
```
/legal:case_digest 2026-01-07_sns-campaign-botox
```

### 5.6 /legal:rubric_propose - Rubric 업데이트

축적된 케이스를 기반으로 분류 규칙 업데이트를 제안합니다.

**사용법:**
```
/legal:rubric_propose
```

---

## 6. 케이스 관리 워크플로우

### 6.1 전체 흐름

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

### 6.2 케이스 저장 상세 절차

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

### 6.3 규칙 추출 상세 절차

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

## 7. Rubric 업데이트 방법

### 7.1 업데이트 제안 생성

```bash
npm run rubric:propose-update
```

또는 Claude Code에서:
```
/legal:rubric_propose
```

### 7.2 제안 검토

`data/rubric-update-proposal.yaml` 파일에서 제안된 변경사항을 검토합니다.

### 7.3 테스트 실행

변경 적용 전 테스트:

```bash
npm test
```

### 7.4 수동 적용

1. `rubric.yaml` 파일을 직접 수정
2. 버전 번호 업데이트 (예: 2.0 → 2.1)
3. 테스트 재실행

### 7.5 변경사항 저장

```bash
git add rubric.yaml
git commit -m "feat(rubric): 새 키워드 추가 - 리얼 변화"
git push
```

---

## 8. 자주 묻는 질문 (FAQ)

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

## 9. 문제 해결

### 9.1 "command not found: claude"

**원인:** Claude Code가 설치되지 않았거나 PATH에 없음

**해결:**
```bash
npm install -g @anthropic-ai/claude-code
```

### 9.2 "npm test" 실패

**원인:** 의존성 미설치

**해결:**
```bash
npm install
npm run build
npm test
```

### 9.3 익명화 검증 실패

**원인:** 개인정보가 남아있음

**해결:**
1. 오류 메시지에서 위치 확인
2. 해당 파일에서 개인정보 제거/익명화
3. 다시 검증 실행

```bash
npm run case:anonymize data/cases/케이스폴더명
```

### 9.4 "rubric.yaml 파싱 오류"

**원인:** YAML 문법 오류

**해결:**
1. YAML 문법 검사기로 확인 (예: https://yamlvalidator.com)
2. 들여쓰기 확인 (스페이스 2칸)
3. 특수문자 이스케이프 확인

### 9.5 슬래시 커맨드가 안 보여요

**원인:** 프로젝트 폴더에서 Claude Code를 실행하지 않음

**해결:**
```bash
cd legal-triage  # 프로젝트 폴더로 이동
claude           # Claude Code 실행
```

### 9.6 추가 도움이 필요하면

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
*버전: 2.0*
