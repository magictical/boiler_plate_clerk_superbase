export type BlockType = "exercise" | "rest" | "loop";

export interface BaseBlock {
  id: string;
  type: BlockType;
  color?: string;
  title?: string;
}

export interface ExerciseBlock extends BaseBlock {
  type: "exercise";
  exerciseId?: string; // 추가
  title: string;
  duration: number; // 초 단위
  requiredFields?: ("weight" | "reps" | "edgeSize")[]; // 추가
  allowedEdges?: number[]; // 추가
  reps?: number;
  weight?: number;
  edgeSize?: number; // 추가 (mm 단위)
}

export interface RestBlock extends BaseBlock {
  type: "rest";
  duration: number; // 초 단위
}

export interface LoopBlock extends BaseBlock {
  type: "loop";
  repeat: number;
  children: RoutineBlock[];
}

export type RoutineBlock = ExerciseBlock | RestBlock | LoopBlock;

export interface RoutineStats {
  totalDuration: number;
  totalSets: number;
  tut: number; // Time Under Tension (운동 시간 합계)
  totalExercises: number;
}
