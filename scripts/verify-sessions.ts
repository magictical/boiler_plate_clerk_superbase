import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://ykxbqenlsnqnphuiyexn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreGJxZW5sc25xbnBodWl5ZXhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkyOTU0NCwiZXhwIjoyMDg0NTA1NTQ0fQ.NGpKUg9-8i2DvLYPa1aw8RFnlA2qhCtz2N4w6aMoqZY"
);

async function main() {
  const { data, error } = await sb
    .from("training_logs")
    .select("id, routine_id, status, rpe, user_weight_kg, started_at, ended_at, set_results_json")
    .eq("user_id", "c3d3bd22-3262-4584-a52c-abb9a159b6f0")
    .eq("status", "completed")
    .order("ended_at", { ascending: true });

  if (error) { console.error(error.message); return; }

  // 루틴별 집계
  const byRoutine: Record<string, { count: number; totalSuccess: number; totalSets: number }> = {};

  data?.forEach(log => {
    const res = log.set_results_json as Record<string, string>;
    const success = Object.values(res).filter(v => v === "success").length;
    const total = Object.keys(res).length;
    const key = log.routine_id;
    if (!byRoutine[key]) byRoutine[key] = { count: 0, totalSuccess: 0, totalSets: 0 };
    byRoutine[key].count++;
    byRoutine[key].totalSuccess += success;
    byRoutine[key].totalSets += total;
  });

  console.log(`총 completed 세션: ${data?.length}개\n`);

  const routineNames: Record<string, string> = {
    "01a62183-f355-4e4c-95ee-8520af5be5a6": "맥스 행",
    "360a2944-961c-4069-b69e-e9fe0fc10aff": "미니멈 엣지",
    "4c955da2-a448-4971-824f-caa4846c3d40": "중량 풀업",
    "2efabbb3-c263-4296-8c38-fd503f7c6572": "고볼륨 풀업",
    "b3d32f7c-c901-45b6-80b8-4d7f4cf30b6d": "노행 리프트",
    "38df04ba-2784-4e69-92ea-8f7f718280e7": "캠퍼스 런지",
    "e8ed78be-61df-491a-b83f-f5a67373b5c9": "스프레이월",
    "32896a60-7f93-433a-b28d-89b499159207": "[기존] 나의 루틴",
  };

  const lines = Object.entries(byRoutine).map(([id, stat]) => {
    const name = routineNames[id] || id;
    const rate = stat.totalSets > 0 ? Math.round((stat.totalSuccess / stat.totalSets) * 100) : 0;
    return `[${name}] ${stat.count}세션 | 성공률 ${rate}% (${stat.totalSuccess}/${stat.totalSets})`;
  });

  console.log(lines.join("\n"));

  // 날짜 범위
  if (data && data.length > 0) {
    const first = new Date(data[0].started_at!);
    const last  = new Date(data[data.length - 1].ended_at!);
    console.log(`\n기간: ${first.toLocaleDateString("ko-KR")} ~ ${last.toLocaleDateString("ko-KR")}`);
  }
}
main().catch(console.error);
