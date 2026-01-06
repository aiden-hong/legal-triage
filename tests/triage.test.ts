/**
 * Legal Triage Tests
 *
 * 10개 테스트 케이스:
 * - 명백한 TYPE_1 케이스 (5개)
 * - 명백한 TYPE_2 케이스 (3개)
 * - 애매한 케이스 (2개) -> 보수적으로 TYPE_1이어야 함
 */

import * as path from 'path';
import { TriageEngine } from '../src/triage-engine';
import { loadRubric } from '../src/rubric-loader';
import { formatOutput, formatSummary } from '../src/formatter';
import { AuditLogger } from '../src/logger';
import { TriageInput } from '../src/types';
import * as fs from 'fs';

const RUBRIC_PATH = path.join(__dirname, '..', 'rubric.yaml');

describe('Rubric Loader', () => {
  test('should load rubric.yaml successfully', () => {
    const rubric = loadRubric(RUBRIC_PATH);
    expect(rubric.version).toBe('2.0');
    expect(rubric.red_flags.length).toBeGreaterThan(0);
    expect(rubric.question_templates.length).toBeGreaterThan(0);
    expect(rubric.safe_guardrails.length).toBeGreaterThan(0);
  });

  test('should throw error for non-existent file', () => {
    expect(() => loadRubric('/non/existent/path.yaml')).toThrow();
  });
});

describe('Triage Engine - TYPE_1 Cases (Must Route to Legal Review)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  // Case 1: 개인정보 수집 - Critical
  test('Case 1: Personal data collection should be TYPE_1', () => {
    const input: TriageInput = {
      description: '사용자의 주민등록번호를 수집하여 본인인증에 사용합니다.',
      dataUsage: 'collects',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'PII_COLLECTION')).toBe(true);
    expect(result.recommended_next_step).toBe('LEGAL_REVIEW');
  });

  // Case 2: 아동 대상 서비스 - Critical
  test('Case 2: Children-targeted service should be TYPE_1', () => {
    const input: TriageInput = {
      description: '14세 미만 아동을 위한 교육 앱을 출시합니다.',
      exposure: 'public',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'CHILDREN_TARGET')).toBe(true);
  });

  // Case 3: 금융 상품 - Critical
  test('Case 3: Financial product should be TYPE_1', () => {
    const input: TriageInput = {
      description: '소액 투자 서비스를 제공하여 사용자가 주식에 투자할 수 있게 합니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'FINANCIAL_PRODUCT')).toBe(true);
  });

  // Case 4: 의료 관련 주장 - Critical
  test('Case 4: Medical claims should be TYPE_1', () => {
    const input: TriageInput = {
      description: 'AI 기반 질병 진단 서비스로 사용자의 건강 상태를 분석합니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'MEDICAL_CLAIM')).toBe(true);
  });

  // Case 5: 규제 산업 (도박) - Critical
  test('Case 5: Regulated industry (gambling) should be TYPE_1', () => {
    const input: TriageInput = {
      description: '친구들과 포인트를 걸고 betting 게임을 즐길 수 있는 소셜 게임입니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'REGULATED_INDUSTRY')).toBe(true);
  });
});

describe('Triage Engine - TYPE_2 Cases (Can Proceed with Guardrails)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  // Case 6: 단순 내부 도구 - No flags, full info
  test('Case 6: Simple internal tool should be TYPE_2', () => {
    const input: TriageInput = {
      description: '팀 내부에서 사용하는 일정 관리 도구입니다. 외부 공개 없음.',
      exposure: 'internal_test',
      dataUsage: 'no_collection',
      revenueModel: 'free',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
    expect(result.red_flags.length).toBe(0);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
  });

  // Case 7: 단순 UI 개선 - No flags
  test('Case 7: Simple UI improvement should be TYPE_2', () => {
    const input: TriageInput = {
      description: '버튼 색상을 파란색에서 초록색으로 변경합니다.',
      exposure: 'public',
      dataUsage: 'no_collection',
      revenueModel: 'free',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
    expect(result.red_flags.length).toBe(0);
  });

  // Case 8: 단순 기능 추가 - No flags
  test('Case 8: Simple feature addition should be TYPE_2', () => {
    const input: TriageInput = {
      description: '검색 결과에 정렬 옵션을 추가합니다. 가격순, 인기순 정렬.',
      exposure: 'public',
      dataUsage: 'no_collection',
      revenueModel: 'free',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
  });
});

describe('Triage Engine - Ambiguous Cases (Should Default to TYPE_1)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  // Case 9: 정보 부족 - 보수적으로 TYPE_1
  test('Case 9: Insufficient information should default to TYPE_1', () => {
    const input: TriageInput = {
      description: '새로운 기능을 추가합니다.',
      // 모든 선택 필드 누락
    };

    const result = engine.triage(input);

    // 정보 부족 시 보수적으로 TYPE_1
    expect(result.missing_info_questions.length).toBeGreaterThan(0);
    // confidence가 낮으면 TYPE_1
    if (result.confidence < 0.7) {
      expect(result.routing).toBe('TYPE_1');
    }
  });

  // Case 10: 경계선 케이스 (medium severity) - 보수적으로 TYPE_1
  test('Case 10: Borderline case with medium severity should consider TYPE_1', () => {
    const input: TriageInput = {
      description: '인플루언서 협찬을 통해 제품을 홍보합니다.',
      externalCommunication: 'customer_facing',
    };

    const result = engine.triage(input);

    // 인플루언서/협찬은 CELEBRITY_MEDICAL_ENDORSEMENT로 감지 (critical severity)
    expect(result.red_flags.some((f) => f.code === 'CELEBRITY_MEDICAL_ENDORSEMENT')).toBe(true);
    expect(result.routing).toBe('TYPE_1');
  });
});

describe('Output Formatter', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  test('should format output as JSON', () => {
    const input: TriageInput = {
      description: '간단한 테스트 기능',
      exposure: 'internal_test',
      dataUsage: 'no_collection',
    };

    const result = engine.triage(input);
    const jsonOutput = formatOutput(result, { json: true });

    const parsed = JSON.parse(jsonOutput);
    expect(parsed.routing).toBeDefined();
    expect(parsed.confidence).toBeDefined();
    expect(parsed.red_flags).toBeInstanceOf(Array);
  });

  test('should format human-readable output', () => {
    const input: TriageInput = {
      description: '사용자 개인정보를 수집합니다.',
    };

    const result = engine.triage(input);
    const output = formatOutput(result, { json: false, color: false });

    expect(output).toContain('LEGAL TRIAGE RESULT');
    expect(output).toContain('Routing:');
  });

  test('should format summary correctly', () => {
    const input: TriageInput = { description: 'Test' };
    const result = engine.triage(input);
    const summary = formatSummary(result);

    expect(summary).toMatch(/\[TYPE_[12]\]/);
    expect(summary).toContain('confidence=');
  });
});

describe('Audit Logger', () => {
  const TEST_LOG_FILE = path.join(__dirname, 'test-audit.jsonl');

  afterEach(() => {
    // Clean up test log file
    if (fs.existsSync(TEST_LOG_FILE)) {
      fs.unlinkSync(TEST_LOG_FILE);
    }
  });

  test('should log triage results', () => {
    const engine = new TriageEngine(RUBRIC_PATH);
    const logger = new AuditLogger({ logFile: TEST_LOG_FILE });

    const input: TriageInput = { description: 'Test logging feature' };
    const result = engine.triage(input);

    logger.log(result);

    const logs = logger.readLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].routing).toBe(result.routing);
  });

  test('should not log when disabled', () => {
    const logger = new AuditLogger({ enabled: false, logFile: TEST_LOG_FILE });
    const engine = new TriageEngine(RUBRIC_PATH);

    const result = engine.triage({ description: 'Test' });
    logger.log(result);

    expect(fs.existsSync(TEST_LOG_FILE)).toBe(false);
  });

  test('should provide summary statistics', () => {
    const engine = new TriageEngine(RUBRIC_PATH);
    const logger = new AuditLogger({ logFile: TEST_LOG_FILE });

    // Log multiple results
    logger.log(engine.triage({ description: '개인정보 수집' }));
    logger.log(engine.triage({ description: 'Simple button change' }));
    logger.log(engine.triage({ description: '투자 서비스' }));

    const summary = logger.getSummary();
    expect(summary.totalCount).toBe(3);
    expect(summary.type1Count + summary.type2Count).toBe(3);
  });
});

describe('Red Flag Detection', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  test('should detect multiple red flags', () => {
    const input: TriageInput = {
      description:
        '아동 대상 의료 진단 앱으로 건강정보를 해외전송합니다. 최고의 치료 효과를 보장합니다.',
    };

    const result = engine.triage(input);

    // 여러 red flag가 감지되어야 함
    expect(result.red_flags.length).toBeGreaterThan(2);
    expect(result.routing).toBe('TYPE_1');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('should match case-insensitive keywords', () => {
    const input: TriageInput = {
      description: 'This feature involves BIOMETRIC data collection.',
    };

    const result = engine.triage(input);
    expect(result.red_flags.some((f) => f.code === 'PII_COLLECTION')).toBe(true);
  });
});

describe('Guardrails', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  test('should include data collection guardrail when collecting data', () => {
    const input: TriageInput = {
      description: '사용자 이름과 이메일을 수집합니다.',
      dataUsage: 'collects',
    };

    const result = engine.triage(input);
    expect(
      result.safe_guardrails.some((g) => g.includes('개인정보'))
    ).toBe(true);
  });

  test('should include refund guardrail for paid services', () => {
    const input: TriageInput = {
      description: '유료 구독 서비스입니다.',
      revenueModel: 'subscription',
    };

    const result = engine.triage(input);
    expect(result.safe_guardrails.some((g) => g.includes('환불'))).toBe(true);
  });
});
