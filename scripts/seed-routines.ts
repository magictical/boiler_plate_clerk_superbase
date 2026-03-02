/**
 * 샘플 루틴 삽입 스크립트
 *
 * 생성 루틴 목록:
 * [철봉]
 *   1. 중량 풀업 - 최대 근력 (Weighted Pull-up Max Strength)
 *   2. 고볼륨 풀업 - 파워 지구력 (Pull-up Power Endurance)
 *
 * [행보드]
 *   3. 미니멈 엣지 10mm - 최대 근력 (Minimum Edge Protocol)
 *   4. 맥스 행 - 최대 근력 (Max Hangs Progressive)
 *
 * [노행 리프트]
 *   5. 노행 리프트 - 핀치/엣지 근력 (No-Hang Lift Strength)
 *
 * [캠퍼스보드]
 *   6. 캠퍼스 런지 - 파워 (Campus Board Power)
 *
 * [스프레이월]
 *   7. 스프레이월 무브 - 파워 지구력 (Spray Wall Power Endurance) → ARC 대신 반복 볼더 세트로 구성
 */

import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const sb = createClient(
  "https://ykxbqenlsnqnphuiyexn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY"
);

// 대상 유저: 지기 매 (weight_kg: 72)
const USER_ID = "c3d3bd22-3262-4584-a52c-abb9a159b6f0";

// ─── 블록 헬퍼 ────────────────────────────────────────────
function ex(overrides: {
  title: string;
  exerciseId: string;
  duration: number;
  color: string;
  weight?: number;
  reps?: number;
  edgeSize?: number;
  requiredFields: ("weight" | "reps" | "edgeSize")[];
  allowedEdges?: number[];
}) {
  return {
    id: uuidv4(),
    type: "exercise" as const,
    ...overrides,
  };
}

function rest(duration: number) {
  return {
    id: uuidv4(),
    type: "rest" as const,
    title: "휴식",
    duration,
    color: "#4caf50",
  };
}

function loop(repeat: number, children: any[]) {
  return {
    id: uuidv4(),
    type: "loop" as const,
    title: `${repeat}세트 반복`,
    repeat,
    children,
  };
}

// 예상 시간 계산 (블록 구조 재귀)
function calcTime(blocks: any[]): number {
  let total = 0;
  for (const b of blocks) {
    if (b.type === "exercise" || b.type === "rest") total += b.duration;
    else if (b.type === "loop") total += b.repeat * calcTime(b.children);
  }
  return total;
}

function countExercises(blocks: any[]): number {
  let count = 0;
  for (const b of blocks) {
    if (b.type === "exercise") count++;
    else if (b.type === "loop") count += b.repeat * countExercises(b.children);
  }
  return count;
}

// ─── 루틴 정의 ────────────────────────────────────────────

const routines = [

  // ══════════════════════════════════════════════════════════
  // 1. 중량 풀업 - 최대 근력
  //    프로토콜: 5RM 기준 80~90% 중량 × 3~5회 × 5세트, 세트 간 3~5분 휴식
  // ══════════════════════════════════════════════════════════
  (() => {
    const structure = [
      loop(5, [
        ex({
          title: "중량 풀업 (Weighted Pull-up)",
          exerciseId: "pull_ups",
          duration: 20,
          color: "#06e0ce",
          weight: 10,        // 체중 + 10kg 벨트
          reps: 4,
          requiredFields: ["weight", "reps"],
        }),
        rest(180),            // 3분 휴식
      ]),
    ];
    return {
      title: "중량 풀업 — 최대 근력",
      structure_json: structure,
      estimated_time: calcTime(structure),
      total_sets: countExercises(structure),
      energy_system: "max_strength",
      equipment_type: "pullup_bar",
    };
  })(),

  // ══════════════════════════════════════════════════════════
  // 2. 고볼륨 풀업 - 파워 지구력
  //    프로토콜: 체중×10회 × 6세트, 세트 간 60초 휴식 (Grease the Groove 변형)
  // ══════════════════════════════════════════════════════════
  (() => {
    const structure = [
      loop(6, [
        ex({
          title: "풀업 (Pull-ups)",
          exerciseId: "pull_ups",
          duration: 30,
          color: "#3b82f6",
          weight: 0,
          reps: 10,
          requiredFields: ["weight", "reps"],
        }),
        rest(60),
      ]),
    ];
    return {
      title: "고볼륨 풀업 — 파워 지구력",
      structure_json: structure,
      estimated_time: calcTime(structure),
      total_sets: countExercises(structure),
      energy_system: "power_endurance",
      equipment_type: "pullup_bar",
    };
  })(),

  // ══════════════════════════════════════════════════════════
  // 3. 미니멈 엣지 10mm - 최대 근력
  //    프로토콜: 10mm 엣지 10초 × 6세트, 세트 간 3분 휴식
  //    (Beastmaker / Lattice 권장 최대 근력 프로토콜)
  // ══════════════════════════════════════════════════════════
  (() => {
    const structure = [
      loop(6, [
        ex({
          title: "미니멈 엣지 (Minimum Edge)",
          exerciseId: "minimum_edge",
          duration: 10,
          color: "#f97316",
          weight: 0,
          edgeSize: 10,
          requiredFields: ["weight", "edgeSize"],
          allowedEdges: [15, 10, 8, 4],
        }),
        rest(180),
      ]),
    ];
    return {
      title: "미니멈 엣지 10mm — 최대 근력",
      structure_json: structure,
      estimated_time: calcTime(structure),
      total_sets: countExercises(structure),
      energy_system: "max_strength",
      equipment_type: "hangboard",
    };
  })(),

  // ══════════════════════════════════════════════════════════
  // 4. 맥스 행 - 최대 근력 (Progressive Overload)
  //    프로토콜: 33mm 엣지, 체중+추가중량, 10초 × 5세트
  //    (Hörst / Anderson 형제 권장 맥스 행 프로토콜)
  // ══════════════════════════════════════════════════════════
  (() => {
    const structure = [
      loop(5, [
        ex({
          title: "맥스 행 (Max Hangs)",
          exerciseId: "max_hangs",
          duration: 10,
          color: "#ff0909",
          weight: 5,         // +5kg 추 (점진적 부하)
          edgeSize: 33,
          requiredFields: ["weight", "edgeSize"],
          allowedEdges: [33, 25, 20, 15],
        }),
        rest(180),
      ]),
    ];
    return {
      title: "맥스 행 — 최대 근력",
      structure_json: structure,
      estimated_time: calcTime(structure),
      total_sets: countExercises(structure),
      energy_system: "max_strength",
      equipment_type: "hangboard",
    };
  })(),

  // ══════════════════════════════════════════════════════════
  // 5. 노행 리프트 - 핀치·엣지 근력
  //    프로토콜: 최대 중량의 90% × 10초 × 5세트, 세트 간 3분 휴식
  //    (Metolius/Lattice 노행 프로토콜)
  // ══════════════════════════════════════════════════════════
  (() => {
    const structure = [
      loop(5, [
        ex({
          title: "노행 리프트 (No-Hang Lift)",
          exerciseId: "no_hang_lift",
          duration: 10,
          color: "#a855f7",
          weight: 30,        // 노행 디바이스 총 무게 (kg)
          edgeSize: 20,
          requiredFields: ["weight", "edgeSize"],
        }),
        rest(180),
      ]),
    ];
    return {
      title: "노행 리프트 — 핀치·엣지 근력",
      structure_json: structure,
      estimated_time: calcTime(structure),
      total_sets: countExercises(structure),
      energy_system: "max_strength",
      equipment_type: "no_hang",
    };
  })(),

  // ══════════════════════════════════════════════════════════
  // 6. 캠퍼스 런지 - 파워
  //    프로토콜: 1-3-5 런지 × 6세트, 세트 간 2~3분 휴식
  //    (캠퍼스보드 기본 파워 트레이닝)
  // ══════════════════════════════════════════════════════════
  (() => {
    const structure = [
      loop(6, [
        ex({
          title: "캠퍼스 런지 1-3-5 (Campus Rungs)",
          exerciseId: "campus_rungs",
          duration: 8,
          color: "#facc15",
          weight: 0,
          requiredFields: ["weight"],
        }),
        rest(150),            // 2분 30초 휴식
      ]),
    ];
    return {
      title: "캠퍼스 런지 — 파워",
      structure_json: structure,
      estimated_time: calcTime(structure),
      total_sets: countExercises(structure),
      energy_system: "power",
      equipment_type: "campus_board",
    };
  })(),

  // ══════════════════════════════════════════════════════════
  // 7. 스프레이월 — 파워 지구력
  //    프로토콜: 4분 클라이밍 + 2분 휴식 × 4라운드 (4×4)
  //    스프레이월 특화: Density Hangs 기반으로 ARC 훈련 구조 모방
  //    (Neil Gresham의 ARC + Power Endurance 복합 세션)
  // ══════════════════════════════════════════════════════════
  (() => {
    // 스프레이월 세션: density hangs 를 "스프레이월 클라이밍"으로 대체 표현
    // 4×4 포맷: 각 라운드 = 짧은 볼더 4개 연속 × 4라운드
    const oneRound = [
      ex({
        title: "스프레이월 볼더 #1",
        exerciseId: "density_hangs",   // 지구력 기반 운동으로 매핑
        duration: 60,
        color: "#22c55e",
        weight: 0,
        edgeSize: 25,
        requiredFields: ["weight", "edgeSize"],
      }),
      rest(15),
      ex({
        title: "스프레이월 볼더 #2",
        exerciseId: "density_hangs",
        duration: 60,
        color: "#22c55e",
        weight: 0,
        edgeSize: 25,
        requiredFields: ["weight", "edgeSize"],
      }),
      rest(15),
      ex({
        title: "스프레이월 볼더 #3",
        exerciseId: "density_hangs",
        duration: 60,
        color: "#22c55e",
        weight: 0,
        edgeSize: 25,
        requiredFields: ["weight", "edgeSize"],
      }),
      rest(15),
      ex({
        title: "스프레이월 볼더 #4",
        exerciseId: "density_hangs",
        duration: 60,
        color: "#22c55e",
        weight: 0,
        edgeSize: 25,
        requiredFields: ["weight", "edgeSize"],
      }),
      rest(120),              // 라운드 간 2분 휴식
    ];

    const structure = [loop(4, oneRound)];

    return {
      title: "스프레이월 4×4 — 파워 지구력",
      structure_json: structure,
      estimated_time: calcTime(structure),
      total_sets: countExercises(structure),
      energy_system: "power_endurance",
      equipment_type: "other",
    };
  })(),
];

// ─── DB 삽입 ──────────────────────────────────────────────
async function main() {
  console.log(`총 ${routines.length}개 루틴 삽입 시작...\n`);

  for (const r of routines) {
    const payload = {
      user_id: USER_ID,
      title: r.title,
      estimated_time: r.estimated_time,
      total_sets: r.total_sets,
      structure_json: r.structure_json,
      energy_system: r.energy_system,
      equipment_type: r.equipment_type,
    };

    const { data, error } = await sb.from("routines").insert(payload).select("id").single();

    if (error) {
      console.error(`❌ [${r.title}] 실패:`, error.message);
    } else {
      console.log(`✅ [${r.title}]`);
      console.log(`   ID: ${data.id}`);
      console.log(`   예상 시간: ${Math.round(r.estimated_time / 60)}분 ${r.estimated_time % 60}초`);
      console.log(`   총 세트: ${r.total_sets}세트`);
      console.log(`   에너지 시스템: ${r.energy_system}`);
      console.log(`   장비: ${r.equipment_type}\n`);
    }
  }

  console.log("완료!");
}

main().catch(console.error);
