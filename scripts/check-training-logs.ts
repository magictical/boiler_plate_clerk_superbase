/**
 * DB 훈련 로그 데이터 확인 스크립트
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ykxbqenlsnqnphuiyexn.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("=== training_logs 테이블 스키마 확인 ===");
  const { data: schema } = await supabase.rpc("get_columns_info" as any, {
    table_name: "training_logs",
  });
  console.log(JSON.stringify(schema, null, 2));

  console.log("\n=== 최근 training_logs 데이터 ===");
  const { data: logs, error } = await supabase
    .from("training_logs")
    .select("id, user_id, routine_id, status, set_results_json, started_at, ended_at")
    .order("ended_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("에러:", error.message);
  } else {
    console.log("총 행 수:", logs?.length);
    logs?.forEach((log, i) => {
      console.log(`\n--- 로그 ${i + 1} ---`);
      console.log("ID:", log.id);
      console.log("Status:", log.status);
      console.log("started_at:", log.started_at);
      console.log("ended_at:", log.ended_at);
      console.log("set_results_json 타입:", typeof log.set_results_json);
      console.log("set_results_json 값:", JSON.stringify(log.set_results_json, null, 2));
    });
  }

  console.log("\n=== routines 테이블에서 structure_json 확인 ===");
  const { data: routines, error: routineError } = await supabase
    .from("routines")
    .select("id, title, structure_json")
    .limit(2);

  if (routineError) {
    console.error("루틴 에러:", routineError.message);
  } else {
    routines?.forEach((r, i) => {
      console.log(`\n--- 루틴 ${i + 1}: ${r.title} ---`);
      console.log("ID:", r.id);
      console.log("structure_json:", JSON.stringify(r.structure_json, null, 2));
    });
  }
}

main().catch(console.error);
