/**
 * 익명화 검증 스크립트
 *
 * 케이스 파일에서 개인정보/민감정보를 검사하여
 * 익명화가 제대로 되었는지 확인
 */

import * as fs from 'fs';
import * as path from 'path';
import { AnonymizationCheckResult, AnonymizationIssue } from '../types';
import { loadIndex } from './ingest';

const CASES_DIR = path.join(__dirname, '../../data/cases');

// 개인정보 패턴 (정규식)
const PII_PATTERNS: Array<{
  pattern: RegExp;
  type: AnonymizationIssue['type'];
  suggestion: string;
}> = [
  // 전화번호 (한국)
  {
    pattern: /01[0-9]-?\d{3,4}-?\d{4}/g,
    type: 'phone',
    suggestion: '[전화번호 삭제] 또는 "010-****-****"',
  },
  {
    pattern: /02-?\d{3,4}-?\d{4}/g,
    type: 'phone',
    suggestion: '[전화번호 삭제] 또는 "02-***-****"',
  },

  // 이메일
  {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    type: 'email',
    suggestion: '[이메일 삭제] 또는 "***@***.com"',
  },

  // 주민등록번호
  {
    pattern: /\d{6}-?[1-4]\d{6}/g,
    type: 'id_number',
    suggestion: '[주민등록번호 삭제] - 절대 저장하지 마세요!',
  },

  // 한국 실명 패턴 (명시적으로 이름을 지정하는 경우만)
  // "홍길동", "김철수" 등 실제 이름 형태 (이름: XXX 또는 담당: XXX)
  {
    pattern: /(?:이름|담당|작성자|연락처\s*이름)(?::|：)\s*([가-힣]{2,4})/g,
    type: 'name',
    suggestion: '"PM_A", "법무_1", "환자_A" 등 역할명으로 대체',
  },

  // 구체적인 병원명 패턴 (예: "강남XXX성형외과", "청담XXX클리닉")
  // 단, "성형외과", "피부과" 단독은 일반 용어로 허용
  {
    pattern: /([가-힣]{2,})(성형외과|피부과|의원|클리닉|한의원|병원)(?![_])/g,
    type: 'hospital',
    suggestion: '"병원_A", "클리닉_B" 등으로 익명화',
  },

  // 구체적 주소 패턴 (번지수 포함된 경우만)
  {
    pattern: /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\s]{0,10}(구|시|군)[^\s]{0,15}(동|로|길)\s*\d+/g,
    type: 'address',
    suggestion: '[구체적 주소 삭제] - 시/구 수준까지만 표기',
  },

  // 이미지 URL/경로
  {
    pattern: /https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp|bmp)/gi,
    type: 'image_ref',
    suggestion: '[이미지 URL 삭제] - "[이미지: 설명]"으로 대체',
  },

  // S3/CDN URL
  {
    pattern: /https?:\/\/[^\/\s]*(?:s3|cdn|storage|blob)[^\/\s]*\/[^\s<>"]+/gi,
    type: 'image_ref',
    suggestion: '[CDN URL 삭제]',
  },
];

// 익명화 예외 패턴 (이미 익명화된 것으로 간주)
const ANONYMIZED_PATTERNS = [
  /병원_[A-Z]/,
  /클리닉_[A-Z]/,
  /PM_[A-Z]/,
  /마케터_[A-Z]/,
  /법무_\d/,
  /환자_[A-Z]/,
  /의사_[A-Z]/,
  /\[REDACTED\]/,
  /\[삭제됨\]/,
  /\[익명화\]/,
];

// 허용되는 일반 용어 (false positive 방지)
const ALLOWED_TERMS = [
  '성형외과',
  '피부과',
  '정형외과',
  '내과',
  '외과',
  '치과',
  '한의원',
];

/**
 * 익명화 여부 또는 허용 용어인지 확인
 */
function isAlreadyAnonymized(text: string): boolean {
  // 이미 익명화된 패턴
  if (ANONYMIZED_PATTERNS.some((p) => p.test(text))) {
    return true;
  }
  // 허용되는 일반 용어 (단독으로 사용된 경우)
  if (ALLOWED_TERMS.some((term) => text === term || text.endsWith(term))) {
    return true;
  }
  return false;
}

/**
 * 파일 내용에서 개인정보 검사
 */
function checkFile(filePath: string): AnonymizationCheckResult {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues: AnonymizationIssue[] = [];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    for (const { pattern, type, suggestion } of PII_PATTERNS) {
      // 패턴 리셋 (global flag 때문에)
      pattern.lastIndex = 0;

      let match;
      while ((match = pattern.exec(line)) !== null) {
        const matched = match[0];

        // 이미 익명화된 패턴이면 스킵
        if (isAlreadyAnonymized(matched)) {
          continue;
        }

        issues.push({
          line: lineNum + 1,
          column: match.index + 1,
          type,
          matched,
          suggestion,
        });
      }
    }
  }

  return {
    passed: issues.length === 0,
    file: filePath,
    issues,
  };
}

/**
 * 케이스 디렉토리의 모든 파일 검사
 */
export function checkCase(casePath: string): AnonymizationCheckResult[] {
  const results: AnonymizationCheckResult[] = [];
  const files = ['request.md', 'response.md', 'case.yaml'];

  for (const file of files) {
    const filePath = path.join(casePath, file);
    if (fs.existsSync(filePath)) {
      results.push(checkFile(filePath));
    }
  }

  return results;
}

/**
 * 모든 케이스 검사
 */
export function checkAllCases(): Map<string, AnonymizationCheckResult[]> {
  const index = loadIndex();
  const allResults = new Map<string, AnonymizationCheckResult[]>();

  for (const entry of index) {
    const casePath = path.join(CASES_DIR, entry.path);
    const results = checkCase(casePath);
    allResults.set(entry.case_id, results);
  }

  return allResults;
}

/**
 * 검사 결과 출력
 */
export function printResults(results: Map<string, AnonymizationCheckResult[]>): boolean {
  let hasIssues = false;

  for (const [caseId, fileResults] of results) {
    const caseIssues = fileResults.filter((r) => !r.passed);

    if (caseIssues.length > 0) {
      hasIssues = true;
      console.log(`\n[FAIL] ${caseId}`);

      for (const result of caseIssues) {
        console.log(`  File: ${path.basename(result.file)}`);
        for (const issue of result.issues) {
          console.log(
            `    Line ${issue.line}, Col ${issue.column}: [${issue.type}] "${issue.matched}"`
          );
          console.log(`      → ${issue.suggestion}`);
        }
      }
    } else {
      console.log(`[OK] ${caseId}`);
    }
  }

  return !hasIssues;
}

/**
 * 단일 케이스 검사 및 결과 반환
 */
export function validateCase(casePath: string): boolean {
  const results = checkCase(casePath);
  const hasIssues = results.some((r) => !r.passed);

  if (hasIssues) {
    console.log(`[FAIL] Anonymization check failed for: ${casePath}`);
    for (const result of results) {
      if (!result.passed) {
        console.log(`  File: ${path.basename(result.file)}`);
        for (const issue of result.issues) {
          console.log(`    Line ${issue.line}: [${issue.type}] "${issue.matched}"`);
          console.log(`      → ${issue.suggestion}`);
        }
      }
    }
    return false;
  }

  console.log(`[OK] Anonymization check passed: ${casePath}`);
  return true;
}

// CLI 실행
if (require.main === module) {
  console.log('=== Anonymization Check ===\n');

  const args = process.argv.slice(2);

  if (args.length > 0) {
    // 특정 케이스 검사
    const casePath = path.resolve(args[0]);
    const passed = validateCase(casePath);
    process.exit(passed ? 0 : 1);
  } else {
    // 모든 케이스 검사
    const results = checkAllCases();
    const passed = printResults(results);

    console.log('\n=== Summary ===');
    console.log(`Total cases: ${results.size}`);
    console.log(`Status: ${passed ? 'ALL PASSED' : 'SOME FAILED'}`);

    process.exit(passed ? 0 : 1);
  }
}
