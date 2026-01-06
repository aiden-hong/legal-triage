# Project: legal-triage (Gangnam Unni / Healing Paper)
## Mission
- 제품 제작팀이 ‘의료광고/의료법 리스크’를 1차로 보수적으로 분류(Type1/Type2)하도록 돕는다.
- 애매하면 무조건 TYPE_1(법무 검토). false negative(놓침)보다 false positive(과잉 라우팅)를 선호.

## Domain focus (Must)
- 미용의료 정보/광고: 의료광고성 문구, 시술/수술 표현, 전후사진, 후기/체험담, 가격/할인/이벤트, 비교우위, 유명인 추천, 유인행위 등
- 플랫폼 특성: 병원 광고주/의료인/의료기관 + 플랫폼 UGC(리뷰/후기) + 자체 제작 콘텐츠(에디토리얼/캠페인)

## Sources hierarchy
1) 보건복지부 ‘건강한 의료광고…(2판)’ 가이드(사례/체크리스트)
2) 의료법/시행령/시행규칙 및 공식 유권해석
3) 사내 법무 검토 케이스(판례 DB)

## Output requirements
- triage 결과는 JSON(또는 YAML)로: type, confidence, triggered_rules[], missing_info_questions[], guardrails[]
- 신규 red_flag 제안 시: “왜 위험인지(근거/가이드라인 연결)” + “제품팀이 당장 할 수 있는 완화책(가드레일)” 포함
- 코드/테스트까지 함께 수정: jest로 케이스 회귀테스트 생성

## Privacy/Security
- 케이스(판례) 저장 시 개인정보/민감정보는 반드시 익명화. 원문은 접근 통제.