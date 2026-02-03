/**
 * @file lib/utils/tier.ts
 * @description 티어 관련 유틸리티 (profiles.current_tier 1~6)
 *
 * - 티어 번호 ↔ 이름 변환
 * - 티어별 기본 색상 코드 (UI 뱃지·차트용 fallback)
 * - 실제 암장별 색상은 gym_grade_scales 사용
 *
 * @see docs/TODO.md 160~167행, docs/implementation-plans/1.4-common-utils.md
 */

/** profiles.current_tier 제약 (1~6) */
export type TierLevel = 1 | 2 | 3 | 4 | 5 | 6;

/** 티어 레벨 배열 (1~6). 반복·검증용 */
export const TIER_LEVELS: TierLevel[] = [1, 2, 3, 4, 5, 6];

/** 티어 번호 → 표시 이름 (영문) */
export const TIER_NAMES: Record<TierLevel, string> = {
  1: "Silver",
  2: "Gold",
  3: "Platinum",
  4: "Diamond",
  5: "Master",
  6: "Grandmaster",
};

/** 티어 번호 → 한글 표기 (디자인 03_gym_create 기준) */
export const TIER_NAMES_KO: Record<TierLevel, string> = {
  1: "실버",
  2: "골드",
  3: "플래티넘",
  4: "다이아몬드",
  5: "마스터",
  6: "그랜드마스터",
};

/** 티어별 기본 색상 (HEX). UI 뱃지·차트용 fallback */
export const TIER_COLORS: Record<TierLevel, string> = {
  1: "#C0C0C0",
  2: "#FFD700",
  3: "#E5E4E2",
  4: "#B9F2FF",
  5: "#808080",
  6: "#36454F",
};

/**
 * 티어 번호로 표시 이름 반환
 */
export function getTierName(level: number): string | null {
  if (!isValidTierLevel(level)) return null;
  return TIER_NAMES[level as TierLevel];
}

/**
 * 표시 이름으로 티어 번호 반환 (대소문자 무시)
 */
export function getTierLevel(name: string): number | null {
  const normalized = name.trim();
  const entry = (
    Object.entries(TIER_NAMES) as unknown as [TierLevel, string][]
  ).find(
    ([, n]) => n.toLowerCase() === normalized.toLowerCase(),
  );
  return entry ? entry[0] : null;
}

/**
 * 티어 번호로 기본 색상(HEX) 반환. 유효하지 않으면 기본 회색
 */
export function getTierColor(level: number): string {
  if (!isValidTierLevel(level)) return "#9CA3AF";
  return TIER_COLORS[level as TierLevel];
}

function isValidTierLevel(level: number): level is TierLevel {
  return Number.isInteger(level) && level >= 1 && level <= 6;
}
