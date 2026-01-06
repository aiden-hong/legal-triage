/**
 * Triage Engine - Core classification logic
 *
 * 핵심 원칙: 보수적 분류 - 애매하면 무조건 TYPE_1 (법무 검토 필요)
 */

import * as crypto from 'crypto';
import {
  TriageInput,
  TriageOutput,
  Rubric,
  DetectedRedFlag,
  RoutingType,
  NextStep,
  QuestionTemplate,
} from './types';
import { loadRubric } from './rubric-loader';

export class TriageEngine {
  private rubric: Rubric;

  constructor(rubricPath?: string) {
    this.rubric = loadRubric(rubricPath);
  }

  /**
   * 메인 트리아지 함수
   */
  public triage(input: TriageInput): TriageOutput {
    const timestamp = new Date().toISOString();
    const inputHash = this.hashInput(input.description);

    // Step 1: Red flag 프리필터
    const detectedFlags = this.detectRedFlags(input.description);

    // Step 2: 누락된 정보 질문 생성
    const missingQuestions = this.generateMissingInfoQuestions(input);

    // Step 3: 가드레일 결정
    const guardrails = this.determineGuardrails(input, detectedFlags);

    // Step 4: 최종 라우팅 결정 (보수적 원칙 적용)
    const { routing, confidence } = this.calculateRouting(
      detectedFlags,
      missingQuestions,
      input
    );

    // Step 5: 추천 다음 단계
    const nextStep = this.determineNextStep(routing, confidence);

    return {
      routing,
      confidence,
      red_flags: detectedFlags,
      missing_info_questions: missingQuestions,
      safe_guardrails: guardrails,
      recommended_next_step: nextStep,
      timestamp,
      input_hash: inputHash,
    };
  }

  /**
   * Red flag 탐지 - 키워드 매칭
   */
  private detectRedFlags(description: string): DetectedRedFlag[] {
    const normalizedDesc = description.toLowerCase();
    const detected: DetectedRedFlag[] = [];

    for (const flag of this.rubric.red_flags) {
      const matchedKeywords: string[] = [];

      for (const keyword of flag.keywords) {
        if (normalizedDesc.includes(keyword.toLowerCase())) {
          matchedKeywords.push(keyword);
        }
      }

      if (matchedKeywords.length > 0) {
        detected.push({
          code: flag.code,
          reason: flag.reason,
          matchedKeywords,
          severity: flag.severity,
        });
      }
    }

    return detected;
  }

  /**
   * 누락된 정보에 대한 질문 생성
   */
  private generateMissingInfoQuestions(input: TriageInput): string[] {
    const questions: string[] = [];
    const normalizedDesc = input.description.toLowerCase();

    for (const template of this.rubric.question_templates) {
      let shouldAsk = false;

      // trigger_if_unknown: 해당 필드가 제공되지 않았으면 질문
      if (template.trigger_if_unknown) {
        shouldAsk = this.isCategoryMissing(template.category, input);
      }

      // trigger_if_contains: 설명에 특정 키워드가 있으면 질문
      if (template.trigger_if_contains) {
        for (const keyword of template.trigger_if_contains) {
          if (normalizedDesc.includes(keyword.toLowerCase())) {
            shouldAsk = true;
            break;
          }
        }
      }

      if (shouldAsk) {
        questions.push(template.question);
      }
    }

    return questions;
  }

  /**
   * 카테고리별 필드 누락 여부 확인
   */
  private isCategoryMissing(category: string, input: TriageInput): boolean {
    const categoryMapping: Record<string, keyof TriageInput> = {
      exposure: 'exposure',
      data_usage: 'dataUsage',
      revenue_model: 'revenueModel',
      external_communication: 'externalCommunication',
      cross_border: 'crossBorder',
    };

    const field = categoryMapping[category];
    if (!field) return false;

    return input[field] === undefined || input[field] === null;
  }

  /**
   * 적용할 가드레일 결정
   */
  private determineGuardrails(
    input: TriageInput,
    detectedFlags: DetectedRedFlag[]
  ): string[] {
    const guardrails: string[] = [];
    const normalizedDesc = input.description.toLowerCase();
    const flagCodes = detectedFlags.map((f) => f.code);

    for (const guardrail of this.rubric.safe_guardrails) {
      let shouldInclude = false;

      // 조건별 가드레일 매칭
      switch (guardrail.condition) {
        case 'data_collection':
          shouldInclude =
            input.dataUsage === 'collects' ||
            input.dataUsage === 'unclear' ||
            flagCodes.includes('PII_COLLECTION');
          break;

        case 'marketing':
          shouldInclude =
            normalizedDesc.includes('마케팅') ||
            normalizedDesc.includes('광고') ||
            normalizedDesc.includes('marketing') ||
            flagCodes.includes('EXAGGERATED_AD') ||
            flagCodes.includes('CELEBRITY_ENDORSEMENT');
          break;

        case 'user_content':
          shouldInclude =
            normalizedDesc.includes('ugc') ||
            normalizedDesc.includes('사용자 생성') ||
            normalizedDesc.includes('댓글') ||
            normalizedDesc.includes('리뷰') ||
            flagCodes.includes('USER_CONTENT_LIABILITY');
          break;

        case 'terms_update':
          shouldInclude =
            normalizedDesc.includes('약관') ||
            normalizedDesc.includes('정책 변경') ||
            normalizedDesc.includes('terms');
          break;

        case 'refund':
          shouldInclude =
            input.revenueModel === 'paid_once' ||
            input.revenueModel === 'subscription' ||
            flagCodes.includes('PAYMENT_HANDLING');
          break;
      }

      if (shouldInclude) {
        guardrails.push(guardrail.text);
      }
    }

    return guardrails;
  }

  /**
   * 최종 라우팅 및 신뢰도 계산
   * 보수적 원칙: 애매하면 TYPE_1
   */
  private calculateRouting(
    detectedFlags: DetectedRedFlag[],
    missingQuestions: string[],
    input: TriageInput
  ): { routing: RoutingType; confidence: number } {
    const policy = this.rubric.routing_policy;

    // Critical severity flag가 있으면 무조건 TYPE_1
    const hasCritical = detectedFlags.some((f) => f.severity === 'critical');
    if (hasCritical) {
      return { routing: 'TYPE_1', confidence: 0.95 };
    }

    // High severity flag가 있으면 TYPE_1 (높은 신뢰도)
    const hasHigh = detectedFlags.some((f) => f.severity === 'high');
    if (hasHigh) {
      return { routing: 'TYPE_1', confidence: 0.85 };
    }

    // Medium severity만 있는 경우
    const hasMedium = detectedFlags.some((f) => f.severity === 'medium');

    // 누락된 필수 정보가 많으면 TYPE_1
    if (missingQuestions.length >= 2) {
      return { routing: policy.missing_info_action, confidence: 0.6 };
    }

    // 대외 커뮤니케이션이면 TYPE_1
    if (
      input.externalCommunication === 'media' ||
      input.externalCommunication === 'customer_facing'
    ) {
      if (hasMedium) {
        return { routing: 'TYPE_1', confidence: 0.75 };
      }
    }

    // Medium flag만 있고, 정보가 충분한 경우
    if (hasMedium && missingQuestions.length < 2) {
      // 신뢰도가 threshold 미만이면 TYPE_1
      const confidence = 0.65;
      if (confidence < policy.confidence_threshold) {
        return { routing: 'TYPE_1', confidence };
      }
      return { routing: 'TYPE_2', confidence };
    }

    // Red flag 없고, 정보 충분한 경우 -> TYPE_2
    if (detectedFlags.length === 0 && missingQuestions.length === 0) {
      return { routing: 'TYPE_2', confidence: 0.9 };
    }

    // Red flag 없지만 정보 부족한 경우
    if (detectedFlags.length === 0 && missingQuestions.length > 0) {
      const confidence = 1 - missingQuestions.length * 0.15;
      if (confidence < policy.confidence_threshold) {
        return { routing: 'TYPE_1', confidence };
      }
      return { routing: 'TYPE_2', confidence };
    }

    // 기본값: 보수적으로 TYPE_1
    return { routing: policy.default, confidence: 0.5 };
  }

  /**
   * 추천 다음 단계 결정
   */
  private determineNextStep(routing: RoutingType, confidence: number): NextStep {
    if (routing === 'TYPE_1') {
      return 'LEGAL_REVIEW';
    }

    // TYPE_2이지만 신뢰도가 낮으면 법무 검토 권장
    if (confidence < 0.8) {
      return 'LEGAL_REVIEW';
    }

    return 'PROCEED_WITH_GUARDRAILS';
  }

  /**
   * 입력값 해싱 (프라이버시 보호)
   */
  private hashInput(description: string): string {
    return crypto.createHash('sha256').update(description).digest('hex').slice(0, 16);
  }

  /**
   * Rubric getter (테스트용)
   */
  public getRubric(): Rubric {
    return this.rubric;
  }
}

/**
 * 간편 사용을 위한 팩토리 함수
 */
export function createTriageEngine(rubricPath?: string): TriageEngine {
  return new TriageEngine(rubricPath);
}
