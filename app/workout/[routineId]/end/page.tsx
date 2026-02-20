import { getRoutine } from "@/actions/routines";
import { SessionEndClient } from "@/components/workout/SessionEndClient";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function WorkoutEndPage({ params }: { params: Promise<{ routineId: string }> }) {
  const { routineId } = await params;
  const { data: routine, error } = await getRoutine(routineId);

  if (error || !routine) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0d1414] text-white font-sans overflow-hidden">
      <div className="max-w-md w-full mx-auto h-screen relative">
        <Suspense fallback={<div className="p-6 text-center text-gray-400 mt-20">로딩 중...</div>}>
          <SessionEndClient routine={routine} />
        </Suspense>
      </div>
    </main>
  );
}
