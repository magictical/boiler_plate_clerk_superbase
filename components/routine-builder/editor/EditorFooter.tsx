"use client";

import { ExercisePicker } from "@/components/routine-builder/ExercisePicker";
import type { ExerciseDef } from "@/lib/data/exercises";
import { formatDuration } from "@/lib/utils/routine-calc";
import { RoutineBlock } from "@/types/routine";
import { ChevronDown, ChevronUp, ListPlus, Plus, Timer } from "lucide-react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRoutineEditor } from "./RoutineEditorContext";

interface EditorFooterProps {
  routineName: string;
  editId?: string | null;
}

export function EditorFooter({ routineName, editId }: EditorFooterProps) {
  const { state, dispatch } = useRoutineEditor();
  const { stats } = state;
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExerciseSelect = (ex: ExerciseDef) => {
    const newBlock: RoutineBlock = {
      id: uuidv4(),
      type: "exercise",
      exerciseId: ex.id,
      title: ex.title,
      duration: ex.defaultDuration,
      requiredFields: ex.requiredFields,
      allowedEdges: ex.allowedEdges,
      reps: ex.requiredFields?.includes("reps") ? 10 : undefined,
      weight: ex.requiredFields?.includes("weight") ? 0 : undefined,
      edgeSize: ex.requiredFields?.includes("edgeSize") ? (ex.allowedEdges?.[0] || 20) : undefined,
      color: "#ff0909ff",
    };
    dispatch({ type: "ADD_BLOCK", payload: { block: newBlock } });
    setIsPickerOpen(false);
  };

  const handleAddRest = () => {
    const newBlock: RoutineBlock = {
      id: uuidv4(),
      type: "rest",
      title: "휴식",
      duration: 60,
      color: "#4caf50",
    };
    dispatch({ type: "ADD_BLOCK", payload: { block: newBlock } });
  };

  const handleAddLoop = () => {
    // MVP: 빈 루프 블록 추가 (내부 아이템은 추후 구현)
    const newBlock: RoutineBlock = {
      id: uuidv4(),
      type: "loop",
      title: "세트 그룹",
      repeat: 3,
      color: "#673ab7",
      children: [
        {
          id: uuidv4(),
          type: "exercise",
          title: "반복 운동",
          duration: 20,
          color: "#ff0909ff",
        },
        {
          id: uuidv4(),
          type: "rest",
          title: "휴식",
          duration: 10,
          color: "#4caf50",
        },
      ],
    };
    dispatch({ type: "ADD_BLOCK", payload: { block: newBlock } });
  };

  const getBlockColor = (type: string, defaultColor: string) => {
    let block = state.blocks.find((b) => b.type === type);
    if (block?.color) return block.color;
    for (const b of state.blocks) {
      if (b.type === "loop" && b.children) {
        const child = b.children.find((c) => c.type === type);
        if (child?.color) return child.color;
      }
    }
    return defaultColor;
  };

  const exerciseColor = getBlockColor("exercise", "#ff0909ff");
  const restColor = getBlockColor("rest", "#4caf50");
  const loopColor = getBlockColor("loop", "#673ab7");

  return (
    <>
      <div
        className="fixed bottom-0 w-full max-w-[430px] left-1/2 -translate-x-1/2 bg-[#0d1414]/85 backdrop-blur-md z-50 pt-4 px-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
      >
      <div className="max-w-md mx-auto space-y-4">
        {/* 추가 버튼 그룹 & 접기/펴기 토글 */}
        <div className="flex justify-between items-center relative z-20">
          <div className="bg-[#1d2626] p-1.5 rounded-2xl flex items-center justify-center gap-1 sm:gap-2 shadow-[0_8px_16px_rgba(0,0,0,0.4)] border border-white/10 flex-1">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-[#06e0ce]/15 hover:bg-[#06e0ce]/25 text-[#06e0ce] border border-[#06e0ce]/30 transition-all active:scale-95 group"
            >
              <Plus
                size={18}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-bold text-[11px] sm:text-xs">운동</span>
            </button>
            <div className="w-px h-6 bg-white/10"></div>
            <button
              type="button"
              onClick={handleAddLoop}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl hover:bg-white/5 text-gray-200 transition-all active:scale-95"
            >
              <ListPlus size={18} />
              <span className="font-bold text-[11px] sm:text-xs">세트</span>
            </button>
            <div className="w-px h-6 bg-white/10"></div>
            <button
              type="button"
              onClick={handleAddRest}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl hover:bg-white/5 text-[#00e676] transition-all active:scale-95"
            >
              <Timer size={18} />
              <span className="font-bold text-[11px] sm:text-xs">휴식</span>
            </button>
          </div>

          {/* 확장/축소 토글 버튼 */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-3 p-3 rounded-xl bg-[#2a3636] border border-white/10 text-gray-300 hover:text-white hover:bg-[#384545] transition-colors shadow-sm"
            aria-label={isExpanded ? "통계 숨기기" : "통계 보기"}
          >
            {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {/* 접었다 폈다 할 수 있는 확장 영역 (통계 + 타임라인) */}
        {isExpanded && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
            {/* 통계 그리드 */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  총 운동
                </span>
                <span className="text-sm font-display font-bold text-[#06e0ce] drop-shadow-[0_0_8px_rgba(6,224,206,0.5)]">
                  {stats.totalExercises}회
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  총 세트
                </span>
                <span className="text-sm font-display font-bold text-[#06e0ce]">
                  {stats.totalSets}세트
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  TUT
                </span>
                <span className="text-sm font-display font-bold text-[#06e0ce]">
                  {formatDuration(stats.tut)}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  전체 시간
                </span>
                <span className="text-sm font-display font-bold text-[#06e0ce]">
                  {formatDuration(stats.totalDuration)}
                </span>
              </div>
            </div>

            {/* Timeline - 하단 safe area 위에 여유 있게 배치 */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Timeline
                </span>
                <div className="flex items-center gap-3 text-[9px]">
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full" style={{ backgroundColor: exerciseColor, boxShadow: `0 0 6px ${exerciseColor}80` }} />
                    <span className="text-gray-400">운동</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full" style={{ backgroundColor: restColor, boxShadow: `0 0 6px ${restColor}80` }} />
                    <span className="text-gray-400">휴식</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="size-2 rounded-full" style={{ backgroundColor: loopColor, boxShadow: `0 0 6px ${loopColor}80` }} />
                    <span className="text-gray-400">세트</span>
                  </div>
                </div>
              </div>

              {/* Timeline Bar - 그래프 색상 명시적으로 적용 */}
              <div className="h-14 flex items-end w-full bg-[#1a2222] rounded-xl overflow-hidden px-1.5 pt-3 pb-1.5 gap-[2px] border border-white/10 relative">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none opacity-30 z-0">
                  <div className="w-full h-px bg-white/40 border-t border-dashed" />
                  <div className="w-full h-px bg-white/25" />
                  <div className="w-full h-px bg-white/15" />
                </div>

                {/* Blocks Rendering */}
                {state.blocks.map((block) => {
                  const duration =
                    block.type === "loop"
                      ? (block.children?.reduce((acc, c) => acc + (c.type !== "loop" ? c.duration : 0), 0) ?? 0) * block.repeat
                      : block.duration;
                  const widthPercent = (duration / (stats.totalDuration || 1)) * 100;
                  const safeWidth = Math.max(widthPercent, 2);

                  const blockColor = block.color || (block.type === "exercise" ? "#ff0909ff" : block.type === "rest" ? "#4caf50" : "#673ab7");

                  if (block.type === "exercise") {
                    return (
                      <div
                        key={block.id}
                        className="rounded-t-sm transition-all duration-300 z-10"
                        style={{ width: `${safeWidth}%`, height: "60%", backgroundColor: blockColor, boxShadow: `0 0 8px ${blockColor}80` }}
                      />
                    );
                  }
                  if (block.type === "rest") {
                    return (
                      <div
                        key={block.id}
                        className="rounded-t-sm transition-all duration-300 z-10"
                        style={{ width: `${safeWidth}%`, height: "30%", backgroundColor: blockColor, boxShadow: `0 0 6px ${blockColor}66` }}
                      />
                    );
                  }
                  if (block.type === "loop") {
                    return (
                      <div
                        key={block.id}
                        className="rounded-t-sm transition-all duration-300 border-t-2 z-10 opacity-70"
                        style={{ width: `${safeWidth}%`, height: "50%", backgroundColor: blockColor, borderColor: blockColor }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    <ExercisePicker
      isOpen={isPickerOpen}
      onClose={() => setIsPickerOpen(false)}
      onSelect={handleExerciseSelect}
    />
  </>
  );
}
