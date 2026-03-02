/**
 * 더미 훈련 세션 데이터 삽입 스크립트
 *
 * 조건:
 * - 대상: 지기 매 (72kg, V7-V8 수준)
 * - 기간: 약 10주 (주 2~3회, 총 25세션)
 * - 전략: 점진적 과부하 (Progressive Overload) 반영
 *         3주 빌드 → 1주 딜로드 사이클
 *
 * V7-8 클라이머 기준 수치:
 *   - 맥스 행: BW(72kg) + 15~25kg → 총 87~97kg
 *   - 미니멈 엣지 10mm: BW 0~+5kg (아슬아슬하게 성공)
 *   - 중량 풀업: +20~35kg
 *   - 노행 리프트: 50~70kg 총중량
 *   - 캠퍼스: 맨몸 성공률 85~95%
 *   - 스프레이월: 거의 완주
 */

import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://ykxbqenlsnqnphuiyexn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY"
);

const USER_ID = "c3d3bd22-3262-4584-a52c-abb9a159b6f0";
const USER_WEIGHT = 72;

// ─── 루틴 메타 ─────────────────────────────────────────────
const ROUTINES = {
  maxHang:      { id: "01a62183-f355-4e4c-95ee-8520af5be5a6", exId: "3291148c-db64-4772-b282-824eab9d5a3b", sets: 5 },
  minEdge:      { id: "360a2944-961c-4069-b69e-e9fe0fc10aff", exId: "e593df4e-aa74-4372-9c70-7e3f739e13d9", sets: 6 },
  weightedPull: { id: "4c955da2-a448-4971-824f-caa4846c3d40", exId: "b13d564e-41f6-452a-ae5e-576c95653548", sets: 5 },
  volPull:      { id: "2efabbb3-c263-4296-8c38-fd503f7c6572", exId: "2b8ebf9a-3186-4eea-8982-c010733215a6", sets: 6 },
  noHang:       { id: "b3d32f7c-c901-45b6-80b8-4d7f4cf30b6d", exId: "ed78aebc-c22d-4579-889d-c1444790aee3", sets: 5 },
  campus:       { id: "38df04ba-2784-4e69-92ea-8f7f718280e7", exId: "de28d209-78f2-4821-b4da-1c8732d1b994", sets: 6 },
  sprayWall: {
    id: "e8ed78be-61df-491a-b83f-f5a67373b5c9",
    exIds: [
      "19623512-d2c2-4e42-b8d8-ee45eacf942e", // 볼더 #1
      "7bd3f1d4-dc22-48b3-9502-8e3947e4ca5b", // 볼더 #2
      "7670d3e4-545c-486c-b892-3f7f02e8679e", // 볼더 #3
      "2b11c08c-8cd6-4c30-b3a9-58d74ddb036f", // 볼더 #4
    ],
    sets: 16,
  },
};

// flattenRoutine 로직 복사 (segmentId 생성)
function flattenSegmentIds(structure: any[]): { id: string; blockId: string }[] {
  const segments: { id: string; blockId: string }[] = [{ id: "ready_0", blockId: "ready_0" }];
  function proc(blocks: any[]) {
    for (const b of blocks) {
      if (b.type === "exercise") {
        const idx = segments.length;
        segments.push({ id: `${b.id}_s${idx}`, blockId: b.id });
      } else if (b.type === "rest") {
        const idx = segments.length;
        segments.push({ id: `${b.id}_s${idx}`, blockId: b.id });
      } else if (b.type === "loop") {
        for (let i = 0; i < b.repeat; i++) proc(b.children || []);
      }
    }
  }
  proc(structure);
  return segments;
}

// 실제 루틴 structure_json 가져와 segmentId 맵 생성
async function getSegmentMap(routineId: string): Promise<Map<string, string>> {
  const { data } = await sb.from("routines").select("structure_json").eq("id", routineId).single();
  const segs = flattenSegmentIds(data?.structure_json || []);
  // blockId → segmentId 맵
  const map = new Map<string, string>();
  segs.filter(s => s.blockId !== "ready_0").forEach(s => {
    if (!map.has(s.blockId)) map.set(s.blockId, s.id);
  });
  // 중복 blockId (루프)는 순서대로 배열로도 저장
  const arr = new Map<string, string[]>();
  segs.filter(s => s.blockId !== "ready_0").forEach(s => {
    const list = arr.get(s.blockId) || [];
    list.push(s.id);
    arr.set(s.blockId, list);
  });
  return arr as any;
}

// ─── 유틸 ─────────────────────────────────────────────────
function rng(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 세트 결과 생성: success/half/fail 확률 기반 */
function setResult(successRate: number): "success" | "half" | "fail" {
  const r = Math.random();
  if (r < successRate) return "success";
  if (r < successRate + 0.12) return "half";
  return "fail";
}

// ─── 세션 스케줄 생성 (10주, 주 2~3회) ───────────────────
// 기준: 2026-02-26에서 약 10주 거슬러 올라가 (2025-12-16 ~)
function buildSchedule(): Date[] {
  const start = new Date("2025-12-16T09:00:00+09:00");
  const dates: Date[] = [];
  const current = new Date(start);

  const daysOfWeek = [
    // 주 당 운동 요일 패턴 (0=일, 1=월 ... 6=토)
    [2, 4],        // 화·목 (2회)
    [1, 3, 6],     // 월·수·토 (3회)
    [2, 4, 6],     // 화·목·토 (3회)
    [1, 4],        // 월·목 (2회)
    [2, 5],        // 화·금 (2회)
    [1, 3, 6],     // 월·수·토 (3회)
    [2, 4, 6],     // 화·목·토 (3회)
    [1, 3],        // 월·수 (2회) ← 딜로드 주
    [2, 4, 6],     // 화·목·토 (3회)
    [1, 4],        // 월·목 (2회)
  ];

  for (let week = 0; week < 10 && dates.length < 28; week++) {
    const pattern = daysOfWeek[week % daysOfWeek.length];
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + week * 7);

    for (const dow of pattern) {
      if (dates.length >= 28) break;
      const d = new Date(weekStart);
      // 해당 주의 dow 요일로 이동
      const diff = dow - weekStart.getDay();
      d.setDate(weekStart.getDate() + diff);
      if (d < start) continue;
      // 시작 시간 약간 랜덤 (09:00 ~ 20:00)
      const hour = pick([9, 10, 11, 18, 19, 20]);
      d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
      dates.push(new Date(d));
    }
  }
  return dates.slice(0, 28).sort((a, b) => a.getTime() - b.getTime());
}

// ─── 루틴 순환 배열 (10주 프로그램) ─────────────────────
// 전형적 클라이밍 훈련 배분:
// 행보드(근력) → 철봉/파워 → 행보드(근력) → 노행/캠퍼스 → 스프레이월...
const ROTATION = [
  "maxHang", "weightedPull", "minEdge",
  "campus",  "maxHang",      "volPull",
  "noHang",  "sprayWall",    "maxHang",  "weightedPull",
  "minEdge", "campus",       "maxHang",  "noHang",
  "volPull", "sprayWall",    "maxHang",  "weightedPull",
  "minEdge", "campus",       "noHang",   "sprayWall",
  "maxHang", "weightedPull", "minEdge",  "volPull",
  "campus",  "sprayWall",
] as const;

// ─── 세션별 수치 계산 (점진적 과부하) ─────────────────────
/**
 * sessionIdx: 0 기반 세션 번호 (0 ~ 27)
 * 3주 build → 1주 deload 사이클 반영
 * V7-8 클라이머 기준 초기~최종 수치 설정
 */
function getProgressFactor(sessionIdx: number): number {
  const week = Math.floor(sessionIdx / 2.5);
  const inDeload = week % 4 === 3;
  const buildProgress = (sessionIdx / 27);  // 0~1
  return inDeload ? 0.85 : 0.85 + buildProgress * 0.15;
}

/** V7-8 기준 세션 수치 */
function getSessionParams(routineName: string, sessionIdx: number) {
  const p = getProgressFactor(sessionIdx);
  const week = Math.floor(sessionIdx / 2.5);
  const isDeload = week % 4 === 3;

  switch (routineName) {
    case "maxHang":
      // V7-8: BW+15kg(초기) → BW+25kg(후반), 딜로드 -30%
      return {
        addedWeight: Math.round(rng(14, 16) + sessionIdx * 0.37) * (isDeload ? 0.7 : 1),
        successRate: 0.75 + p * 0.12,
        rpe: isDeload ? Math.round(rng(5, 7)) : Math.round(rng(7, 10)),
      };

    case "minEdge":
      // V7-8: BW+0~+5kg, 10mm 엣지, 딜로드 -0kg or 보조
      return {
        addedWeight: Math.max(-5, Math.round(rng(-2, 1) + sessionIdx * 0.18)) * (isDeload ? 0.5 : 1),
        successRate: 0.70 + p * 0.15,
        rpe: isDeload ? Math.round(rng(5, 7)) : Math.round(rng(7, 9)),
      };

    case "weightedPull":
      // V7-8: +20kg(초기) → +35kg(후반)
      return {
        addedWeight: Math.round(rng(18, 22) + sessionIdx * 0.56) * (isDeload ? 0.7 : 1),
        successRate: 0.80 + p * 0.10,
        rpe: isDeload ? Math.round(rng(5, 6)) : Math.round(rng(7, 9)),
      };

    case "volPull":
      // 체중, 10회, 성공률 높음
      return {
        addedWeight: 0,
        successRate: 0.85 + p * 0.08,
        rpe: isDeload ? Math.round(rng(4, 6)) : Math.round(rng(6, 8)),
      };

    case "noHang":
      // 노행 총중량 50kg(초기) → 68kg(후반). addedWeight = 장치 총중량
      return {
        addedWeight: Math.round(rng(48, 52) + sessionIdx * 0.67) * (isDeload ? 0.8 : 1),
        successRate: 0.75 + p * 0.12,
        rpe: isDeload ? Math.round(rng(5, 7)) : Math.round(rng(7, 9)),
      };

    case "campus":
      // 캠퍼스: 맨몸 성공률 87~96%
      return {
        addedWeight: 0,
        successRate: 0.82 + p * 0.12,
        rpe: isDeload ? Math.round(rng(5, 7)) : Math.round(rng(7, 9)),
      };

    case "sprayWall":
      // 스프레이월: 맨몸, 성공률 높음 (유산소 대화가능 zone ~)
      return {
        addedWeight: 0,
        successRate: 0.85 + p * 0.08,
        rpe: isDeload ? Math.round(rng(4, 6)) : Math.round(rng(6, 8)),
      };

    default:
      return { addedWeight: 0, successRate: 0.8, rpe: 7 };
  }
}

// ─── 메인 ─────────────────────────────────────────────────
async function main() {
  const schedule = buildSchedule();
  console.log(`세션 스케줄: ${schedule.length}개\n`);

  // 각 루틴의 segmentId 목록을 미리 로드
  const routineKeys = ["maxHang", "minEdge", "weightedPull", "volPull", "noHang", "campus", "sprayWall"] as const;
  const segMaps: Record<string, Map<string, string[]>> = {};
  for (const key of routineKeys) {
    segMaps[key] = await getSegmentMap(ROUTINES[key].id) as any;
  }

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < schedule.length; i++) {
    const date = schedule[i];
    const routineName = ROTATION[i % ROTATION.length];
    const routine = ROUTINES[routineName];
    const params = getSessionParams(routineName, i);
    const segMap = segMaps[routineName];

    // ── set_results_json 생성 ──────────────────────────
    const results: Record<string, string> = {};

    if (routineName === "sprayWall") {
      // 스프레이월: 4개 볼더 × 4라운드 = 16 세그먼트
      const sw = ROUTINES["sprayWall"];
      for (const exId of sw.exIds) {
        const segIds = segMap.get(exId) || [];
        for (const segId of segIds) {
          results[segId] = setResult(params.successRate);
        }
      }
    } else {
      // 일반 루틴: 단일 exercise blockId 반복
      const r = routine as { id: string; exId: string; sets: number };
      const segIds = segMap.get(r.exId) || [];
      for (const segId of segIds) {
        results[segId] = setResult(params.successRate);
      }
    }

    // ── 세션 시간 ──────────────────────────────────────
    const startedAt = new Date(date);
    const durationSec = routine.sets * (routineName === "sprayWall" ? 275 : 210);
    const endedAt = new Date(startedAt.getTime() + durationSec * 1000);

    // ── 인서트 ─────────────────────────────────────────
    const { error } = await sb.from("training_logs").insert({
      user_id: USER_ID,
      routine_id: routine.id,
      status: "completed",
      rpe: params.rpe,
      set_results_json: results,
      user_weight_kg: USER_WEIGHT,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
    });

    if (error) {
      console.error(`❌ 세션[${i + 1}] ${routineName}: ${error.message}`);
      failed++;
    } else {
      const dateStr = startedAt.toLocaleDateString("ko-KR", { month: "short", day: "numeric", weekday: "short" });
      const successCount = Object.values(results).filter(v => v === "success").length;
      const totalCount = Object.keys(results).length;
      const addedStr = params.addedWeight > 0 ? `+${Math.round(params.addedWeight)}kg` : "BW";
      console.log(`✅ [${String(i + 1).padStart(2, "0")}] ${dateStr} | ${routineName.padEnd(12)} | ${addedStr.padEnd(7)} | ${successCount}/${totalCount}성공 | RPE ${params.rpe}`);
      inserted++;
    }
  }

  // streak 업데이트: 간단히 inserted 수로 반영
  await sb.from("users").update({ current_streak: inserted }).eq("id", USER_ID);

  console.log(`\n총 ${inserted}개 세션 삽입 완료 (실패: ${failed}개)`);
}

main().catch(console.error);
