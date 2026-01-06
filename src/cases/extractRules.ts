/**
 * 규칙 추출기 (Extract Rules)
 *
 * request.md와 response.md에서 금지 패턴, 완화 패턴을 추출하여
 * extracted_rules.yaml 생성
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CaseMetadata, ExtractedRule, ExtractedRulesFile, Severity } from '../types';
import { loadIndex } from './ingest';

const CASES_DIR = path.join(__dirname, '../../data/cases');

// 금지 표현 패턴 (정규식)
const PROHIBITION_PATTERNS = [
  // "~는 금지", "~할 수 없", "~불가" 등
  /['""]([^'""]+)['""](?:은|는|이|가)?\s*(?:금지|불가|사용\s*(?:불가|금지)|사용할\s*수\s*없)/gi,
  // "~를 삭제", "~를 제거"
  /['""]([^'""]+)['""](?:을|를|은|는)?\s*(?:삭제|제거)/gi,
  // "~ 표현 금지"
  /([가-힣a-zA-Z0-9%]+)\s*(?:표현|문구)?\s*(?:금지|불가)/gi,
];

// 권고 표현 패턴
const RECOMMENDATION_PATTERNS = [
  // "~를 추가", "~를 포함"
  /['""]([^'""]+)['""](?:을|를)?\s*(?:추가|포함|명시|표시)/gi,
  // "~해야 합니다", "~하세요"
  /['""]([^'""]+)['""](?:을|를)?\s*(?:해야|하세요|필수)/gi,
];

// 법적 근거 패턴
const LEGAL_BASIS_PATTERNS = [
  /의료법\s*제?\d+조(?:\s*제?\d+항)?(?:\s*제?\d+호)?/gi,
  /약사법\s*제?\d+조/gi,
  /개인정보보호법\s*제?\d+조/gi,
  /전자금융거래법\s*제?\d+조/gi,
];

/**
 * 텍스트에서 금지 표현 추출
 */
function extractProhibitedPatterns(text: string): string[] {
  const results: Set<string> = new Set();

  for (const pattern of PROHIBITION_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        results.add(match[1].trim());
      }
    }
  }

  return Array.from(results);
}

/**
 * 텍스트에서 권고 표현 추출
 */
function extractRecommendations(text: string): string[] {
  const results: Set<string> = new Set();

  for (const pattern of RECOMMENDATION_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        results.add(match[1].trim());
      }
    }
  }

  return Array.from(results);
}

/**
 * 케이스 메타데이터에서 규칙 후보 추출
 */
function extractFromCaseMetadata(caseData: CaseMetadata): ExtractedRule[] {
  const rules: ExtractedRule[] = [];

  // prohibited_expressions에서 새 키워드 후보 추출
  if (caseData.prohibited_expressions) {
    for (const expr of caseData.prohibited_expressions) {
      // 이미 존재하는 키워드가 아니면 추가 제안
      rules.push({
        source_case_id: caseData.case_id,
        type: 'red_flag',
        proposed_code: caseData.rule_codes[0] || 'NEW_CODE',
        proposed_keywords: [expr],
        proposed_severity: 'high' as Severity,
        proposed_reason: `케이스 ${caseData.case_id}에서 금지된 표현`,
        evidence_quote: `prohibited_expressions: "${expr}"`,
        confidence: 'medium',
        reviewed: false,
      });
    }
  }

  // required_modifications에서 가드레일 후보 추출
  if (caseData.required_modifications) {
    for (const mod of caseData.required_modifications) {
      rules.push({
        source_case_id: caseData.case_id,
        type: 'guardrail',
        proposed_condition: 'case_derived_modification',
        proposed_text: mod,
        evidence_quote: `required_modifications: "${mod}"`,
        confidence: 'medium',
        reviewed: false,
      });
    }
  }

  return rules;
}

/**
 * response.md에서 규칙 후보 추출
 */
function extractFromResponse(caseId: string, responseText: string): ExtractedRule[] {
  const rules: ExtractedRule[] = [];

  // 금지 표현 추출
  const prohibited = extractProhibitedPatterns(responseText);
  for (const expr of prohibited) {
    if (expr.length >= 2 && expr.length <= 30) {
      rules.push({
        source_case_id: caseId,
        type: 'red_flag',
        proposed_keywords: [expr],
        proposed_severity: 'high' as Severity,
        proposed_reason: '법무 회신에서 금지된 표현으로 언급',
        evidence_quote: `금지 표현 감지: "${expr}"`,
        confidence: 'low',
        reviewed: false,
      });
    }
  }

  // 권고 사항 추출
  const recommendations = extractRecommendations(responseText);
  for (const rec of recommendations) {
    if (rec.length >= 5 && rec.length <= 100) {
      rules.push({
        source_case_id: caseId,
        type: 'guardrail',
        proposed_text: rec,
        evidence_quote: `권고 사항 감지: "${rec}"`,
        confidence: 'low',
        reviewed: false,
      });
    }
  }

  return rules;
}

/**
 * 단일 케이스에서 규칙 추출
 */
export function extractRulesFromCase(casePath: string): ExtractedRulesFile | null {
  const caseYamlPath = path.join(casePath, 'case.yaml');
  const responsePath = path.join(casePath, 'response.md');

  if (!fs.existsSync(caseYamlPath)) {
    console.warn(`[WARN] case.yaml not found: ${casePath}`);
    return null;
  }

  try {
    // case.yaml 로드
    const caseContent = fs.readFileSync(caseYamlPath, 'utf-8');
    const caseData = yaml.load(caseContent) as CaseMetadata;

    const rules: ExtractedRule[] = [];

    // case.yaml에서 추출
    rules.push(...extractFromCaseMetadata(caseData));

    // response.md에서 추출 (있는 경우)
    if (fs.existsSync(responsePath)) {
      const responseContent = fs.readFileSync(responsePath, 'utf-8');
      rules.push(...extractFromResponse(caseData.case_id, responseContent));
    }

    // 중복 제거
    const uniqueRules = deduplicateRules(rules);

    return {
      case_id: caseData.case_id,
      extracted_at: new Date().toISOString(),
      rules: uniqueRules,
    };
  } catch (error) {
    console.error(`[ERROR] Failed to extract rules: ${casePath}`, error);
    return null;
  }
}

/**
 * 규칙 중복 제거
 */
function deduplicateRules(rules: ExtractedRule[]): ExtractedRule[] {
  const seen = new Set<string>();
  const unique: ExtractedRule[] = [];

  for (const rule of rules) {
    const key = JSON.stringify({
      type: rule.type,
      keywords: rule.proposed_keywords,
      text: rule.proposed_text,
    });

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(rule);
    }
  }

  return unique;
}

/**
 * 추출된 규칙을 YAML로 저장
 */
export function saveExtractedRules(casePath: string, extractedRules: ExtractedRulesFile): void {
  const outputPath = path.join(casePath, 'extracted_rules.yaml');

  // 기존 파일이 있으면 reviewed/approved 상태 보존
  let existingRules: ExtractedRule[] = [];
  if (fs.existsSync(outputPath)) {
    const existingContent = fs.readFileSync(outputPath, 'utf-8');
    const existing = yaml.load(existingContent) as ExtractedRulesFile;
    existingRules = existing.rules || [];
  }

  // 기존 승인 상태 보존
  for (const rule of extractedRules.rules) {
    const existingRule = existingRules.find(
      (r) =>
        r.type === rule.type &&
        JSON.stringify(r.proposed_keywords) === JSON.stringify(rule.proposed_keywords) &&
        r.proposed_text === rule.proposed_text
    );
    if (existingRule) {
      rule.reviewed = existingRule.reviewed;
      rule.approved = existingRule.approved;
    }
  }

  const yamlContent = yaml.dump(extractedRules, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  fs.writeFileSync(outputPath, yamlContent, 'utf-8');
  console.log(`[OK] Extracted rules saved: ${outputPath}`);
}

/**
 * 모든 케이스에서 규칙 추출
 */
export function extractAllRules(): void {
  const index = loadIndex();

  for (const entry of index) {
    const casePath = path.join(CASES_DIR, entry.path);
    const extracted = extractRulesFromCase(casePath);

    if (extracted && extracted.rules.length > 0) {
      saveExtractedRules(casePath, extracted);
      console.log(`[INFO] ${entry.case_id}: ${extracted.rules.length} rules extracted`);
    } else {
      console.log(`[INFO] ${entry.case_id}: No new rules extracted`);
    }
  }
}

/**
 * 승인된 모든 규칙 수집
 */
export function collectApprovedRules(): ExtractedRule[] {
  const index = loadIndex();
  const approvedRules: ExtractedRule[] = [];

  for (const entry of index) {
    const extractedPath = path.join(CASES_DIR, entry.path, 'extracted_rules.yaml');

    if (fs.existsSync(extractedPath)) {
      const content = fs.readFileSync(extractedPath, 'utf-8');
      const extracted = yaml.load(content) as ExtractedRulesFile;

      for (const rule of extracted.rules) {
        if (rule.approved) {
          approvedRules.push(rule);
        }
      }
    }
  }

  return approvedRules;
}

// CLI 실행
if (require.main === module) {
  console.log('=== Extract Rules ===\n');
  extractAllRules();
  console.log('\n=== Done ===');
}
