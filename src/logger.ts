/**
 * Audit Logger - Privacy-safe logging
 *
 * 원문 데이터를 저장하지 않고 해시/라벨만 저장하는 프라이버시 모드 지원
 */

import * as fs from 'fs';
import * as path from 'path';
import { AuditLogEntry, LoggerOptions, TriageOutput } from './types';

const DEFAULT_LOG_DIR = path.join(process.cwd(), '.legal-triage-logs');

export class AuditLogger {
  private options: LoggerOptions;
  private logFilePath: string;

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      privacyMode: options.privacyMode ?? true,
      logFile: options.logFile,
    };

    if (this.options.logFile) {
      this.logFilePath = this.options.logFile;
    } else {
      const dateStr = new Date().toISOString().split('T')[0];
      this.logFilePath = path.join(DEFAULT_LOG_DIR, `audit-${dateStr}.jsonl`);
    }
  }

  /**
   * 트리아지 결과를 감사 로그에 기록
   */
  public log(output: TriageOutput): void {
    if (!this.options.enabled) {
      return;
    }

    const entry: AuditLogEntry = {
      timestamp: output.timestamp,
      input_hash: output.input_hash || 'unknown',
      routing: output.routing,
      confidence: output.confidence,
      red_flag_codes: output.red_flags.map((f) => f.code),
      missing_info_count: output.missing_info_questions.length,
      guardrail_count: output.safe_guardrails.length,
    };

    this.writeEntry(entry);
  }

  /**
   * 로그 엔트리 파일에 기록
   */
  private writeEntry(entry: AuditLogEntry): void {
    try {
      this.ensureLogDir();
      const line = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.logFilePath, line, 'utf-8');
    } catch (error) {
      // 로그 실패는 조용히 처리 (메인 기능에 영향 주지 않음)
      if (process.env.DEBUG) {
        console.error('Failed to write audit log:', error);
      }
    }
  }

  /**
   * 로그 디렉토리 생성
   */
  private ensureLogDir(): void {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * 로그 파일 경로 조회
   */
  public getLogFilePath(): string {
    return this.logFilePath;
  }

  /**
   * 로그 읽기 (분석용)
   */
  public readLogs(): AuditLogEntry[] {
    if (!fs.existsSync(this.logFilePath)) {
      return [];
    }

    const content = fs.readFileSync(this.logFilePath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    return lines.map((line) => JSON.parse(line) as AuditLogEntry);
  }

  /**
   * 통계 요약
   */
  public getSummary(): {
    totalCount: number;
    type1Count: number;
    type2Count: number;
    topRedFlags: { code: string; count: number }[];
  } {
    const logs = this.readLogs();

    const type1Count = logs.filter((l) => l.routing === 'TYPE_1').length;
    const type2Count = logs.filter((l) => l.routing === 'TYPE_2').length;

    const flagCounts: Record<string, number> = {};
    for (const log of logs) {
      for (const code of log.red_flag_codes) {
        flagCounts[code] = (flagCounts[code] || 0) + 1;
      }
    }

    const topRedFlags = Object.entries(flagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([code, count]) => ({ code, count }));

    return {
      totalCount: logs.length,
      type1Count,
      type2Count,
      topRedFlags,
    };
  }

  /**
   * 로그 비활성화
   */
  public disable(): void {
    this.options.enabled = false;
  }

  /**
   * 로그 활성화
   */
  public enable(): void {
    this.options.enabled = true;
  }
}

/**
 * 기본 로거 인스턴스 생성
 */
export function createLogger(options?: Partial<LoggerOptions>): AuditLogger {
  return new AuditLogger(options);
}
