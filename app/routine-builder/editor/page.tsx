"use client";

import { BlockListRoot } from "@/components/routine-builder/editor/BlockList";
import { EditorFooter } from "@/components/routine-builder/editor/EditorFooter";
import { RoutineEditorProvider, useRoutineEditor } from "@/components/routine-builder/editor/RoutineEditorContext";
import type { RoutineBlock } from "@/types/routine";
import { ArrowLeft, Layers, Save, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dispatch } = useRoutineEditor();
  const [boardType, setBoardType] = useState<"hangboard" | "lift">("hangboard");
  const [routineName, setRoutineName] = useState("나의 루틴");

  // AI 코치에서 넘어온 에디터: localStorage에서 블록 로드
  useEffect(() => {
    if (searchParams.get("from") === "ai") {
      try {
        const raw = localStorage.getItem("importedRoutine");
        const titleRaw = localStorage.getItem("importedRoutineTitle");
        if (raw) {
          const parsed: RoutineBlock[] = JSON.parse(raw);
          dispatch({ type: "SET_BLOCKS", payload: { blocks: parsed } });
          if (titleRaw) setRoutineName(titleRaw);
          toast.success("AI 에서 생성한 루틴을 불러오는 데 성공했습니다.");
        }
        // 1회만 로드 (cleanup)
        localStorage.removeItem("importedRoutine");
        localStorage.removeItem("importedRoutineTitle");
      } catch (e) {
        console.error("Failed to import AI routine:", e);
      }
    }
  }, [searchParams, dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1414] text-white font-sans antialiased pb-[400px]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1414]/95 backdrop-blur-md px-4 py-3 border-b border-white/5 border-b-[#06e0ce]/30">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center size-10 rounded-full active:bg-white/10 transition-colors"
          >
            <ArrowLeft className="text-gray-300" />
          </button>
          <h2 className="text-lg font-bold tracking-tight text-gray-100">
            커스텀 트레이닝 생성
          </h2>
          <div className="flex gap-2">
            <button className="bg-[#2a3636] text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#384545] transition-colors border border-white/10 flex items-center gap-1 text-gray-200">
              불러오기
            </button>
            <button className="bg-[#2a3636] size-8 flex items-center justify-center rounded-full hover:bg-[#384545] transition-colors border border-white/10 text-gray-200">
              <Save size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-6">
        {/* Routine Name Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#06e0ce] uppercase tracking-wider ml-1">
            루틴 이름
          </label>
          <input
            className="w-full bg-[#1d2626] border-white/5 border rounded-xl px-4 py-4 text-gray-100 placeholder:text-gray-500 focus:ring-1 focus:ring-[#06e0ce] focus:border-[#06e0ce] transition-all outline-none shadow-sm"
            placeholder="새 트레이닝 루틴 이름을 입력하세요"
            type="text"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
          />
        </div>

        {/* 행보드 / 노행 리프트 선택 (높이 축소) */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBoardType("hangboard")}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-xl transition-all ${
              boardType === "hangboard"
                ? "border-2 border-[#06e0ce] bg-[#06e0ce]/10 shadow-neon-box"
                : "border border-white/10 bg-[#2a3636] hover:bg-[#384545]"
            }`}
          >
            <Layers size={22} className={boardType === "hangboard" ? "text-[#06e0ce]" : "text-gray-500"} />
            <span className={`text-xs font-bold ${boardType === "hangboard" ? "text-[#06e0ce]" : "text-gray-400"}`}>
              행보드
            </span>
          </button>
          <button
            type="button"
            onClick={() => setBoardType("lift")}
            className={`flex flex-col items-center justify-center gap-1 py-2.5 px-3 rounded-xl transition-all ${
              boardType === "lift"
                ? "border-2 border-[#06e0ce] bg-[#06e0ce]/10 shadow-neon-box"
                : "border border-white/10 bg-[#2a3636] hover:bg-[#384545]"
            }`}
          >
            <Upload size={22} className={boardType === "lift" ? "text-[#06e0ce]" : "text-gray-500"} />
            <span className={`text-xs font-bold ${boardType === "lift" ? "text-[#06e0ce]" : "text-gray-400"}`}>
              노행 리프트
            </span>
          </button>
        </div>

        {/* Block List */}
        <BlockListRoot />
      </main>

      {/* Footer (Fixed) */}
      <EditorFooter routineName={routineName} />
    </div>
  );
}

export default function RoutineEditorPage() {
  return (
    <RoutineEditorProvider>
      <EditorContent />
    </RoutineEditorProvider>
  );
}
