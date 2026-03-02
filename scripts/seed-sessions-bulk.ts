import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://ykxbqenlsnqnphuiyexn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY"
);

const USER_ID = "c3d3bd22-3262-4584-a52c-abb9a159b6f0";
const USER_WEIGHT = 72;

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

function rng(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function setResult(successRate: number): "success" | "half" | "fail" {
  const r = Math.random();
  if (r < successRate) return "success";
  if (r < successRate + 0.12) return "half";
  return "fail";
}

// ─── 세션 파라미터 ─────────────────────────────────────────
function getSessionParams(title: string, sessionIdx: number, totalSessions: number) {
  // sessionIdx: 0 (과거) -> totalSessions-1 (현재)
  const p = sessionIdx / Math.max(1, totalSessions - 1); // 0 to 1
  const isDeload = sessionIdx % 4 === 3;

  if (title.includes("맥스 행")) {
    return {
      addedWeight: Math.round(rng(14, 16) + p * 10) * (isDeload ? 0.7 : 1),
      successRate: 0.75 + p * 0.12,
      rpe: isDeload ? Math.round(rng(5, 7)) : Math.round(rng(7, 10)),
      durationSec: 5 * 210,
    };
  } else if (title.includes("미니멈 엣지")) {
    return {
      addedWeight: Math.max(-5, Math.round(rng(-2, 1) + p * 5)) * (isDeload ? 0.5 : 1),
      successRate: 0.70 + p * 0.15,
      rpe: isDeload ? Math.round(rng(5, 7)) : Math.round(rng(7, 9)),
      durationSec: 6 * 210,
    };
  } else if (title.includes("중량 풀업")) {
    return {
      addedWeight: Math.round(rng(18, 22) + p * 15) * (isDeload ? 0.7 : 1),
      successRate: 0.80 + p * 0.10,
      rpe: isDeload ? Math.round(rng(5, 6)) : Math.round(rng(7, 9)),
      durationSec: 5 * 210,
    };
  } else if (title.includes("고볼륨 풀업")) {
    return {
      addedWeight: 0,
      successRate: 0.85 + p * 0.08,
      rpe: isDeload ? Math.round(rng(4, 6)) : Math.round(rng(6, 8)),
      durationSec: 6 * 100,
    };
  } else if (title.includes("노행")) {
    return {
      addedWeight: Math.round(rng(48, 52) + p * 18) * (isDeload ? 0.8 : 1),
      successRate: 0.75 + p * 0.12,
      rpe: isDeload ? Math.round(rng(5, 7)) : Math.round(rng(7, 9)),
      durationSec: 5 * 210,
    };
  } else if (title.includes("캠퍼스")) {
    return {
      addedWeight: 0,
      successRate: 0.82 + p * 0.12,
      rpe: isDeload ? Math.round(rng(5, 7)) : Math.round(rng(7, 9)),
      durationSec: 6 * 210,
    };
  } else if (title.includes("스프레이월")) {
    return {
      addedWeight: 0,
      successRate: 0.85 + p * 0.08,
      rpe: isDeload ? Math.round(rng(4, 6)) : Math.round(rng(6, 8)),
      durationSec: 16 * 75,
    };
  } else {
    return { addedWeight: 0, successRate: 0.8, rpe: 7, durationSec: 20 * 60 };
  }
}

async function main() {
  // 기존 루틴들 불러오기
  const { data: routines, error: fetchError } = await sb
    .from("routines")
    .select("id, title, structure_json")
    .eq("user_id", USER_ID);

  if (fetchError || !routines) {
    console.error("루틴 불러오기 실패:", fetchError?.message);
    return;
  }

  // 기존 training_logs 모두 지우기 (초기화 후 새로 넉넉하게 추가)
  console.log("기존 훈련 로그 삭제 중...");
  await sb.from("training_logs").delete().eq("user_id", USER_ID);

  let inserted = 0;
  let failed = 0;

  const SESSIONS_PER_ROUTINE = 22; // 각 루틴당 22세션씩 (총 약 7*22 = 154세션)

  for (const routine of routines) {
    console.log(`\n=== [${routine.title}] 데이터 생성 중 ===`);

    // 세그먼트 추출
    const segs = flattenSegmentIds(routine.structure_json || []);
    const exerciseSegs = segs.filter(s => s.blockId !== "ready_0" && !s.id.includes("rest"));
    // Wait, let's just properly map exercises...
    // Actually the block structure has 'exercise' or 'rest'
    // A better way is to just find all exercise IDs from the structure

    const exerciseSegmentIds: string[] = [];
    function extractExerciseSegs(blocks: any[], indexOffset: number = 0): number {
      let idx = indexOffset;
      for (const b of blocks) {
        if (b.type === "exercise") {
          exerciseSegmentIds.push(`${b.id}_s${idx + 1}`); // 0 is ready_0
          idx++;
        } else if (b.type === "rest") {
          idx++;
        } else if (b.type === "loop") {
          for (let i = 0; i < b.repeat; i++) {
            idx = extractExerciseSegs(b.children || [], idx);
          }
        }
      }
      return idx;
    }
    const finalSegments = flattenSegmentIds(routine.structure_json || []);
    const allExSegIds = finalSegments.filter(s => {
      // Find original block type
      // It's easier to just match the pattern. Or we can just rebuild correctly.
      return s.id !== "ready_0" && s.id.includes("_s"); // We just need to filter out rest.
    });

    // Let's accurately parse exercise block IDs from routine.structure_json
    const exBlockIds = new Set<string>();
    const findEx = (blocks: any[]) => {
      for(const b of blocks) {
        if (b.type === 'exercise') exBlockIds.add(b.id);
        if (b.type === 'loop') findEx(b.children || []);
      }
    };
    findEx(routine.structure_json || []);

    const actualExSegIds = finalSegments.filter(s => exBlockIds.has(s.blockId)).map(s => s.id);

    // 날짜 생성: 최근 6개월 내
    const endDate = new Date("2026-02-27T19:00:00+09:00");
    const startDate = new Date(endDate.getTime() - SESSIONS_PER_ROUTINE * 7 * 24 * 60 * 60 * 1000); // 1주에 1번 꼴

    for (let i = 0; i < SESSIONS_PER_ROUTINE; i++) {
      const params = getSessionParams(routine.title, i, SESSIONS_PER_ROUTINE);

      const results: Record<string, string> = {};
      for (const segId of actualExSegIds) {
        results[segId] = setResult(params.successRate);
      }

      // 날짜 계산 (루틴마다 요일을 약간 다르게 하려면 random 더하기)
      const date = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000) + rng(0, 3 * 24 * 60 * 60 * 1000));
      const startedAt = new Date(date);
      startedAt.setHours(pick([9, 10, 18, 19, 20, 21]), Math.floor(Math.random() * 60), 0, 0);
      const endedAt = new Date(startedAt.getTime() + params.durationSec * 1000);

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
        console.error(`❌ ${routine.title} 세션[${i + 1}] 실패:`, error.message);
        failed++;
      } else {
        inserted++;
      }
    }
  }

  await sb.from("users").update({ current_streak: inserted }).eq("id", USER_ID);

  console.log(`\n🎉 완료! 총 ${inserted}개 세션 삽입 (실패: ${failed}개)`);
}

main().catch(console.error);
