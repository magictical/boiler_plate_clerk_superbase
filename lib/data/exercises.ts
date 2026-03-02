export type ExerciseCategory = "hangboard" | "lift" | "pullup" | "core";
export type EnergySystem = "max_strength" | "power" | "power_endurance" | "endurance";
export type Equipment = "hangboard" | "no_hang" | "pullup_bar" | "bodyweight" | "campus_board" | "other";

export interface ExerciseDef {
  id: string;
  title: string;
  category: ExerciseCategory; // 기존 호환성 유지
  energy_system: EnergySystem;
  equipment: Equipment;
  description: string;
  icon: string;
  defaultDuration: number;
  requiredFields: ("weight" | "reps" | "edgeSize")[];
  allowedEdges?: number[];
}

export const EXERCISE_CATEGORIES: { id: ExerciseCategory; label: string }[] = [
  { id: "hangboard", label: "행보드" },
  { id: "lift", label: "리프트" },
  { id: "pullup", label: "턱걸이" },
  { id: "core", label: "코어" },
];

export const ENERGY_SYSTEM_META: Record<EnergySystem, { label: string; color: string; icon: string }> = {
  max_strength:    { label: "최대 근력",   color: "#06e0ce", icon: "fitness_center" },
  power:           { label: "파워",        color: "#f97316", icon: "flash_on" },
  power_endurance: { label: "파워 지구력", color: "#facc15", icon: "battery_charging_full" },
  endurance:       { label: "지구력 / ARC", color: "#22c55e", icon: "all_inclusive" },
};

export const EQUIPMENT_META: Record<Equipment, { label: string }> = {
  hangboard:  { label: "행보드" },
  no_hang:    { label: "노행 리프트" },
  pullup_bar: { label: "철봉류" },
  bodyweight: { label: "맨몸운동" },
  campus_board: { label: "캠퍼스 보드" },
  other:      { label: "기타" },
};

export const EXERCISES: ExerciseDef[] = [
  // ── 최대 근력 (Max Strength) ──────────────────────────────
  {
    id: "max_hangs",
    title: "맥스 행 (Max Hangs)",
    category: "hangboard",
    energy_system: "max_strength",
    equipment: "hangboard",
    description: "최대 중량 10초 매달리기",
    icon: "hand",
    defaultDuration: 10,
    requiredFields: ["weight", "edgeSize"],
    allowedEdges: [33, 25, 20, 15],
  },
  {
    id: "minimum_edge",
    title: "미니멈 엣지 (Minimum Edge)",
    category: "hangboard",
    energy_system: "max_strength",
    equipment: "hangboard",
    description: "가장 작은 홀드에서 버티기",
    icon: "minus",
    defaultDuration: 10,
    requiredFields: ["weight", "edgeSize"],
    allowedEdges: [15, 10, 8, 4],
  },
  {
    id: "one_arm_hang",
    title: "원 암 행 (One Arm Hang)",
    category: "hangboard",
    energy_system: "max_strength",
    equipment: "hangboard",
    description: "한 팔로 체중 버티기",
    icon: "dumbbell",
    defaultDuration: 5,
    requiredFields: ["weight", "edgeSize"],
  },
  {
    id: "no_hang_lift",
    title: "노행 리프트 (No-Hang Lift)",
    category: "lift",
    energy_system: "max_strength",
    equipment: "no_hang",
    description: "핀치/엣지 블럭 들어올리기",
    icon: "dumbbell",
    defaultDuration: 10,
    requiredFields: ["weight", "edgeSize"],
  },
  {
    id: "lock_offs",
    title: "락오프 (Lock-offs)",
    category: "pullup",
    energy_system: "max_strength",
    equipment: "pullup_bar",
    description: "홀드에서 특정 각도로 버티기",
    icon: "lock",
    defaultDuration: 15,
    requiredFields: ["weight"],
  },

  // ── 파워 (Power) ──────────────────────────────────────────
  {
    id: "campus_rungs",
    title: "캠퍼스 런지 (Campus Rungs)",
    category: "hangboard",
    energy_system: "power",
    equipment: "campus_board",
    description: "발 없이 손만으로 런지 동작",
    icon: "arrow-up-right",
    defaultDuration: 10,
    requiredFields: ["weight"],
  },
  {
    id: "pull_ups",
    title: "풀업 (Pull-ups)",
    category: "pullup",
    energy_system: "power",
    equipment: "pullup_bar",
    description: "등/이두 폭발적 당기기",
    icon: "arrow-up",
    defaultDuration: 30,
    requiredFields: ["weight", "reps"],
  },

  // ── 파워 지구력 (Power Endurance) ─────────────────────────
  {
    id: "repeaters",
    title: "리피터 (Repeaters)",
    category: "hangboard",
    energy_system: "power_endurance",
    equipment: "hangboard",
    description: "7초 매달리고 3초 휴식 반복",
    icon: "repeat",
    defaultDuration: 7,
    requiredFields: ["weight", "edgeSize"],
  },
  {
    id: "hanging_leg_raise",
    title: "행잉 레그레이즈 (Hanging Leg Raise)",
    category: "core",
    energy_system: "power_endurance",
    equipment: "pullup_bar",
    description: "오버행 복근 단련",
    icon: "arrow-up-right",
    defaultDuration: 40,
    requiredFields: ["reps"],
  },

  // ── 지구력 / ARC (Endurance) ──────────────────────────────
  {
    id: "density_hangs",
    title: "덴시티 행 (Density Hangs)",
    category: "hangboard",
    energy_system: "endurance",
    equipment: "hangboard",
    description: "30초 이상 저강도 지속 매달리기",
    icon: "timer",
    defaultDuration: 30,
    requiredFields: ["weight", "edgeSize"],
  },
  {
    id: "plank",
    title: "플랭크 (Plank)",
    category: "core",
    energy_system: "endurance",
    equipment: "bodyweight",
    description: "전신 코어 버티기",
    icon: "activity",
    defaultDuration: 60,
    requiredFields: ["weight"],
  },
];
