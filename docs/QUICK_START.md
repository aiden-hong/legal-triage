# Quick Start - 5분 안에 시작하기

## 1. 설치 (최초 1회)

```bash
# 1. Node.js 설치 확인
node --version  # v20 이상

# 2. Claude Code 설치
npm install -g @anthropic-ai/claude-code

# 3. 프로젝트 클론 및 설치
git clone https://github.com/aiden-hong/legal-triage.git
cd legal-triage
npm install

# 4. 설치 확인
npm test
```

## 2. 사용법

### 방법 A: Claude Code (추천)

```bash
cd legal-triage
claude
```

Claude Code가 열리면:

```
/legal:triage 보톡스 전후사진 50% 할인 이벤트
```

### 방법 B: CLI 직접 실행

```bash
npm run dev -- check -d "보톡스 전후사진 50% 할인 이벤트"
```

## 3. 결과 해석

```
TYPE_1 → 법무 검토 필요 (진행 불가)
TYPE_2 → 가드레일 적용 후 진행 가능
```

## 4. 슬래시 커맨드 요약

| 커맨드 | 언제 사용? |
|--------|-----------|
| `/legal:triage 내용` | 콘텐츠 분류할 때 |
| `/legal:case_intake` | 법무 검토 완료 후 저장할 때 |
| `/legal:case_digest 케이스ID` | 규칙 추출할 때 |
| `/legal:rubric_propose` | 분류 규칙 개선할 때 |

## 5. 다음 단계

- 상세 매뉴얼: [MANUAL.md](./MANUAL.md)
- 분류 규칙: [../rubric.yaml](../rubric.yaml)
- 예제 케이스: [../data/cases/](../data/cases/)

---

**문제가 있으면?**
```bash
npm test  # 테스트 실행
npm run case:anonymize  # 익명화 검증
```
