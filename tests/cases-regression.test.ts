/**
 * 케이스 기반 회귀 테스트 (자동 생성)
 *
 * 이 파일은 src/cases/generateTests.ts에 의해 자동 생성됩니다.
 * 직접 수정하지 마세요. 케이스 데이터를 수정한 후 재생성하세요.
 *
 * 생성 시각: 2026-01-06T16:48:14.537Z
 * 케이스 수: 1
 */

import * as path from 'path';
import { TriageEngine } from '../src/triage-engine';
import { TriageInput } from '../src/types';

const RUBRIC_PATH = path.join(__dirname, '..', 'rubric.yaml');

describe('케이스 회귀 테스트 - TYPE_1 (법무 검토 필요)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  // Case 1: 2026-01-07_sns-campaign-botox
  test('보톡스 시술 SNS 캠페인 검토', () => {
    const input: TriageInput = {
      description: '인스타그램 및 앱 홈 배너로 노출되는 보톡스 시술 홍보 캠페인. 전후사진과 할인 이벤트 문구, 확실한 효과 보장 표현이 포함되어 있어 법무 검토 요청. (키워드: 전후사진, 비포애프터, 50% 할인)',
    };

    const result = engine.triage(input);

    // 기대 결과: TYPE_1
    expect(result.routing).toBe('TYPE_1');

    // 기대 rule_codes: 'BEFORE_AFTER_PHOTO', 'PRICE_DISCOUNT_EVENT', 'EFFECT_GUARANTEE'
    const detectedCodes = result.red_flags.map((f) => f.code);
    expect(detectedCodes).toContain('BEFORE_AFTER_PHOTO');
    expect(detectedCodes).toContain('PRICE_DISCOUNT_EVENT');
    expect(detectedCodes).toContain('EFFECT_GUARANTEE');
  });
});

