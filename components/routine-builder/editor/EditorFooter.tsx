"use client";

import { createRoutine } from "@/actions/routines";
import { ExercisePicker } from "@/components/routine-builder/ExercisePicker";
import type { ExerciseDef } from "@/lib/data/exercises";
import { formatDuration } from "@/lib/utils/routine-calc";
import { RoutineBlock } from "@/types/routine";
import { CheckCircle, ListPlus, Loader2, Plus, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { useRoutineEditor } from "./RoutineEditorContext";

interface EditorFooterProps {
  routineName: string;
}

export function EditorFooter({ routineName }: EditorFooterProps) {
  const router = useRouter();
  const { state, dispatch } = useRoutineEditor();
  const { stats } = state;
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (state.blocks.length === 0) {
      toast.error("루틴에 운동을 하나 이상 추가해주세요.");
      return;
    }

    setIsSaving(true);
    const { error } = await createRoutine({
      title: routineName || "나의 루틴",
      estimated_time: stats.totalDuration,
      total_sets: stats.totalSets,
      structure_json: state.blocks,
    });
    setIsSaving(false);

    if (error) {
      toast.error("루틴 저장에 실패했습니다.");
      console.error(error);
      return;
    }

    toast.success("루틴이 성공적으로 저장되었습니다!");
    // 추후 대시보드나 상세 페이지로 이동하도록 수정
    router.push("/routines");
  };

  const handleExerciseSelect = (ex: ExerciseDef) => {
    const newBlock: RoutineBlock = {
      id: uuidv4(),
      type: "exercise",
      title: ex.title,
      duration: ex.defaultDuration,
      reps: 10,
      color: "#f44336",
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
      color: "#2196f3",
      children: [
        {
          id: uuidv4(),
          type: "exercise",
          title: "반복 운동",
          duration: 20,
          color: "#f44336",
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

  return (
    <div
      className="fixed bottom-0 left-0 w-full bg-[#0d1414]/85 backdrop-blur-md z-50 pt-4 px-5 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5"
      style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
    >
      <div className="max-w-md mx-auto space-y-5">
        {/* 통계 그리드 */}
        <div className="grid grid-cols-4 gap-2 border-b border-white/5 pb-4">
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

        {/* 추가 버튼 그룹 - 하단 패딩으로 그래프 섹션과 겹침 방지 */}
        <div className="flex justify-center pb-4 relative z-20">
          <div className="bg-[#1d2626] p-1.5 rounded-2xl flex items-center gap-2 shadow-[0_8px_16px_rgba(0,0,0,0.4)] border border-white/10">
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#06e0ce]/15 hover:bg-[#06e0ce]/25 text-[#06e0ce] border border-[#06e0ce]/30 transition-all active:scale-95 group"
            >
              <Plus
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="font-bold text-xs">운동</span>
            </button>
            <div className="w-px h-6 bg-white/10"></div>
            <button
              type="button"
              onClick={handleAddLoop}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-white/5 text-gray-200 transition-all active:scale-95"
            >
              <ListPlus size={20} />
              <span className="font-bold text-xs">세트</span>
            </button>
            <div className="w-px h-6 bg-white/10"></div>
            <button
              type="button"
              onClick={handleAddRest}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl hover:bg-white/5 text-[#00e676] transition-all active:scale-95"
            >
              <Timer size={20} />
              <span className="font-bold text-xs">휴식</span>
            </button>
          </div>
        </div>

        {/* Intensity Graph - 하단 safe area 위에 여유 있게 배치 */}
        <div className="space-y-2">
          <div className="flex justify-between items-end px-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Intensity Graph
            </span>
            <div className="flex items-center gap-3 text-[9px]">
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-[#f44336] shadow-[0_0_6px_rgba(244,67,54,0.6)]" />
                <span className="text-gray-400">운동</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="size-2 rounded-full bg-[#4caf50] shadow-[0_0_6px_rgba(76,175,80,0.5)]" />
                <span className="text-gray-400">휴식</span>
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

              const blockColor = block.color || (block.type === "exercise" ? "#f44336" : block.type === "rest" ? "#4caf50" : "#2196f3");

              if (block.type === "exercise") {
                return (
                  <div
                    key={block.id}
                    className="rounded-t-sm transition-all duration-300 shadow-[0_0_8px_rgba(6,224,206,0.5)] z-10"
                    style={{ width: `${safeWidth}%`, height: "60%", backgroundColor: blockColor }}
                  />
                );
              }
              if (block.type === "rest") {
                return (
                  <div
                    key={block.id}
                    className="rounded-t-sm transition-all duration-300 shadow-[0_0_6px_rgba(0,230,118,0.4)] z-10"
                    style={{ width: `${safeWidth}%`, height: "30%", backgroundColor: blockColor }}
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

        {/* 완료 버튼 */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-[56px] bg-[#06e0ce] hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 transition-all rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(6,224,206,0.4)] group"
        >
          <span className="text-[#0d1414] font-bold text-base mr-2">
            {isSaving ? "저장 중..." : "루틴 생성 완료"}
          </span>
          {isSaving ? (
            <Loader2 className="animate-spin text-[#0d1414]" size={20} />
          ) : (
            <CheckCircle className="text-[#0d1414] group-hover:translate-x-1 transition-transform" />
          )}
        </button>
      </div>

      <ExercisePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleExerciseSelect}
      />
    </div>
  );
}
