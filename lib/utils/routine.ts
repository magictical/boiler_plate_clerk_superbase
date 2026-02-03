/**
 * @file lib/utils/routine.ts
 * @description 루틴 구조(structure_json) 기반 계산 유틸리티
 *
 * - TUT (Time Under Tension): 운동 구간 초 단위 합산
 * - 총 소요시간: 모든 블록 duration 합
 * - 총 세트 수: 그룹/루프 반복 반영
 *
 * @see types/database.ts RoutineBlock, docs/implementation-plans/1.4-common-utils.md
 */

import type { RoutineBlock } from "@/types/database";

/** 블록에서 duration(초) 추출. 스키마 확정 전 convention: durationSeconds */
function getBlockDurationSeconds(block: RoutineBlock): number {
  const d = block.durationSeconds ?? block.duration_seconds;
  return typeof d === "number" && d >= 0 ? d : 0;
}

/** 블록 반복 횟수. 스키마 확정 전 convention: repeatCount 또는 reps */
function getBlockRepeat(block: RoutineBlock): number {
  const r = block.repeatCount ?? block.repeat_count ?? block.reps;
  return typeof r === "number" && r >= 1 ? r : 1;
}

/**
 * structure_json 기준 총 예상 소요시간(초)
 */
export function getRoutineTotalDurationSeconds(
  structure: RoutineBlock[],
): number {
  function sum(blocks: RoutineBlock[], repeat: number): number {
    let total = 0;
    for (const block of blocks) {
      const r = getBlockRepeat(block);
      const self = getBlockDurationSeconds(block);
      const childTotal =
        block.children && block.children.length > 0
          ? sum(block.children, 1)
          : 0;
      total += (self + childTotal) * r * repeat;
    }
    return total;
  }
  return sum(structure, 1);
}

/**
 * structure_json 기준 총 세트 수 (그룹/루프 반복 반영)
 */
export function getRoutineTotalSets(structure: RoutineBlock[]): number {
  function count(blocks: RoutineBlock[], repeat: number): number {
    let total = 0;
    for (const block of blocks) {
      const r = getBlockRepeat(block);
      const type = String(block.type ?? "").toLowerCase();
      const hasChildren =
        block.children && Array.isArray(block.children) && block.children.length > 0;
      if (hasChildren) {
        total += count(block.children, r * repeat);
      } else {
        const isSetLike =
          type === "set" ||
          type === "exercise" ||
          type === "work" ||
          type === "workout";
        total += isSetLike ? 1 * r * repeat : 0;
      }
    }
    return total;
  }
  return count(structure, 1);
}

/**
 * TUT(Time Under Tension): 운동 구간 초 단위 합산
 * 블록 type이 운동 관련일 때만 duration 합산 (휴식 제외)
 */
export function getRoutineTUTSeconds(structure: RoutineBlock[]): number {
  function sum(blocks: RoutineBlock[], repeat: number): number {
    let total = 0;
    for (const block of blocks) {
      const r = getBlockRepeat(block);
      const type = String(block.type ?? "").toLowerCase();
      const isRest =
        type === "rest" || type === "break" || type === "휴식";
      const selfSeconds = isRest ? 0 : getBlockDurationSeconds(block);
      const childTotal =
        block.children && block.children.length > 0
          ? sum(block.children, 1)
          : 0;
      total += (selfSeconds + childTotal) * r * repeat;
    }
    return total;
  }
  return sum(structure, 1);
}
