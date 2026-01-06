/**
 * 케이스 회귀테스트 자동 생성기
 *
 * 각 케이스의 decision(TYPE_1/TYPE_2)와 rule_codes를 기대값으로 삼고,
 * 분류기가 동일하게 분류하는지 테스트하는 코드 생성
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadIndex, parseCase } from './ingest';
import { CaseMetadata, CaseIndexEntry } from '../types';

const CASES_DIR = path.join(__dirname, '../../data/cases');
const OUTPUT_PATH = path.join(__dirname, '../../tests/cases-regression.test.ts');

/**
 * 테스트 케이스 생성을 위한 데이터 구조
 */
interface TestCaseData {
  caseId: string;
  title: string;
  summary: string;
  expectedDecision: 'TYPE_1' | 'TYPE_2';
  expectedRuleCodes: string[];
  prohibitedExpressions: string[];
}

/**
 * 케이스에서 테스트 데이터 추출
 */
function extractTestData(caseData: CaseMetadata): TestCaseData {
  return {
    caseId: caseData.case_id,
    title: caseData.title,
    summary: caseData.summary,
    expectedDecision: caseData.decision,
    expectedRuleCodes: caseData.rule_codes || [],
    prohibitedExpressions: caseData.prohibited_expressions || [],
  };
}

/**
 * 테스트 파일 헤더 생성
 */
function generateHeader(): string {
  return `/**
 * 케이스 기반 회귀 테스트 (자동 생성)
 *
 * 이 파일은 src/cases/generateTests.ts에 의해 자동 생성됩니다.
 * 직접 수정하지 마세요. 케이스 데이터를 수정한 후 재생성하세요.
 *
 * 생성 시각: ${new Date().toISOString()}
 * 케이스 수: __CASE_COUNT__
 */

import * as path from 'path';
import { TriageEngine } from '../src/triage-engine';
import { TriageInput } from '../src/types';

const RUBRIC_PATH = path.join(__dirname, '..', 'rubric.yaml');

`;
}

/**
 * 개별 테스트 케이스 생성
 */
function generateTestCase(testData: TestCaseData, index: number): string {
  // description 생성 (금지 표현이 있으면 포함)
  let description = testData.summary;
  if (testData.prohibitedExpressions.length > 0) {
    const exprs = testData.prohibitedExpressions.slice(0, 3).join(', ');
    description += ` (키워드: ${exprs})`;
  }

  // 이스케이프 처리
  const escapedDescription = description
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, ' ');

  const escapedTitle = testData.title
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");

  const expectedRuleCodes = testData.expectedRuleCodes
    .map((code) => `'${code}'`)
    .join(', ');

  return `
  // Case ${index + 1}: ${testData.caseId}
  test('${escapedTitle}', () => {
    const input: TriageInput = {
      description: '${escapedDescription}',
    };

    const result = engine.triage(input);

    // 기대 결과: ${testData.expectedDecision}
    expect(result.routing).toBe('${testData.expectedDecision}');
${
  testData.expectedRuleCodes.length > 0
    ? `
    // 기대 rule_codes: ${expectedRuleCodes}
    const detectedCodes = result.red_flags.map((f) => f.code);
${testData.expectedRuleCodes
  .map(
    (code) => `    expect(detectedCodes).toContain('${code}');`
  )
  .join('\n')}`
    : ''
}
  });
`;
}

/**
 * 전체 테스트 파일 생성
 */
export function generateTestFile(): string {
  const index = loadIndex();
  const testCases: TestCaseData[] = [];

  for (const entry of index) {
    const casePath = path.join(CASES_DIR, entry.path);
    const caseData = parseCase(casePath);

    if (caseData && caseData.decision) {
      testCases.push(extractTestData(caseData));
    }
  }

  if (testCases.length === 0) {
    return generateHeader().replace('__CASE_COUNT__', '0') + `
describe('케이스 회귀 테스트', () => {
  test.skip('케이스가 없습니다', () => {
    // data/cases/ 디렉토리에 케이스를 추가한 후 재생성하세요.
  });
});
`;
  }

  // TYPE_1과 TYPE_2로 분리
  const type1Cases = testCases.filter((tc) => tc.expectedDecision === 'TYPE_1');
  const type2Cases = testCases.filter((tc) => tc.expectedDecision === 'TYPE_2');

  let content = generateHeader().replace('__CASE_COUNT__', testCases.length.toString());

  // TYPE_1 테스트
  if (type1Cases.length > 0) {
    content += `describe('케이스 회귀 테스트 - TYPE_1 (법무 검토 필요)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });
`;

    type1Cases.forEach((tc, idx) => {
      content += generateTestCase(tc, idx);
    });

    content += `});\n\n`;
  }

  // TYPE_2 테스트
  if (type2Cases.length > 0) {
    content += `describe('케이스 회귀 테스트 - TYPE_2 (가드레일 적용 후 진행)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });
`;

    type2Cases.forEach((tc, idx) => {
      content += generateTestCase(tc, idx);
    });

    content += `});\n`;
  }

  return content;
}

/**
 * 테스트 파일 저장
 */
export function saveTestFile(): void {
  const content = generateTestFile();
  fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
  console.log(`[OK] Test file generated: ${OUTPUT_PATH}`);
}

/**
 * 테스트 파일 내용 미리보기
 */
export function previewTestFile(): void {
  const content = generateTestFile();
  console.log(content);
}

// CLI 실행
if (require.main === module) {
  console.log('=== Generate Case Regression Tests ===\n');

  const args = process.argv.slice(2);

  if (args.includes('--preview')) {
    previewTestFile();
  } else {
    saveTestFile();
  }

  console.log('\n=== Done ===');
}
