/**
 * Legal Triage Type Definitions
 */

// Routing types
export type RoutingType = 'TYPE_1' | 'TYPE_2';
export type NextStep = 'LEGAL_REVIEW' | 'PROCEED_WITH_GUARDRAILS';
export type Severity = 'critical' | 'high' | 'medium' | 'low';

// Input types
export interface TriageInput {
  description: string;
  exposure?: 'public' | 'members_only' | 'specific_group' | 'internal_test';
  dataUsage?: 'collects' | 'no_collection' | 'unclear';
  revenueModel?: 'free' | 'paid_once' | 'subscription' | 'ads' | 'commission';
  externalCommunication?: 'customer_facing' | 'media' | 'internal';
  crossBorder?: 'domestic_only' | 'includes_overseas' | 'unclear';
}

// Red flag types
export interface RedFlag {
  code: string;
  keywords: string[];
  reason: string;
  severity: Severity;
}

export interface DetectedRedFlag {
  code: string;
  reason: string;
  matchedKeywords: string[];
  severity: Severity;
}

// Question template types
export interface QuestionTemplate {
  category: string;
  question: string;
  options: string[];
  trigger_if_unknown?: boolean;
  trigger_if_contains?: string[];
}

// Guardrail types
export interface Guardrail {
  condition: string;
  text: string;
}

// Routing policy types
export interface RoutingPolicy {
  default: RoutingType;
  confidence_threshold: number;
  missing_info_action: RoutingType;
}

// Rubric schema
export interface Rubric {
  version: string;
  red_flags: RedFlag[];
  question_templates: QuestionTemplate[];
  safe_guardrails: Guardrail[];
  routing_policy: RoutingPolicy;
}

// Triage output schema
export interface TriageOutput {
  routing: RoutingType;
  confidence: number;
  red_flags: DetectedRedFlag[];
  missing_info_questions: string[];
  safe_guardrails: string[];
  recommended_next_step: NextStep;
  timestamp: string;
  input_hash?: string;
}

// Logger types
export interface AuditLogEntry {
  timestamp: string;
  input_hash: string;
  routing: RoutingType;
  confidence: number;
  red_flag_codes: string[];
  missing_info_count: number;
  guardrail_count: number;
}

export interface LoggerOptions {
  enabled: boolean;
  privacyMode: boolean;
  logFile?: string;
}

// ============================================================
// Case Management Types (법무 검토 케이스 관리)
// ============================================================

// 채널 유형
export type ChannelType =
  | 'app_home'
  | 'app_detail'
  | 'app_push'
  | 'sns_instagram'
  | 'sns_facebook'
  | 'sns_youtube'
  | 'landing_page'
  | 'search_ad'
  | 'display_ad'
  | 'email'
  | 'internal';

// 콘텐츠 유형
export type ContentType =
  | 'ugc_review'
  | 'editorial'
  | 'campaign'
  | 'hospital_provided'
  | 'mixed';

// 케이스 메타데이터 (case.yaml)
export interface CaseMetadata {
  // 기본 정보
  case_id: string;
  date: string; // YYYY-MM-DD
  team: string; // 요청팀
  requester: string; // 익명화된 요청자 (예: "PM_A")

  // 콘텐츠 정보
  channel: ChannelType[];
  content_type: ContentType;
  exposure_scope: 'all_users' | 'target_segment' | 'test_group' | 'internal';

  // 요약
  title: string;
  summary: string;

  // 법무 판정
  decision: RoutingType;
  confidence?: number;
  legal_reviewer?: string; // 익명화 (예: "법무_1")

  // 근거 및 태깅
  rule_codes: string[]; // 매칭된 rubric rule codes
  legal_basis: string[]; // 법적 근거 (예: "의료법 제56조 제2항")

  // 금지/수정 사항
  prohibited_expressions: string[]; // 금지된 표현
  required_modifications: string[]; // 수정 권고사항
  recommended_guardrails: string[]; // 적용 권장 가드레일

  // 메타
  created_at: string;
  updated_at: string;
  anonymized: boolean; // 익명화 완료 여부
  anonymization_notes?: string;
}

// 추출된 규칙 후보 (extracted_rules.yaml)
export interface ExtractedRule {
  source_case_id: string;
  type: 'red_flag' | 'guardrail' | 'question';

  // red_flag인 경우
  proposed_code?: string;
  proposed_keywords?: string[];
  proposed_severity?: Severity;
  proposed_reason?: string;

  // guardrail인 경우
  proposed_condition?: string;
  proposed_text?: string;

  // 공통
  evidence_quote: string; // 원문에서 근거가 된 문장
  confidence: 'high' | 'medium' | 'low';
  reviewed: boolean;
  approved?: boolean;
}

export interface ExtractedRulesFile {
  case_id: string;
  extracted_at: string;
  rules: ExtractedRule[];
}

// 케이스 인덱스 엔트리 (index.jsonl)
export interface CaseIndexEntry {
  case_id: string;
  path: string;
  date: string;
  team: string;
  decision: RoutingType;
  rule_codes: string[];
  title: string;
  indexed_at: string;
}

// 익명화 검증 결과
export interface AnonymizationCheckResult {
  passed: boolean;
  file: string;
  issues: AnonymizationIssue[];
}

export interface AnonymizationIssue {
  line: number;
  column: number;
  type: 'phone' | 'email' | 'name' | 'hospital' | 'address' | 'image_ref' | 'id_number';
  matched: string;
  suggestion: string;
}

// Rubric 업데이트 제안
export interface RubricUpdateProposal {
  generated_at: string;
  source_cases: string[];
  new_red_flags: RedFlag[];
  new_guardrails: Guardrail[];
  modified_red_flags: Array<{
    code: string;
    added_keywords: string[];
    reason: string;
  }>;
  diff_preview: string;
}
