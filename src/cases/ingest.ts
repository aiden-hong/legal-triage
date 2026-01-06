/**
 * 케이스 인제스트 (Case Ingest)
 *
 * data/cases/ 디렉토리를 스캔하여 index.jsonl 생성
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { CaseMetadata, CaseIndexEntry } from '../types';

const CASES_DIR = path.join(__dirname, '../../data/cases');
const INDEX_FILE = path.join(CASES_DIR, 'index.jsonl');

/**
 * 케이스 디렉토리인지 확인 (템플릿 제외)
 */
function isCaseDirectory(dirName: string): boolean {
  // .templates 등 숨김/특수 디렉토리 제외
  if (dirName.startsWith('.')) return false;
  // YYYY-MM-DD_ 패턴으로 시작하는지 확인
  return /^\d{4}-\d{2}-\d{2}_/.test(dirName);
}

/**
 * 단일 케이스 폴더 파싱
 */
export function parseCase(casePath: string): CaseMetadata | null {
  const caseYamlPath = path.join(casePath, 'case.yaml');

  if (!fs.existsSync(caseYamlPath)) {
    console.warn(`[WARN] case.yaml not found: ${casePath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(caseYamlPath, 'utf-8');
    const caseData = yaml.load(content) as CaseMetadata;
    return caseData;
  } catch (error) {
    console.error(`[ERROR] Failed to parse case.yaml: ${casePath}`, error);
    return null;
  }
}

/**
 * 케이스를 인덱스 엔트리로 변환
 */
function caseToIndexEntry(caseData: CaseMetadata, casePath: string): CaseIndexEntry {
  return {
    case_id: caseData.case_id,
    path: path.relative(CASES_DIR, casePath),
    date: caseData.date,
    team: caseData.team,
    decision: caseData.decision,
    rule_codes: caseData.rule_codes || [],
    title: caseData.title,
    indexed_at: new Date().toISOString(),
  };
}

/**
 * 모든 케이스 스캔 및 인덱스 생성
 */
export function ingestCases(): CaseIndexEntry[] {
  console.log(`[INFO] Scanning cases in: ${CASES_DIR}`);

  if (!fs.existsSync(CASES_DIR)) {
    console.error(`[ERROR] Cases directory not found: ${CASES_DIR}`);
    return [];
  }

  const entries: CaseIndexEntry[] = [];
  const dirs = fs.readdirSync(CASES_DIR, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory() || !isCaseDirectory(dir.name)) {
      continue;
    }

    const casePath = path.join(CASES_DIR, dir.name);
    const caseData = parseCase(casePath);

    if (caseData) {
      const entry = caseToIndexEntry(caseData, casePath);
      entries.push(entry);
      console.log(`[OK] Indexed: ${caseData.case_id}`);
    }
  }

  return entries;
}

/**
 * 인덱스를 JSONL 파일로 저장
 */
export function saveIndex(entries: CaseIndexEntry[]): void {
  const lines = entries.map((e) => JSON.stringify(e)).join('\n');
  fs.writeFileSync(INDEX_FILE, lines + '\n', 'utf-8');
  console.log(`[INFO] Index saved to: ${INDEX_FILE}`);
  console.log(`[INFO] Total cases indexed: ${entries.length}`);
}

/**
 * 인덱스 파일 로드
 */
export function loadIndex(): CaseIndexEntry[] {
  if (!fs.existsSync(INDEX_FILE)) {
    console.warn(`[WARN] Index file not found: ${INDEX_FILE}`);
    return [];
  }

  const content = fs.readFileSync(INDEX_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter((l) => l.length > 0);
  return lines.map((line) => JSON.parse(line) as CaseIndexEntry);
}

/**
 * 케이스 ID로 케이스 데이터 조회
 */
export function getCaseById(caseId: string): CaseMetadata | null {
  const index = loadIndex();
  const entry = index.find((e) => e.case_id === caseId);

  if (!entry) {
    return null;
  }

  const casePath = path.join(CASES_DIR, entry.path);
  return parseCase(casePath);
}

/**
 * 모든 케이스 데이터 로드
 */
export function getAllCases(): CaseMetadata[] {
  const index = loadIndex();
  const cases: CaseMetadata[] = [];

  for (const entry of index) {
    const casePath = path.join(CASES_DIR, entry.path);
    const caseData = parseCase(casePath);
    if (caseData) {
      cases.push(caseData);
    }
  }

  return cases;
}

// CLI 실행
if (require.main === module) {
  console.log('=== Case Ingest ===\n');
  const entries = ingestCases();
  saveIndex(entries);
  console.log('\n=== Done ===');
}
