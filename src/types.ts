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
