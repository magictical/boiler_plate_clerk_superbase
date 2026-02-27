"use client";

import { deleteRoutine, RoutineResult, setFavoriteRoutine } from "@/actions/routines";
import { formatDuration } from "@/lib/utils/routine-calc";
import { ChevronRight, Dumbbell, Plus, Star, TimerIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RoutineListProps {
  routines: RoutineResult[];
  /** 현재 즐겨찾기된 루틴 ID */
  favoriteId?: string | null;
}

export function RoutineList({ routines: initialRoutines, favoriteId: initialFavoriteId }: RoutineListProps) {
  const router = useRouter();
  const [routines, setRoutines] = useState(initialRoutines);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [favoriteId, setFavoriteId] = useState<string | null>(initialFavoriteId ?? null);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    setRoutines(initialRoutines);
  }, [initialRoutines]);

  const handleDeleteClick = (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeletingId(routineId);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    try {
      const { error } = await deleteRoutine(deletingId);
      if (error) {
        toast.error("루틴 삭제에 실패했습니다.");
      } else {
        toast.success("루틴이 삭제되었습니다.");
        setRoutines((prev) => prev.filter((r) => r.id !== deletingId));
        // 삭제된 루틴이 즐겨찾기였다면 해제
        if (favoriteId === deletingId) setFavoriteId(null);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("루틴 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (togglingFav) return;

    setTogglingFav(true);
    // 이미 즐겨찾기된 루틴을 다시 누르면 해제, 아니면 새로 설정
    const newFavoriteId = favoriteId === routineId ? null : routineId;

    // 즉시 UI 반영 (낙관적 업데이트)
    setFavoriteId(newFavoriteId);

    try {
      const { error } = await setFavoriteRoutine(newFavoriteId);
      if (error) {
        // 실패 시 롤백
        setFavoriteId(favoriteId);
        toast.error("즐겨찾기 설정에 실패했습니다.");
      }
    } catch {
      setFavoriteId(favoriteId);
      toast.error("즐겨찾기 설정 중 오류가 발생했습니다.");
    } finally {
      setTogglingFav(false);
    }
  };

  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center border-2 border-dashed border-[#1fe7f9]/30 rounded-3xl bg-[#142628] shadow-[0_0_15px_rgba(31,231,249,0.1)]">
        <div className="w-16 h-16 rounded-full bg-[#1fe7f9]/20 flex items-center justify-center mb-6 text-[#1fe7f9]">
          <Dumbbell size={32} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">저장된 루틴이 없습니다</h3>
        <p className="text-sm text-gray-400 mb-8 max-w-[240px]">
          새로운 루틴을 만들고 규칙적인 훈련을 시작해보세요!
        </p>
        <Link
          href="/routine-builder"
          className="flex items-center gap-2 bg-[#1fe7f9] text-[#0f2123] px-6 py-3 rounded-full font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(31,231,249,0.3)]"
        >
          <Plus size={20} className="font-bold" />
          새 루틴 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* List */}
      <div className="flex flex-col gap-4">
        {routines.map((routine) => {
          const isFavorite = favoriteId === routine.id;
          return (
            <div
              key={routine.id}
              onClick={() => router.push(`/workout/${routine.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/workout/${routine.id}`);
                }
              }}
              className={`w-full relative group flex flex-col p-5 rounded-2xl border transition-all duration-300 text-left overflow-hidden shadow-sm cursor-pointer ${
                isFavorite
                  ? "border-amber-400/40 bg-[#142628]"
                  : "border-white/5 bg-[#142628] hover:border-[#1fe7f9]/50"
              }`}
            >
              {/* Hover Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#1fe7f9]/0 to-[#1fe7f9]/5 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {isFavorite && (
                        <Star size={16} className="text-amber-400 fill-amber-400 shrink-0" />
                      )}
                      <h3 className={`text-lg font-bold transition-colors line-clamp-1 pr-6 ${
                        isFavorite ? "text-amber-400" : "text-white group-hover:text-[#1fe7f9]"
                      }`}>
                        {routine.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                      <div className="flex items-center gap-1.5 bg-[#1a3336] px-2.5 py-1 rounded-md text-[#1fe7f9]">
                        <TimerIcon size={14} />
                        {formatDuration(routine.estimated_time)}
                      </div>

                      <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md text-gray-300">
                        <Dumbbell size={14} />
                        {routine.total_sets} 세트
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* 즐겨찾기 버튼 */}
                    <button
                      onClick={(e) => handleFavoriteToggle(e, routine.id)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 z-20 ${
                        isFavorite
                          ? "bg-amber-400/20 text-amber-400"
                          : "bg-white/5 text-gray-400 hover:bg-amber-400/20 hover:text-amber-400"
                      }`}
                      title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
                    >
                      <Star size={18} className={isFavorite ? "fill-amber-400" : ""} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, routine.id)}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors shrink-0 z-20"
                      title="루틴 삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-[#1fe7f9] group-hover:text-[#0f2123] transition-colors shrink-0">
                      <ChevronRight size={20} />
                    </div>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adding a new one */}
      <div className="mt-8">
        <Link
          href="/routine-builder"
          className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-dashed border-[#1fe7f9]/40 bg-[#1fe7f9]/5 hover:bg-[#1fe7f9]/10 text-[#1fe7f9] font-bold transition-colors"
        >
          <Plus size={20} />
          새 루틴 생성
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#142628] border border-white/10 rounded-2xl p-6 max-w-[320px] w-full shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-white mb-2">루틴 삭제</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              이 루틴을 정말 삭제하시겠습니까?<br />
              삭제된 루틴은 복구할 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold transition-colors"
              >
                취소
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); confirmDelete(); }}
                className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold transition-colors"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
