import { RoutineBlock } from "@/types/routine";

export type WorkoutSegment = {
  id: string;
  type: "ready" | "exercise" | "rest";
  duration: number; // 초 단위
  title: string;
  color?: string;
  reps?: number;
  weight?: number;
  edgeSize?: number;
  /** 원본 블록 ID (analytics 매핑에 사용) */
  blockId: string;
};

/**
 * 중첩된 루틴 블록(RoutineBlock[]) 배열을 1차원의 실행 단위(WorkoutSegment) 배열로 변환합니다.
 * - 루프(Loop) 블록은 자식들을 명시된 횟수만큼 반복 전개합니다.
 * - 첫 운동 전에 기본적으로 5초 "Ready" 세션을 맨 앞에 삽입합니다.
 *
 * 세그먼트 ID 규칙:
 *   - ready: "ready_0"
 *   - exercise/rest: "${block.id}_s${globalIndex}" (globalIndex = 전체 배열에서의 순서)
 *   이렇게 하면 동일 루틴을 실행할 때마다 동일한 ID가 보장됩니다.
 */
export function flattenRoutine(blocks: RoutineBlock[]): WorkoutSegment[] {
  const segments: WorkoutSegment[] = [];

  // 첫 준비 시간: 5초 카운트다운
  segments.push({
    id: "ready_0",
    blockId: "ready_0",
    type: "ready",
    duration: 5,
    title: "준비 (Ready)",
    color: "#06e0ce"
  });

  function processBlocks(items: RoutineBlock[]) {
    items.forEach((block) => {
      if (block.type === "exercise") {
        // globalIndex = push 이후의 크기가 되도록 미리 계산
        const globalIndex = segments.length;
        segments.push({
          id: `${block.id}_s${globalIndex}`,
          blockId: block.id,
          type: "exercise",
          duration: block.duration,
          title: block.title || "운동",
          reps: block.reps,
          weight: block.weight,
          edgeSize: block.edgeSize,
          color: block.color || "#f44336"
        });
      } else if (block.type === "rest") {
        const globalIndex = segments.length;
        segments.push({
          id: `${block.id}_s${globalIndex}`,
          blockId: block.id,
          type: "rest",
          duration: block.duration,
          title: block.title || "휴식",
          color: block.color || "#4caf50"
        });
      } else if (block.type === "loop") {
        for (let i = 0; i < block.repeat; i++) {
          processBlocks(block.children || []);
        }
      }
    });
  }

  processBlocks(blocks);
  return segments;
}
