import { getRoutine } from "@/actions/routines";
import { LoggerPlayer } from "@/components/workout/LoggerPlayer";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { flattenRoutine } from "@/lib/utils/flattenRoutine";
import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";

export default async function LoggerWorkoutPage({ params }: { params: Promise<{ routineId: string }> }) {
  const { routineId } = await params;

  // Get routine and user weight
  const { userId } = await auth();
  const supabase = getServiceRoleClient();

  const [routineRes, userRes] = await Promise.all([
    getRoutine(routineId),
    userId ? supabase.from("users").select("weight_kg").eq("clerk_id", userId).maybeSingle() : Promise.resolve({ data: null })
  ]);

  const routine = routineRes.data;
  const userWeight = userRes.data?.weight_kg || 0;

  if (routineRes.error || !routine) {
    notFound();
  }

  // 루틴 블록(1차원 변환)
  const segments = flattenRoutine(routine.structure_json);
  const exerciseSegments = segments.filter(s => s.type === "exercise");

  // 세그먼트가 없으면 에러
  if (!exerciseSegments || exerciseSegments.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center text-center p-6 text-white bg-[#0d1414]">
        <div>
          <h2 className="text-xl font-bold mb-2">훈련 데이터가 없습니다</h2>
          <p className="text-gray-400">운동 세트가 포함된 루틴이 필요합니다.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d1414] text-white font-sans overflow-hidden">
      <div className="max-w-md w-full mx-auto h-screen relative">
        <LoggerPlayer segments={segments} routineId={routine.id} userWeight={userWeight} />
      </div>
    </main>
  );
}
