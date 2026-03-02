/**
 * getRoutineAnalytics 로직 검증 스크립트
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ykxbqenlsnqnphuiyexn.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY";

const supabase = createClient(supabaseUrl, serviceRoleKey);

function flattenRoutine(blocks: any[]) {
  const segments: any[] = [{ id: "ready_0", blockId: "ready_0", type: "ready" }];
  function processBlocks(items: any[]) {
    items.forEach((block) => {
      if (block.type === "exercise") {
        const globalIndex = segments.length;
        segments.push({ id: `${block.id}_s${globalIndex}`, blockId: block.id, type: "exercise", weight: block.weight, reps: block.reps });
      } else if (block.type === "rest") {
        const globalIndex = segments.length;
        segments.push({ id: `${block.id}_s${globalIndex}`, blockId: block.id, type: "rest" });
      } else if (block.type === "loop") {
        for (let i = 0; i < block.repeat; i++) processBlocks(block.children || []);
      }
    });
  }
  processBlocks(blocks);
  return segments;
}

async function main() {
  const routineId = "32896a60-7f93-433a-b28d-89b499159207";
  const USER_WEIGHT = 70; // 임시 체중 (kg)

  // 루틴 조회
  const { data: routineRow } = await supabase.from("routines").select("structure_json").eq("id", routineId).maybeSingle();
  if (!routineRow) { console.error("루틴 없음"); return; }

  const segments = flattenRoutine(routineRow.structure_json);
  const exerciseSegments = segments.filter((s: any) => s.type === "exercise");

  // 세그먼트 맵 (ID 기반)
  const segmentById = new Map<string, any>();
  const segmentsByBlockId = new Map<string, any[]>();
  exerciseSegments.forEach((seg: any) => {
    segmentById.set(seg.id, seg);
    const arr = segmentsByBlockId.get(seg.blockId) || [];
    arr.push(seg);
    segmentsByBlockId.set(seg.blockId, arr);
  });

  function findSegment(segmentId: string): any {
    const exact = segmentById.get(segmentId);
    if (exact) return exact;
    const match = segmentId.match(/^(.+?)(_s?\d+)$/);
    if (match) {
      const blockId = match[1];
      const arr = segmentsByBlockId.get(blockId);
      if (arr && arr.length > 0) return arr[0];
    }
    return undefined;
  }

  console.log("세그먼트 목록:");
  exerciseSegments.forEach((seg: any) => {
    console.log(`  - ID: ${seg.id}, weight: ${seg.weight}, reps: ${seg.reps}`);
  });

  // 로그 조회
  const { data: logs } = await supabase
    .from("training_logs")
    .select("ended_at, set_results_json, rpe")
    .eq("routine_id", routineId)
    .eq("status", "completed")
    .order("ended_at", { ascending: true });

  console.log(`\n로그 수: ${logs?.length}`);

  const grouped: Record<string, any> = {};

  logs?.forEach(log => {
    if (!log.ended_at) return;
    const dateStr = new Date(log.ended_at).toLocaleDateString("ko-KR", { month: 'short', day: 'numeric' });
    const res = log.set_results_json as Record<string, string>;

    let sessionVolume = 0;
    let sessionMaxLoad = 0;

    console.log(`\n날짜: ${dateStr}, set_results_json:`, JSON.stringify(res));

    if (typeof res === "object" && res !== null && !Array.isArray(res)) {
      Object.entries(res).forEach(([segmentId, status]) => {
        if (status === "success" || status === "half") {
          const seg = findSegment(segmentId);
          console.log(`  세그먼트 ${segmentId}: ${status}, 세그먼트 데이터:`, seg ? `weight=${seg.weight}, reps=${seg.reps}` : "NOT FOUND");
          if (seg) {
            const reps = seg.reps || 1;
            const addedWeight = seg.weight || 0;
            const unitVolume = (USER_WEIGHT + addedWeight) * reps;
            const multiplier = status === "success" ? 1 : 0.5;
            sessionVolume += unitVolume * multiplier;
            const currentLoad = USER_WEIGHT + addedWeight;
            if (currentLoad > sessionMaxLoad) sessionMaxLoad = currentLoad;
          }
        }
      });
    }

    console.log(`  계산: volume=${sessionVolume}, maxLoad=${sessionMaxLoad}`);

    if (!grouped[dateStr]) {
      grouped[dateStr] = { date: dateStr, volume: sessionVolume, maxLoad: sessionMaxLoad };
    } else {
      grouped[dateStr].volume += sessionVolume;
      grouped[dateStr].maxLoad = Math.max(grouped[dateStr].maxLoad, sessionMaxLoad);
    }
  });

  console.log("\n=== 최종 Analytics 결과 ===");
  console.log(JSON.stringify(Object.values(grouped), null, 2));
}

main().catch(console.error);
