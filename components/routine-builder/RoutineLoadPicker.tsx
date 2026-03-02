"use client";

import { deleteRoutine, getRoutines, RoutineResult } from "@/actions/routines";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils/routine-calc";
import { Dumbbell, ListPlus, Loader2, Timer, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface RoutineLoadPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (routine: RoutineResult) => void;
}

export function RoutineLoadPicker({ isOpen, onClose, onSelect }: RoutineLoadPickerProps) {
  const [routines, setRoutines] = useState<RoutineResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => setIsAnimating(true));
      document.body.style.overflow = "hidden";
      loadRoutines();
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const loadRoutines = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getRoutines();
      if (error) {
        toast.error("루틴 목록을 불러오지 못했습니다.");
      } else if (data) {
        setRoutines(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation();
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
      }
    } catch (err) {
      console.error(err);
      toast.error("루틴 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal Sheet */}
      <div
        className={cn(
          "relative w-full max-w-md h-[85vh] bg-[#1d2626] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl transition-transform duration-300 ease-out transform border-x border-t border-white/10",
          isAnimating ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Header Section */}
        <div className="flex-none pt-2 pb-2 bg-transparent">
          {/* Drag Handle */}
          <div className="w-full flex justify-center pt-2 pb-4 cursor-grab active:cursor-grabbing" onClick={onClose}>
            <div className="h-1.5 w-12 rounded-full bg-white/20"></div>
          </div>

          {/* Title Bar */}
          <div className="flex items-center justify-between px-6 pb-2 border-b border-white/5">
            <div className="w-10"></div>
            <h2 className="text-xl font-bold text-white tracking-tight">루틴 불러오기</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent px-4 pb-8 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#06e0ce]">
              <Loader2 className="animate-spin" size={32} />
              <span className="text-sm font-bold">불러오는 중...</span>
            </div>
          ) : routines.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                <Dumbbell size={28} />
              </div>
              <p className="text-gray-400 font-bold mb-1">저장된 루틴이 없습니다</p>
              <p className="text-gray-500 text-sm">먼저 나만의 루틴을 만들어보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  onClick={() => onSelect(routine)}
                  className="bg-[#0d1414] border border-white/10 rounded-2xl p-4 cursor-pointer hover:border-[#06e0ce]/50 transition-colors group active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-2 group">
                    <h3 className="text-white font-bold text-lg group-hover:text-[#06e0ce] transition-colors truncate pr-4">
                      {routine.title}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteClick(e, routine.id)}
                      className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                      title="루틴 삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5">
                      <ListPlus size={14} className="text-[#06e0ce]" />
                      <span>{routine.total_sets} 세트</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Timer size={14} className="text-[#06e0ce]" />
                      <span>{formatDuration(routine.estimated_time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1d2626] border border-white/10 rounded-2xl p-6 max-w-[320px] w-full shadow-2xl animate-in fade-in zoom-in-95">
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
