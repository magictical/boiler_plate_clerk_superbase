"use client";

import { RoutineBlock } from "@/types/database";
import { Clock, Flame, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RoutineSuggestionCardProps {
  title?: string;
  blocks: RoutineBlock[];
  onImport?: () => void;
}

export function RoutineSuggestionCard({
  title = "AI 추천 루틴",
  blocks,
  onImport,
}: RoutineSuggestionCardProps) {
  const router = useRouter();

  // 간단한 통계 계산
  const totalDuration = blocks.reduce(
    (acc, block) => acc + (block.durationSeconds || 0),
    0
  );
  const minutes = Math.floor(totalDuration / 60);

  // 강도 추정 (임시 로직: 블록 수에 따라)
  const intensity = blocks.length > 5 ? "고강도" : "중강도";

  const handleImport = () => {
    // 1. 로컬 스토리지에 저장 (MVP)
    // 실제 빌더 페이지에서는 이 값을 읽어서 초기화해야 함
    localStorage.setItem("importedRoutine", JSON.stringify(blocks));
    
    toast.success("루틴을 빌더로 가져왔습니다.");
    
    if (onImport) {
      onImport();
    } else {
      router.push("/routine-builder/editor");
    }
  };

  return (
    <div className="w-full mt-1 bg-[#1b2627] border border-white/10 rounded-xl overflow-hidden shadow-lg group">
      {/* Card Image Header */}
      <div
        className="h-32 bg-cover bg-center relative"
        style={{
          backgroundImage:
            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC_C7AVWCY7Kh3L-JaEX7kQtw5HtRAjyjqNqaIMgeoq5fsIb-yc6tm5DD0h426SDk2PdrQ_ccd1c1MczZl_DFZ7b0JaOeUjO0Bd49PlGIaVMefIueFQld13o_NveuMpTTY5oDAlLMOCyvOht-9tFJyxYP7qgfzmqEoRyuejBfq87WJ9m0aXhMVS6MBSEny6d7RxHQLY0Ctsmaegft_2qpDayXHxPCUYlm-7dOXqiTsvy_TCluULDuGtU-6iqPjZ_MLm7Y7uVw_gY6M2")',
        }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-[#1b2627] via-[#1b2627]/50 to-transparent"></div>
        <div className="absolute bottom-3 left-4">
          <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-[#1fe7f9] text-[10px] font-bold px-2 py-0.5 rounded border border-[#1fe7f9]/30 uppercase tracking-wider">
            <span className="material-symbols-outlined text-[12px]">
              medical_services
            </span>
            Recovery
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 pt-2">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-white text-base font-bold leading-tight mb-1">
              {title}
            </h3>
            <div className="flex items-center gap-3 text-[#9bb8bb] text-sm">
              <span className="flex items-center gap-1">
                <Clock size={16} /> {minutes}분
              </span>
              <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
              <span className="flex items-center gap-1">
                <Flame size={16} className="text-orange-400" />
                {intensity}
              </span>
            </div>
          </div>
        </div>

        {/* Highlights/Tags (Static for MVP) */}
        <div className="flex gap-2 mb-4">
          <span className="text-[11px] text-gray-400 bg-white/5 px-2 py-1 rounded">
            No Dyno
          </span>
          <span className="text-[11px] text-gray-400 bg-white/5 px-2 py-1 rounded">
            Static Moves
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleImport}
          className="w-full h-11 bg-[#1fe7f9] hover:bg-[#5ff0fc] text-[#0f2123] text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(31,231,249,0.25)] hover:shadow-[0_0_20px_rgba(31,231,249,0.4)] active:scale-[0.99]"
        >
          <PlusCircle size={20} />
          빌더로 가져오기
        </button>
      </div>
    </div>
  );
}
