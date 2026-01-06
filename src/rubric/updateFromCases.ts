/**
 * Rubric 업데이트 제안기
 *
 * 승인된 extracted_rules를 기반으로 rubric.yaml 업데이트 diff 제안
 * (자동 커밋은 금지, diff 제안까지만)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Rubric, RedFlag, Guardrail, ExtractedRule, RubricUpdateProposal } from '../types';
import { collectApprovedRules } from '../cases/extractRules';

const RUBRIC_PATH = path.join(__dirname, '../../rubric.yaml');
const PROPOSAL_PATH = path.join(__dirname, '../../data/rubric-update-proposal.yaml');

/**
 * 현재 rubric.yaml 로드
 */
function loadRubric(): Rubric {
  const content = fs.readFileSync(RUBRIC_PATH, 'utf-8');
  return yaml.load(content) as Rubric;
}

/**
 * 기존 키워드에 포함되어 있는지 확인
 */
function isKeywordExists(rubric: Rubric, keyword: string): boolean {
  const lowerKeyword = keyword.toLowerCase();
  for (const flag of rubric.red_flags) {
    for (const kw of flag.keywords) {
      if (kw.toLowerCase() === lowerKeyword) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 기존 가드레일에 포함되어 있는지 확인
 */
function isGuardrailExists(rubric: Rubric, condition: string): boolean {
  return rubric.safe_guardrails.some((g) => g.condition === condition);
}

/**
 * 승인된 규칙을 기반으로 업데이트 제안 생성
 */
export function generateUpdateProposal(): RubricUpdateProposal {
  const rubric = loadRubric();
  const approvedRules = collectApprovedRules();

  const newRedFlags: RedFlag[] = [];
  const newGuardrails: Guardrail[] = [];
  const modifiedRedFlags: Array<{
    code: string;
    added_keywords: string[];
    reason: string;
  }> = [];

  const sourceCases = new Set<string>();

  for (const rule of approvedRules) {
    sourceCases.add(rule.source_case_id);

    if (rule.type === 'red_flag') {
      // 기존 코드에 키워드 추가 또는 새 코드 생성
      if (rule.proposed_code && rule.proposed_keywords) {
        const existingFlag = rubric.red_flags.find((f) => f.code === rule.proposed_code);

        if (existingFlag) {
          // 기존 코드에 새 키워드 추가
          const newKeywords = rule.proposed_keywords.filter(
            (kw) => !isKeywordExists(rubric, kw)
          );

          if (newKeywords.length > 0) {
            const existing = modifiedRedFlags.find((m) => m.code === rule.proposed_code);
            if (existing) {
              existing.added_keywords.push(...newKeywords);
            } else {
              modifiedRedFlags.push({
                code: rule.proposed_code,
                added_keywords: newKeywords,
                reason: rule.proposed_reason || '케이스에서 추출된 키워드',
              });
            }
          }
        } else {
          // 새 red_flag 코드 생성
          newRedFlags.push({
            code: rule.proposed_code,
            keywords: rule.proposed_keywords,
            reason: rule.proposed_reason || '케이스에서 추출된 새로운 위험 요소',
            severity: rule.proposed_severity || 'high',
          });
        }
      }
    } else if (rule.type === 'guardrail') {
      // 새 가드레일 추가
      if (rule.proposed_condition && rule.proposed_text) {
        if (!isGuardrailExists(rubric, rule.proposed_condition)) {
          newGuardrails.push({
            condition: rule.proposed_condition,
            text: rule.proposed_text,
          });
        }
      }
    }
  }

  // Diff 프리뷰 생성
  const diffPreview = generateDiffPreview(
    rubric,
    newRedFlags,
    newGuardrails,
    modifiedRedFlags
  );

  return {
    generated_at: new Date().toISOString(),
    source_cases: Array.from(sourceCases),
    new_red_flags: newRedFlags,
    new_guardrails: newGuardrails,
    modified_red_flags: modifiedRedFlags,
    diff_preview: diffPreview,
  };
}

/**
 * Diff 프리뷰 문자열 생성
 */
function generateDiffPreview(
  rubric: Rubric,
  newRedFlags: RedFlag[],
  newGuardrails: Guardrail[],
  modifiedRedFlags: Array<{ code: string; added_keywords: string[]; reason: string }>
): string {
  const lines: string[] = [];

  lines.push('# Rubric Update Proposal');
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push('');

  // 수정된 red_flags
  if (modifiedRedFlags.length > 0) {
    lines.push('## Modified Red Flags (키워드 추가)');
    lines.push('');
    for (const mod of modifiedRedFlags) {
      const existingFlag = rubric.red_flags.find((f) => f.code === mod.code);
      if (existingFlag) {
        lines.push(`### ${mod.code}`);
        lines.push('```diff');
        lines.push(`  - code: "${mod.code}"`);
        lines.push('    keywords:');
        for (const kw of existingFlag.keywords) {
          lines.push(`      - "${kw}"`);
        }
        for (const kw of mod.added_keywords) {
          lines.push(`+     - "${kw}"  # NEW`);
        }
        lines.push('```');
        lines.push(`> Reason: ${mod.reason}`);
        lines.push('');
      }
    }
  }

  // 새 red_flags
  if (newRedFlags.length > 0) {
    lines.push('## New Red Flags');
    lines.push('');
    for (const flag of newRedFlags) {
      lines.push('```diff');
      lines.push(`+ - code: "${flag.code}"`);
      lines.push('+   keywords:');
      for (const kw of flag.keywords) {
        lines.push(`+     - "${kw}"`);
      }
      lines.push(`+   reason: "${flag.reason}"`);
      lines.push(`+   severity: "${flag.severity}"`);
      lines.push('```');
      lines.push('');
    }
  }

  // 새 guardrails
  if (newGuardrails.length > 0) {
    lines.push('## New Guardrails');
    lines.push('');
    for (const guardrail of newGuardrails) {
      lines.push('```diff');
      lines.push(`+ - condition: "${guardrail.condition}"`);
      lines.push(`+   text: "${guardrail.text}"`);
      lines.push('```');
      lines.push('');
    }
  }

  if (
    modifiedRedFlags.length === 0 &&
    newRedFlags.length === 0 &&
    newGuardrails.length === 0
  ) {
    lines.push('No approved rules found. Nothing to update.');
  }

  return lines.join('\n');
}

/**
 * 제안을 파일로 저장
 */
export function saveProposal(proposal: RubricUpdateProposal): void {
  const yamlContent = yaml.dump(proposal, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  fs.writeFileSync(PROPOSAL_PATH, yamlContent, 'utf-8');
  console.log(`[INFO] Proposal saved to: ${PROPOSAL_PATH}`);
}

/**
 * 제안을 콘솔에 출력
 */
export function printProposal(proposal: RubricUpdateProposal): void {
  console.log('\n' + '='.repeat(60));
  console.log('RUBRIC UPDATE PROPOSAL');
  console.log('='.repeat(60));
  console.log(`Generated: ${proposal.generated_at}`);
  console.log(`Source Cases: ${proposal.source_cases.join(', ') || 'None'}`);
  console.log('');
  console.log('Summary:');
  console.log(`  - Modified Red Flags: ${proposal.modified_red_flags.length}`);
  console.log(`  - New Red Flags: ${proposal.new_red_flags.length}`);
  console.log(`  - New Guardrails: ${proposal.new_guardrails.length}`);
  console.log('');
  console.log('-'.repeat(60));
  console.log('DIFF PREVIEW');
  console.log('-'.repeat(60));
  console.log(proposal.diff_preview);
  console.log('='.repeat(60));
  console.log('');
  console.log('[NOTE] This is a proposal only. Review and apply manually.');
  console.log(`[NOTE] Full proposal saved to: ${PROPOSAL_PATH}`);
}

/**
 * 제안된 변경사항을 실제로 적용 (수동 확인 후)
 */
export function applyProposal(proposal: RubricUpdateProposal, dryRun: boolean = true): void {
  if (dryRun) {
    console.log('[DRY RUN] Changes would be applied:');
    printProposal(proposal);
    return;
  }

  const rubric = loadRubric();

  // 키워드 추가
  for (const mod of proposal.modified_red_flags) {
    const flag = rubric.red_flags.find((f) => f.code === mod.code);
    if (flag) {
      flag.keywords.push(...mod.added_keywords);
    }
  }

  // 새 red_flags 추가
  rubric.red_flags.push(...proposal.new_red_flags);

  // 새 guardrails 추가
  rubric.safe_guardrails.push(...proposal.new_guardrails);

  // 버전 업데이트
  const [major, minor] = rubric.version.split('.').map(Number);
  rubric.version = `${major}.${minor + 1}`;

  // 저장
  const yamlContent = yaml.dump(rubric, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
  });

  fs.writeFileSync(RUBRIC_PATH, yamlContent, 'utf-8');
  console.log(`[OK] Rubric updated to version ${rubric.version}`);
  console.log('[IMPORTANT] Review changes and commit manually.');
}

// CLI 실행
if (require.main === module) {
  console.log('=== Rubric Update Proposal ===\n');

  const proposal = generateUpdateProposal();
  saveProposal(proposal);
  printProposal(proposal);

  console.log('\n=== Done ===');
}
