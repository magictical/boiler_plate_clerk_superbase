import { getProfileForHome } from "@/actions/profiles";
import { getFavoriteRoutineId, getRoutines } from "@/actions/routines";
import { GuestGate } from "@/components/routine-builder/GuestGate";
import { RoutineList } from "@/components/routine-builder/RoutineList";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function RoutinesPage() {
  const { isGuest } = await getProfileForHome();

  if (isGuest) {
    return <GuestGate />;
  }

  const { data: routines, error } = await getRoutines();
  const { data: favoriteId } = await getFavoriteRoutineId();

    if (error) {
      return (
        <main className="min-h-screen bg-[#0d1414] text-white">
          <div className="max-w-[430px] mx-auto px-4 py-8">
            <p className="text-red-400">루틴 데이터를 불러오는 중 오류가 발생했습니다.</p>
          </div>
        </main>
      );
    }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1414] text-white font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1414]/95 backdrop-blur-md px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center justify-center size-10 rounded-full hover:bg-white/10 active:bg-white/10 transition-colors text-gray-300"
          >
            <ArrowLeft size={24} />
          </Link>
          <h2 className="text-lg font-bold tracking-tight text-gray-100">
            내 루틴 목록
          </h2>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-6">
        <RoutineList routines={routines || []} favoriteId={favoriteId} />
      </main>

      {/* Bottom Spacer */}
      <div className="h-6 w-full shrink-0"></div>
    </div>
  );
}
