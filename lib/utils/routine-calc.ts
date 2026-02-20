import { RoutineBlock, RoutineStats } from "@/types/routine";

/**
 * 루틴 블록 리스트의 통계를 재귀적으로 계산합니다.
 */
export function calculateRoutineStats(blocks: RoutineBlock[]): RoutineStats {
  const stats: RoutineStats = {
    totalDuration: 0,
    totalSets: 0,
    tut: 0,
    totalExercises: 0,
  };

  for (const block of blocks) {
    if (block.type === "exercise") {
      stats.totalDuration += block.duration;
      stats.tut += block.duration;
      stats.totalSets += 1;
      stats.totalExercises += 1;
    } else if (block.type === "rest") {
      stats.totalDuration += block.duration;
    } else if (block.type === "loop") {
      const childStats = calculateRoutineStats(block.children);
      // 루프는 (자식들 합계) * 반복 횟수
      stats.totalDuration += childStats.totalDuration * block.repeat;
      stats.tut += childStats.tut * block.repeat;
      stats.totalSets += childStats.totalSets * block.repeat;
      stats.totalExercises += childStats.totalExercises * block.repeat;
    }
  }

  return stats;
}

/**
 * 시간을 "MM:SS" 또는 "HH:MM:SS" 형식으로 변환합니다.
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
