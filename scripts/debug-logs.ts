/**
 * 훈련 로그 구조 심층 디버그 스크립트
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ykxbqenlsnqnphuiyexn.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("=== 훈련 로그 전체 조회 ===");
  const { data: logs, error } = await supabase
    .from("training_logs")
    .select("*")
    .order("ended_at", { ascending: false });

  if (error) {
    console.error("에러:", error.message);
    return;
  }

  console.log("전체 로그 수:", logs?.length);
  logs?.forEach((log, i) => {
    console.log(`\n--- 로그 ${i + 1} ---`);
    console.log("ID:", log.id);
    console.log("Status:", log.status);
    console.log("routine_id:", log.routine_id);
    console.log("started_at:", log.started_at);
    console.log("ended_at:", log.ended_at);
    console.log("set_results_json:", JSON.stringify(log.set_results_json));
    console.log("set_results_json 키 수:",
      typeof log.set_results_json === 'object' && log.set_results_json !== null
        ? Object.keys(log.set_results_json).length
        : 'N/A'
    );
  });

  console.log("\n=== 루틴 구조 확인 ===");
  const { data: routines, error: re } = await supabase
    .from("routines")
    .select("id, title, structure_json");

  if (re) {
    console.error("루틴 에러:", re.message);
    return;
  }

  routines?.forEach((r) => {
    console.log(`\n루틴: ${r.title} (ID: ${r.id})`);
    const blocks = r.structure_json as any[];
    if (Array.isArray(blocks)) {
      blocks.forEach((b, bi) => {
        console.log(`  블록[${bi}]:`, {
          id: b.id,
          type: b.type,
          title: b.title,
          weight: b.weight,
          reps: b.reps,
        });
      });
    }
  });

  // 예상 세그먼트 ID 계산 (현재 flattenRoutine 로직 기준)
  console.log("\n=== 예상 세그먼트 ID (현재 코드 기준) ===");
  routines?.forEach((r) => {
    const blocks = r.structure_json as any[];
    if (!Array.isArray(blocks)) return;

    const segments: any[] = [{ id: "ready_0", type: "ready" }];

    function processBlocks(items: any[]) {
      items.forEach((block) => {
        if (block.type === "exercise") {
          const globalIndex = segments.length;
          segments.push({ id: `${block.id}_s${globalIndex}`, type: "exercise", blockId: block.id });
        } else if (block.type === "rest") {
          const globalIndex = segments.length;
          segments.push({ id: `${block.id}_s${globalIndex}`, type: "rest", blockId: block.id });
        } else if (block.type === "loop") {
          for (let i = 0; i < block.repeat; i++) {
            processBlocks(block.children || []);
          }
        }
      });
    }

    processBlocks(blocks);

    console.log(`\n루틴 '${r.title}'의 세그먼트 ID들:`);
    segments.filter(s => s.type === "exercise").forEach(s => {
      console.log(`  - ${s.id}`);
    });
  });
}

main().catch(console.error);
