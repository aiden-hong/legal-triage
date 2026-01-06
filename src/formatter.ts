/**
 * Output Formatter - Human-readable and JSON output
 */

import chalk from 'chalk';
import { TriageOutput, DetectedRedFlag } from './types';

export interface FormatOptions {
  json: boolean;
  pretty: boolean;
  color: boolean;
}

const DEFAULT_OPTIONS: FormatOptions = {
  json: false,
  pretty: true,
  color: true,
};

/**
 * 트리아지 결과를 포맷팅
 */
export function formatOutput(
  output: TriageOutput,
  options: Partial<FormatOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.json) {
    return formatJson(output, opts.pretty);
  }

  return formatHumanReadable(output, opts.color);
}

/**
 * JSON 형식 출력
 */
function formatJson(output: TriageOutput, pretty: boolean): string {
  if (pretty) {
    return JSON.stringify(output, null, 2);
  }
  return JSON.stringify(output);
}

/**
 * 사람이 읽기 쉬운 형식 출력
 */
function formatHumanReadable(output: TriageOutput, useColor: boolean): string {
  const c = useColor ? chalk : createNoopChalk();
  const lines: string[] = [];

  // 헤더
  lines.push(c.bold('═══════════════════════════════════════════════════════════'));
  lines.push(c.bold('                    LEGAL TRIAGE RESULT                    '));
  lines.push(c.bold('═══════════════════════════════════════════════════════════'));
  lines.push('');

  // 라우팅 결과
  const routingColor =
    output.routing === 'TYPE_1' ? c.red.bold : c.green.bold;
  const routingEmoji = output.routing === 'TYPE_1' ? '[!]' : '[v]';

  lines.push(
    `${routingEmoji} Routing: ${routingColor(output.routing)}`
  );
  lines.push(`   Confidence: ${formatConfidence(output.confidence, c)}`);
  lines.push(`   Next Step: ${formatNextStep(output.recommended_next_step, c)}`);
  lines.push('');

  // Red Flags
  if (output.red_flags.length > 0) {
    lines.push(c.red.bold('RED FLAGS DETECTED:'));
    lines.push(c.dim('─'.repeat(55)));
    for (const flag of output.red_flags) {
      lines.push(formatRedFlag(flag, c));
    }
    lines.push('');
  }

  // 누락된 정보 질문
  if (output.missing_info_questions.length > 0) {
    lines.push(c.yellow.bold('MISSING INFORMATION:'));
    lines.push(c.dim('─'.repeat(55)));
    for (const question of output.missing_info_questions) {
      lines.push(`  [?] ${question}`);
    }
    lines.push('');
  }

  // 가드레일
  if (output.safe_guardrails.length > 0) {
    lines.push(c.blue.bold('REQUIRED GUARDRAILS:'));
    lines.push(c.dim('─'.repeat(55)));
    for (const guardrail of output.safe_guardrails) {
      lines.push(`  [>] ${guardrail}`);
    }
    lines.push('');
  }

  // 푸터
  lines.push(c.dim('───────────────────────────────────────────────────────────'));
  lines.push(c.dim(`Timestamp: ${output.timestamp}`));
  if (output.input_hash) {
    lines.push(c.dim(`Input Hash: ${output.input_hash}`));
  }
  lines.push('');

  // 법적 고지
  lines.push(c.dim.italic('* This is a risk triage result, NOT legal advice.'));
  lines.push(c.dim.italic('* When in doubt, always consult with the legal team.'));

  return lines.join('\n');
}

/**
 * 신뢰도 포맷팅
 */
function formatConfidence(confidence: number, c: typeof chalk): string {
  const percent = Math.round(confidence * 100);
  const bar = createProgressBar(confidence, 20);

  if (confidence >= 0.8) {
    return `${c.green(bar)} ${percent}%`;
  } else if (confidence >= 0.6) {
    return `${c.yellow(bar)} ${percent}%`;
  } else {
    return `${c.red(bar)} ${percent}%`;
  }
}

/**
 * 프로그레스 바 생성
 */
function createProgressBar(value: number, width: number): string {
  const filled = Math.round(value * width);
  const empty = width - filled;
  return '[' + '#'.repeat(filled) + '-'.repeat(empty) + ']';
}

/**
 * 다음 단계 포맷팅
 */
function formatNextStep(nextStep: string, c: typeof chalk): string {
  if (nextStep === 'LEGAL_REVIEW') {
    return c.red('LEGAL_REVIEW - Request legal team review');
  }
  return c.green('PROCEED_WITH_GUARDRAILS - Can proceed with conditions');
}

/**
 * Red Flag 포맷팅
 */
function formatRedFlag(flag: DetectedRedFlag, c: typeof chalk): string {
  const severityColor = getSeverityColor(flag.severity, c);
  const severityBadge = `[${flag.severity.toUpperCase()}]`;

  return [
    `  ${severityColor(severityBadge)} ${c.bold(flag.code)}`,
    `     Reason: ${flag.reason}`,
    `     Matched: ${flag.matchedKeywords.join(', ')}`,
  ].join('\n');
}

/**
 * 심각도별 색상
 */
function getSeverityColor(
  severity: string,
  c: typeof chalk
): (text: string) => string {
  switch (severity) {
    case 'critical':
      return c.bgRed.white.bold;
    case 'high':
      return c.red.bold;
    case 'medium':
      return c.yellow.bold;
    case 'low':
      return c.blue;
    default:
      return c.white;
  }
}

/**
 * 색상 비활성화용 noop chalk
 */
function createNoopChalk(): typeof chalk {
  const identity = (str: string) => str;
  const createChain = (): unknown => {
    const fn = (str: string) => str;
    return new Proxy(fn, {
      get: () => createChain(),
    });
  };
  return createChain() as typeof chalk;
}

/**
 * 요약 형식 출력 (한 줄)
 */
export function formatSummary(output: TriageOutput): string {
  const flagCodes = output.red_flags.map((f) => f.code).join(',') || 'none';
  return `[${output.routing}] confidence=${output.confidence.toFixed(2)} flags=${flagCodes} next=${output.recommended_next_step}`;
}
