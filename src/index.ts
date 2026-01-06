#!/usr/bin/env node
/**
 * Legal Triage CLI
 *
 * Conservative legal risk triage system for product ideas/features/campaigns
 */

import { Command } from 'commander';
import * as readline from 'readline';
import { TriageEngine } from './triage-engine';
import { AuditLogger } from './logger';
import { formatOutput, formatSummary } from './formatter';
import { TriageInput } from './types';

const VERSION = '1.0.0';

const program = new Command();

program
  .name('legal-triage')
  .description('Conservative legal risk triage system')
  .version(VERSION);

// 메인 분류 커맨드
program
  .command('check')
  .description('Triage a product idea/feature/campaign')
  .option('-d, --description <text>', 'Description of the idea/feature')
  .option('-e, --exposure <type>', 'Exposure scope: public|members_only|specific_group|internal_test')
  .option('-u, --data-usage <type>', 'Data usage: collects|no_collection|unclear')
  .option('-r, --revenue <type>', 'Revenue model: free|paid_once|subscription|ads|commission')
  .option('-c, --communication <type>', 'External comm: customer_facing|media|internal')
  .option('-b, --cross-border <type>', 'Cross-border: domestic_only|includes_overseas|unclear')
  .option('-j, --json', 'Output as JSON')
  .option('--no-color', 'Disable colored output')
  .option('--no-log', 'Disable audit logging')
  .option('-i, --interactive', 'Interactive mode')
  .action(async (options) => {
    try {
      const engine = new TriageEngine();
      const logger = new AuditLogger({ enabled: options.log !== false });

      let input: TriageInput;

      if (options.interactive || !options.description) {
        input = await interactiveInput();
      } else {
        input = parseCliInput(options);
      }

      const result = engine.triage(input);
      logger.log(result);

      const output = formatOutput(result, {
        json: options.json,
        color: options.color !== false,
      });

      console.log(output);

      // JSON 모드가 아닌 경우 JSON도 함께 출력
      if (!options.json) {
        console.log('\n--- JSON Output ---');
        console.log(formatOutput(result, { json: true, pretty: true }));
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// 로그 통계 커맨드
program
  .command('stats')
  .description('Show audit log statistics')
  .option('-f, --file <path>', 'Log file path')
  .action((options) => {
    try {
      const logger = new AuditLogger({ logFile: options.file });
      const summary = logger.getSummary();

      console.log('=== Legal Triage Statistics ===\n');
      console.log(`Total triages: ${summary.totalCount}`);
      console.log(`TYPE_1 (Legal Review): ${summary.type1Count} (${percent(summary.type1Count, summary.totalCount)})`);
      console.log(`TYPE_2 (Proceed): ${summary.type2Count} (${percent(summary.type2Count, summary.totalCount)})`);
      console.log('\nTop Red Flags:');
      for (const flag of summary.topRedFlags) {
        console.log(`  - ${flag.code}: ${flag.count}`);
      }
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

// 간단 분류 커맨드 (한 줄 출력)
program
  .command('quick <description>')
  .description('Quick triage with one-line output')
  .action((description) => {
    try {
      const engine = new TriageEngine();
      const result = engine.triage({ description });
      console.log(formatSummary(result));
    } catch (error) {
      console.error('Error:', (error as Error).message);
      process.exit(1);
    }
  });

/**
 * CLI 옵션 파싱
 */
function parseCliInput(options: Record<string, string>): TriageInput {
  return {
    description: options.description,
    exposure: options.exposure as TriageInput['exposure'],
    dataUsage: options.dataUsage as TriageInput['dataUsage'],
    revenueModel: options.revenue as TriageInput['revenueModel'],
    externalCommunication: options.communication as TriageInput['externalCommunication'],
    crossBorder: options.crossBorder as TriageInput['crossBorder'],
  };
}

/**
 * 인터랙티브 입력 모드
 */
async function interactiveInput(): Promise<TriageInput> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log('\n=== Legal Triage Interactive Mode ===\n');

  const description = await question(
    'Describe your product idea/feature/campaign:\n> '
  );

  console.log('\nOptional fields (press Enter to skip):\n');

  const exposureOptions = ['public', 'members_only', 'specific_group', 'internal_test'];
  const exposure = await selectOption(
    question,
    'Exposure scope',
    exposureOptions
  );

  const dataOptions = ['collects', 'no_collection', 'unclear'];
  const dataUsage = await selectOption(question, 'Data usage', dataOptions);

  const revenueOptions = ['free', 'paid_once', 'subscription', 'ads', 'commission'];
  const revenueModel = await selectOption(
    question,
    'Revenue model',
    revenueOptions
  );

  const commOptions = ['customer_facing', 'media', 'internal'];
  const externalCommunication = await selectOption(
    question,
    'External communication',
    commOptions
  );

  const borderOptions = ['domestic_only', 'includes_overseas', 'unclear'];
  const crossBorder = await selectOption(
    question,
    'Cross-border scope',
    borderOptions
  );

  rl.close();

  return {
    description,
    exposure: exposure as TriageInput['exposure'],
    dataUsage: dataUsage as TriageInput['dataUsage'],
    revenueModel: revenueModel as TriageInput['revenueModel'],
    externalCommunication: externalCommunication as TriageInput['externalCommunication'],
    crossBorder: crossBorder as TriageInput['crossBorder'],
  };
}

/**
 * 옵션 선택 헬퍼
 */
async function selectOption(
  question: (prompt: string) => Promise<string>,
  label: string,
  options: string[]
): Promise<string | undefined> {
  const optionsStr = options.map((o, i) => `${i + 1}. ${o}`).join('  ');
  const answer = await question(`${label} [${optionsStr}]: `);

  if (!answer.trim()) {
    return undefined;
  }

  const idx = parseInt(answer, 10) - 1;
  if (idx >= 0 && idx < options.length) {
    return options[idx];
  }

  // 직접 입력한 경우
  if (options.includes(answer)) {
    return answer;
  }

  return undefined;
}

/**
 * 퍼센트 계산
 */
function percent(value: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

// CLI 실행
program.parse(process.argv);

// 인자 없이 실행 시 도움말 표시
if (process.argv.length === 2) {
  program.help();
}

// 모듈로서 export (테스트용)
export { TriageEngine, AuditLogger, formatOutput, formatSummary };
export * from './types';
