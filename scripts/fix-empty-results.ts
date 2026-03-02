/**
 * 기존 빈 set_results_json 데이터를 루틴 구조 기반으로 채우는 스크립트
 * 타이머 모드로 훈련한 기존 completed 로그들의 {} → {segmentId: "success"} 로 업데이트
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ykxbqenlsnqnphuiyexn.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY";

const supabase = createClient(supabaseUrl, serviceRoleKey);

// flattenRoutine 로직 복제 (새 포맷 기준)
function flattenRoutine(blocks: any[]) {
  const segments: any[] = [{ id: "ready_0", blockId: "ready_0", type: "ready" }];

  function processBlocks(items: any[]) {
    items.forEach((block) => {
      if (block.type === "exercise") {
        const globalIndex = segments.length;
        segments.push({
          id: `${block.id}_s${globalIndex}`,
          blockId: block.id,
          type: "exercise",
          title: block.title,
          weight: block.weight,
          reps: block.reps,
        });
      } else if (block.type === "rest") {
        const globalIndex = segments.length;
        segments.push({
          id: `${block.id}_s${globalIndex}`,
          blockId: block.id,
          type: "rest",
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

async function main() {
  // 1. 빈 set_results_json을 가진 completed 로그 조회
  const { data: emptyLogs, error: fetchError } = await supabase
    .from("training_logs")
    .select("id, routine_id, set_results_json, status")
    .eq("status", "completed");

  if (fetchError) {
    console.error("로그 조회 실패:", fetchError.message);
    return;
  }

  const toFix = emptyLogs?.filter(log => {
    const res = log.set_results_json;
    return typeof res === 'object' && res !== null && !Array.isArray(res) && Object.keys(res).length === 0;
  }) || [];

  console.log(`총 completed 로그: ${emptyLogs?.length}개`);
  console.log(`빈 set_results_json인 로그: ${toFix.length}개 → 수정 대상`);

  if (toFix.length === 0) {
    console.log("수정할 데이터가 없습니다.");
    return;
  }

  // 2. 루틴 정보 캐시
  const routineCache: Record<string, any[]> = {};

  for (const log of toFix) {
    let structure: any[] = routineCache[log.routine_id];

    if (!structure) {
      const { data: routineRow } = await supabase
        .from("routines")
        .select("structure_json")
        .eq("id", log.routine_id)
        .maybeSingle();

      if (!routineRow) {
        console.log(`루틴 못 찾음: ${log.routine_id}`);
        continue;
      }
      structure = routineRow.structure_json;
      routineCache[log.routine_id] = structure;
    }

    // 3. 세그먼트 생성 및 모두 "success" 처리
    const segments = flattenRoutine(structure);
    const exerciseSegments = segments.filter(s => s.type === "exercise");

    const results: Record<string, string> = {};
    exerciseSegments.forEach(seg => {
      results[seg.id] = "success";
    });

    console.log(`\n로그 ${log.id} 업데이트:`);
    console.log("  exercise 세그먼트 수:", exerciseSegments.length);
    console.log("  결과:", JSON.stringify(results));

    // 4. DB 업데이트
    const { error: updateError } = await supabase
      .from("training_logs")
      .update({ set_results_json: results })
      .eq("id", log.id);

    if (updateError) {
      console.error(`  업데이트 실패: ${updateError.message}`);
    } else {
      console.log("  ✅ 업데이트 성공");
    }
  }

  console.log("\n=== 업데이트 완료 후 확인 ===");
  const { data: finalLogs } = await supabase
    .from("training_logs")
    .select("id, set_results_json")
    .eq("status", "completed")
    .order("ended_at", { ascending: false });

  finalLogs?.forEach((log, i) => {
    const res = log.set_results_json;
    const keyCount = typeof res === 'object' && res !== null ? Object.keys(res).length : 0;
    console.log(`로그 ${i + 1}: ${keyCount}개의 세그먼트 결과`);
    if (keyCount > 0) {
      console.log("  내용:", JSON.stringify(res));
    }
  });
}

main().catch(console.error);
