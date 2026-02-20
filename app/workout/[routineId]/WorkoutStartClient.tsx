"use client";

import type { RoutineResult } from "@/actions/routines";
import { ModeSelectModal } from "@/components/workout/ModeSelectModal";
import { RoutinePreviewList } from "@/components/workout/RoutinePreviewList";
import { formatDuration } from "@/lib/utils/routine-calc";
import { ArrowLeft, Dumbbell, Play, Timer as TimerIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function WorkoutStartClient({ routine }: { routine: RoutineResult }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // db에 저장된 estimated_time과 total_sets 사용

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1414] text-white font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1414]/95 backdrop-blur-md px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center size-10 rounded-full active:bg-white/10 transition-colors"
          >
            <ArrowLeft className="text-gray-300" />
          </button>
          <h2 className="text-lg font-bold tracking-tight text-gray-100">
            훈련 요약
          </h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-6 space-y-8">
        <div className="space-y-2 mt-4">
          <h1 className="text-3xl font-display font-bold text-[#06e0ce]">
            {routine.title}
          </h1>
          <p className="text-gray-400">
            선택한 루틴의 전체 흐름을 확인하고 훈련을 시작하세요.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#162629] p-5 rounded-2xl border border-[#25d1f4]/20 shadow-[0_0_15px_rgba(37,209,244,0.1)] flex flex-col gap-1 items-center justify-center">
            <TimerIcon className="text-[#25d1f4] mb-1" size={28} />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              예상 소요시간
            </span>
            <span className="text-2xl font-display font-bold text-white">
              {formatDuration(routine.estimated_time)}
            </span>
          </div>

          <div className="bg-[#162629] p-5 rounded-2xl border border-white/5 flex flex-col gap-1 items-center justify-center">
            <Dumbbell className="text-gray-400 mb-1" size={28} />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              총 세트
            </span>
            <span className="text-2xl font-display font-bold text-white">
              {routine.total_sets}번
            </span>
          </div>
        </div>

        {/* Routine Preview List */}
        <RoutinePreviewList blocks={routine.structure_json} />

        {/* Action Button */}
        <div className="pt-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full h-16 bg-[#06e0ce] hover:opacity-90 active:scale-[0.98] transition-all rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,224,206,0.3)] group"
          >
            <span className="text-[#0d1414] font-bold text-lg mr-2">
              훈련 시작하기
            </span>
            <Play className="text-[#0d1414] fill-[#0d1414] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </main>

      {/* 모드 선택 모달 */}
      <ModeSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        routineId={routine.id}
      />
    </div>
  );
}
