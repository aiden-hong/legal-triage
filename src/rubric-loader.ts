/**
 * Rubric Loader - Parses rubric.yaml configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { Rubric, RedFlag, QuestionTemplate, Guardrail, RoutingPolicy } from './types';

const DEFAULT_RUBRIC_PATH = path.join(__dirname, '..', 'rubric.yaml');

export function loadRubric(rubricPath: string = DEFAULT_RUBRIC_PATH): Rubric {
  if (!fs.existsSync(rubricPath)) {
    throw new Error(`Rubric file not found: ${rubricPath}`);
  }

  const fileContent = fs.readFileSync(rubricPath, 'utf-8');
  const parsed = yaml.load(fileContent) as Record<string, unknown>;

  return validateRubric(parsed);
}

function validateRubric(data: Record<string, unknown>): Rubric {
  if (!data.version || typeof data.version !== 'string') {
    throw new Error('Invalid rubric: missing version');
  }

  if (!Array.isArray(data.red_flags)) {
    throw new Error('Invalid rubric: red_flags must be an array');
  }

  if (!Array.isArray(data.question_templates)) {
    throw new Error('Invalid rubric: question_templates must be an array');
  }

  if (!Array.isArray(data.safe_guardrails)) {
    throw new Error('Invalid rubric: safe_guardrails must be an array');
  }

  if (!data.routing_policy || typeof data.routing_policy !== 'object') {
    throw new Error('Invalid rubric: missing routing_policy');
  }

  const red_flags: RedFlag[] = (data.red_flags as unknown[]).map((flag, index) => {
    const f = flag as Record<string, unknown>;
    if (!f.code || !f.keywords || !f.reason || !f.severity) {
      throw new Error(`Invalid red_flag at index ${index}`);
    }
    return {
      code: String(f.code),
      keywords: f.keywords as string[],
      reason: String(f.reason),
      severity: f.severity as RedFlag['severity'],
    };
  });

  const question_templates: QuestionTemplate[] = (data.question_templates as unknown[]).map((q, index) => {
    const qt = q as Record<string, unknown>;
    if (!qt.category || !qt.question || !qt.options) {
      throw new Error(`Invalid question_template at index ${index}`);
    }
    return {
      category: String(qt.category),
      question: String(qt.question),
      options: qt.options as string[],
      trigger_if_unknown: qt.trigger_if_unknown as boolean | undefined,
      trigger_if_contains: qt.trigger_if_contains as string[] | undefined,
    };
  });

  const safe_guardrails: Guardrail[] = (data.safe_guardrails as unknown[]).map((g, index) => {
    const gr = g as Record<string, unknown>;
    if (!gr.condition || !gr.text) {
      throw new Error(`Invalid guardrail at index ${index}`);
    }
    return {
      condition: String(gr.condition),
      text: String(gr.text),
    };
  });

  const rp = data.routing_policy as Record<string, unknown>;
  const routing_policy: RoutingPolicy = {
    default: (rp.default as 'TYPE_1' | 'TYPE_2') || 'TYPE_1',
    confidence_threshold: (rp.confidence_threshold as number) || 0.7,
    missing_info_action: (rp.missing_info_action as 'TYPE_1' | 'TYPE_2') || 'TYPE_1',
  };

  return {
    version: String(data.version),
    red_flags,
    question_templates,
    safe_guardrails,
    routing_policy,
  };
}

export function getRubricPath(): string {
  return DEFAULT_RUBRIC_PATH;
}
