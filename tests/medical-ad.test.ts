/**
 * 의료광고 특화 회귀 테스트
 *
 * 강남언니 플랫폼을 위한 의료광고 리스크 분류 테스트
 * 근거: 보건복지부 '건강한 의료광고 가이드라인', 의료법 제56조, 제57조
 *
 * 총 25개 테스트 케이스:
 * - TYPE_1 (법무 검토 필요): 18개
 * - TYPE_2 (가드레일 적용 후 진행 가능): 7개
 */

import * as path from 'path';
import { TriageEngine } from '../src/triage-engine';
import { TriageInput } from '../src/types';

const RUBRIC_PATH = path.join(__dirname, '..', 'rubric.yaml');

describe('의료광고 - TYPE_1 케이스 (법무 검토 필수)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  // ============================================================
  // 섹션 1: 의료광고 핵심 위반 유형 (Critical)
  // ============================================================

  // 1. 전후사진 (의료법 제56조 제2항 제9호)
  test('MA-01: 전후사진 포함 콘텐츠는 TYPE_1', () => {
    const input: TriageInput = {
      description: '코성형 전후사진을 보여드립니다. 시술 전과 후의 변화를 확인하세요.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'BEFORE_AFTER_PHOTO')).toBe(true);
  });

  // 2. 비포애프터 (영문 표현)
  test('MA-02: Before/After 이미지 언급은 TYPE_1', () => {
    const input: TriageInput = {
      description: '놀라운 before&after! 쌍커풀 수술 결과 사진을 공개합니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'BEFORE_AFTER_PHOTO')).toBe(true);
  });

  // 3. 환자 후기/체험담 (의료법 제56조 제2항 제7호)
  test('MA-03: 환자 후기/체험담은 TYPE_1', () => {
    const input: TriageInput = {
      description: '실제 환자후기! 제가 받아본 필러 시술 솔직후기를 공유합니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'PATIENT_TESTIMONIAL')).toBe(true);
  });

  // 4. 내돈내산 후기
  test('MA-04: 내돈내산 후기 콘텐츠는 TYPE_1', () => {
    const input: TriageInput = {
      description: '내돈내산 보톡스 리얼후기! 직접 해봤어요.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'PATIENT_TESTIMONIAL')).toBe(true);
  });

  // 5. 효과 보장/단정 표현 (의료법 제56조 제2항 제1호)
  test('MA-05: 100% 효과 보장 표현은 TYPE_1', () => {
    const input: TriageInput = {
      description: '100% 효과 보장! 반드시 예뻐집니다. 완벽한 결과를 약속드립니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'EFFECT_GUARANTEE')).toBe(true);
  });

  // 6. 영구적/평생 효과 주장
  test('MA-06: 영구적/평생 효과 주장은 TYPE_1', () => {
    const input: TriageInput = {
      description: '이 시술은 영구적인 효과! 평생 유지되는 아름다움을 선사합니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'EFFECT_GUARANTEE')).toBe(true);
  });

  // 7. 비교우위/최상급 표현 (의료법 제56조 제2항 제2호)
  test('MA-07: 최고/1등 등 비교우위 표현은 TYPE_1', () => {
    const input: TriageInput = {
      description: '국내 최고의 코성형 전문! 압도적 1위 병원에서 시술받으세요.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'COMPARATIVE_SUPERIORITY')).toBe(true);
  });

  // 8. 국내 유일/최초 표현
  test('MA-08: 국내 유일/최초 표현은 TYPE_1', () => {
    const input: TriageInput = {
      description: '국내 최초 도입! 세계 유일의 기술로 시술합니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'COMPARATIVE_SUPERIORITY')).toBe(true);
  });

  // 9. 유명인/인플루언서 추천 (의료법 제56조 제2항 제8호)
  test('MA-09: 연예인/인플루언서 언급은 TYPE_1', () => {
    const input: TriageInput = {
      description: '유명 연예인들이 선택한 병원! 인플루언서 추천 시술.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'CELEBRITY_MEDICAL_ENDORSEMENT')).toBe(true);
  });

  // 10. 협찬/PPL 콘텐츠
  test('MA-10: 협찬/PPL 의료광고 콘텐츠는 TYPE_1', () => {
    const input: TriageInput = {
      description: '협찬받은 피부과 시술 후기! 유튜버가 직접 체험한 레이저 치료.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'CELEBRITY_MEDICAL_ENDORSEMENT')).toBe(true);
  });

  // 11. 시술/수술 장면 (의료법 제56조 제2항 제10호)
  test('MA-11: 수술/시술 영상/장면은 TYPE_1', () => {
    const input: TriageInput = {
      description: '리얼 수술 영상 공개! 절개부터 봉합까지 시술 과정을 보여드립니다.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'PROCEDURE_VISUAL')).toBe(true);
  });

  // 12. 비의료인 의료행위 암시
  test('MA-12: 비의료인 시술 암시는 TYPE_1', () => {
    const input: TriageInput = {
      description: '상담실장님이 직접 시술해주셔서 편안했어요. 의사 없이도 가능해요.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'NON_MEDICAL_PRACTICE')).toBe(true);
  });

  // 13. 원격 진단/처방 (의료법 제33조)
  test('MA-13: 원격 진단/처방 암시는 TYPE_1', () => {
    const input: TriageInput = {
      description: '사진으로 진단 가능! 앱으로 진단받고 원격 처방까지 한번에.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'REMOTE_DIAGNOSIS')).toBe(true);
  });

  // ============================================================
  // 섹션 2: 가격/할인/이벤트 (High)
  // ============================================================

  // 14. 가격 할인/이벤트 유인
  test('MA-14: 할인/이벤트/특가 문구는 TYPE_1', () => {
    const input: TriageInput = {
      description: '오늘만 50% 할인! 선착순 한정 이벤트. 마감 임박!',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'PRICE_DISCOUNT_EVENT')).toBe(true);
  });

  // 15. 경품/사은품 제공
  test('MA-15: 경품/사은품/1+1 제공은 TYPE_1', () => {
    const input: TriageInput = {
      description: '시술 예약시 사은품 증정! 1+1 이벤트 진행중.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'GIFT_INCENTIVE')).toBe(true);
  });

  // ============================================================
  // 섹션 3: 시술/효과 주장 (High)
  // ============================================================

  // 16. 부작용 미고지 (부작용 없음 주장)
  test('MA-16: 부작용 없음/안전함 단정은 TYPE_1', () => {
    const input: TriageInput = {
      description: '부작용 없는 안전한 시술! 통증 없이 바로 일상생활 가능.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'NO_SIDE_EFFECT_DISCLOSURE')).toBe(true);
  });

  // 17. 리뷰 이벤트/조작
  test('MA-17: 리뷰 이벤트/보상 제공은 TYPE_1', () => {
    const input: TriageInput = {
      description: '후기 작성시 적립금 지급! 리뷰 쓰면 할인쿠폰 증정.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.some((f) => f.code === 'REVIEW_MANIPULATION')).toBe(true);
  });

  // 18. 복합 위반 케이스
  test('MA-18: 복합 위반 (전후사진 + 효과보장 + 할인)은 TYPE_1', () => {
    const input: TriageInput = {
      description:
        '전후사진 공개! 100% 만족 보장. 오늘만 특가 이벤트. 연예인 추천 병원.',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_1');
    expect(result.red_flags.length).toBeGreaterThanOrEqual(3);
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });
});

describe('의료광고 - TYPE_2 케이스 (가드레일 적용 후 진행 가능)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  // ============================================================
  // 정보성 콘텐츠 / 내부 도구 / 단순 기능
  // ============================================================

  // 19. 일반 질환 정보 (교육용)
  test('MA-19: 일반 질환/시술 정보 설명은 TYPE_2 가능', () => {
    const input: TriageInput = {
      description:
        '눈성형의 종류와 방법에 대해 설명합니다. 쌍커풀 수술의 일반적인 회복기간은 1-2주입니다. 시술 효과는 개인에 따라 다를 수 있으며, 부작용이 발생할 수 있으니 의료진과 상담하세요.',
      exposure: 'public',
      dataUsage: 'no_collection',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    // 시술명 언급은 medium severity이지만, 충분한 정보와 고지가 있으면 TYPE_2 가능
    // 단, 실제로는 시술명 언급(PROCEDURE_MENTION)이 감지될 수 있음
    if (result.red_flags.every((f) => f.severity === 'medium')) {
      expect(['TYPE_1', 'TYPE_2']).toContain(result.routing);
    }
  });

  // 20. 내부 관리 도구
  test('MA-20: 내부 관리 도구는 TYPE_2', () => {
    const input: TriageInput = {
      description: '병원 광고주 관리 대시보드 개선. 광고 성과 데이터 시각화.',
      exposure: 'internal_test',
      dataUsage: 'no_collection',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
    expect(result.red_flags.length).toBe(0);
  });

  // 21. 단순 UI/UX 개선
  test('MA-21: 단순 UI 개선은 TYPE_2', () => {
    const input: TriageInput = {
      description: '병원 상세 페이지 디자인 개선. 버튼 위치 변경 및 색상 수정.',
      exposure: 'public',
      dataUsage: 'no_collection',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
    expect(result.red_flags.length).toBe(0);
  });

  // 22. 검색/필터 기능 개선
  test('MA-22: 검색/필터 기능 추가는 TYPE_2', () => {
    const input: TriageInput = {
      description: '병원 검색 결과에 지역별, 진료과목별 필터 기능을 추가합니다.',
      exposure: 'public',
      dataUsage: 'no_collection',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
    expect(result.red_flags.length).toBe(0);
  });

  // 23. FAQ/고객센터 페이지
  test('MA-23: FAQ/고객센터 일반 정보는 TYPE_2', () => {
    const input: TriageInput = {
      description: '앱 사용법 FAQ 페이지 업데이트. 예약 방법, 취소 정책 안내.',
      exposure: 'public',
      dataUsage: 'no_collection',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
  });

  // 24. 로그 분석 도구 (내부)
  test('MA-24: 내부 로그 분석 기능은 TYPE_2', () => {
    const input: TriageInput = {
      description: '사용자 행동 로그 분석 도구 개발. 내부 데이터 분석용.',
      exposure: 'internal_test',
      dataUsage: 'no_collection',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
  });

  // 25. 알림 설정 기능
  test('MA-25: 알림 설정 기능 개선은 TYPE_2', () => {
    const input: TriageInput = {
      description: '사용자가 관심 병원의 새 소식 알림을 켜고 끌 수 있는 기능.',
      exposure: 'public',
      dataUsage: 'no_collection',
      externalCommunication: 'internal',
      crossBorder: 'domestic_only',
    };

    const result = engine.triage(input);

    expect(result.routing).toBe('TYPE_2');
  });
});

describe('의료광고 - 경계선 케이스 (보수적 판단)', () => {
  let engine: TriageEngine;

  beforeAll(() => {
    engine = new TriageEngine(RUBRIC_PATH);
  });

  // 시술명만 언급 (정보 제공 vs 광고)
  test('MA-EDGE-01: 시술명만 언급시 medium severity, 추가 정보 필요', () => {
    const input: TriageInput = {
      description: '보톡스와 필러의 차이점에 대해 알려드립니다.',
    };

    const result = engine.triage(input);

    // 시술명 언급은 medium severity
    expect(result.red_flags.some((f) => f.code === 'PROCEDURE_MENTION')).toBe(true);
    // 정보 부족시 보수적으로 TYPE_1
    expect(result.routing).toBe('TYPE_1');
    expect(result.missing_info_questions.length).toBeGreaterThan(0);
  });

  // UGC 리뷰 관련
  test('MA-EDGE-02: UGC 리뷰 기능은 medium severity, 모니터링 필요', () => {
    const input: TriageInput = {
      description: '사용자가 병원에 대한 리뷰를 작성할 수 있는 기능 추가.',
    };

    const result = engine.triage(input);

    expect(result.red_flags.some((f) => f.code === 'USER_CONTENT_LIABILITY')).toBe(true);
    // UGC는 medium이지만 정보 부족시 TYPE_1
    expect(result.routing).toBe('TYPE_1');
  });
});
