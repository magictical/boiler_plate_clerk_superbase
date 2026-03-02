"use client";

import { getProfileForSettings } from "@/actions/profiles";
import { createRoutine, RoutineResult } from "@/actions/routines";
import { MissingWeightModal } from "@/components/common/MissingWeightModal";
import { BlockListRoot } from "@/components/routine-builder/editor/BlockList";
import { EditorFooter } from "@/components/routine-builder/editor/EditorFooter";
import { EnergySystemModal } from "@/components/routine-builder/editor/EnergySystemModal";
import { EquipmentTypeModal } from "@/components/routine-builder/editor/EquipmentTypeModal";
import { RoutineEditorProvider, useRoutineEditor } from "@/components/routine-builder/editor/RoutineEditorContext";
import { RoutineLoadPicker } from "@/components/routine-builder/RoutineLoadPicker";
import type { RoutineBlock } from "@/types/routine";
import {
    ArrowLeft,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Loader2, Save
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, dispatch } = useRoutineEditor();
  const [energySystem, setEnergySystem] = useState<string | null>(null);
  const [equipmentType, setEquipmentType] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [initialData, setInitialData] = useState({ title: "", blocks: "[]", energy: null as string | null, equipment: null as string | null });
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isLoadPickerOpen, setIsLoadPickerOpen] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [hasWeightCache, setHasWeightCache] = useState<boolean | null>(null);

  const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(true);

  const editId = searchParams.get("editId");

  const handleRoutineLoad = (routine: RoutineResult) => {
    dispatch({ type: "SET_BLOCKS", payload: { blocks: routine.structure_json } });
    setRoutineName(routine.title);
    setEnergySystem(routine.energy_system || null);
    setEquipmentType(routine.equipment_type || null);
    setIsLoadPickerOpen(false);
    toast.success("루틴을 성공적으로 불러왔습니다.");
  };

  const handleBackClick = () => {
    // 저장 버튼 클릭 중에는 무시
    if (isSaving) return;

    // 초기 상태와 현재 상태 비교 (제목 변경 또는 블록 변경 또는 카테고리 변경)
    const isDirty =
      routineName !== initialData.title ||
      JSON.stringify(state.blocks) !== initialData.blocks ||
      energySystem !== initialData.energy ||
      equipmentType !== initialData.equipment;

    if (isDirty) {
      setShowExitConfirm(true);
    } else {
      router.back();
    }
  };

  const execSaveRoutine = async () => {
    setIsSaving(true);

    if (editId) {
      const { updateRoutine } = await import("@/actions/routines");
      const { error } = await updateRoutine(editId, {
        title: routineName || "나의 루틴",
        estimated_time: state.stats.totalDuration,
        total_sets: state.stats.totalSets,
        structure_json: state.blocks,
        energy_system: energySystem,
        equipment_type: equipmentType,
      });

      setIsSaving(false);

      if (error) {
        toast.error("루틴 수정에 실패했습니다.");
        console.error(error);
        return;
      }

      toast.success("루틴이 성공적으로 수정되었습니다!");
      router.push(`/workout/${editId}`);
    } else {
      const { error } = await createRoutine({
        title: routineName || "나의 루틴",
        estimated_time: state.stats.totalDuration,
        total_sets: state.stats.totalSets,
        structure_json: state.blocks,
        energy_system: energySystem,
        equipment_type: equipmentType,
      });

      setIsSaving(false);

      if (error) {
        toast.error("루틴 저장에 실패했습니다.");
        console.error(error);
        return;
      }

      toast.success("루틴이 성공적으로 저장되었습니다!");
      router.push("/routines");
    }
  };

  const handleSave = async () => {
    if (state.blocks.length === 0) {
      toast.error("루틴에 운동을 하나 이상 추가해주세요.");
      return;
    }

    if (hasWeightCache === null) {
      setIsSaving(true);
      const { data } = await getProfileForSettings();
      setIsSaving(false);

      if (data && data.weight_kg) {
        setHasWeightCache(true);
        execSaveRoutine();
      } else {
        setHasWeightCache(false);
        setShowWeightModal(true);
      }
    } else if (hasWeightCache === false) {
      setShowWeightModal(true);
    } else {
      execSaveRoutine();
    }
  };

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
          setInitialData({
            title: titleRaw || "",
            blocks: JSON.stringify(parsed),
            energy: null,
            equipment: null
          });
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

  // DB에서 기존 루틴 불러오기 (edit 모드)
  useEffect(() => {
    if (editId) {
      async function loadExistingRoutine() {
        try {
          const { getRoutine } = await import("@/actions/routines");
          const { data, error } = await getRoutine(editId);
          if (error) {
            toast.error("루틴 정보를 불러오는 데 실패했습니다.");
            return;
          }
          if (data) {
            dispatch({ type: "SET_BLOCKS", payload: { blocks: data.structure_json } });
            setRoutineName(data.title);
            setEnergySystem(data.energy_system || null);
            setEquipmentType(data.equipment_type || null);
            setInitialData({
              title: data.title,
              blocks: JSON.stringify(data.structure_json),
              energy: data.energy_system || null,
              equipment: data.equipment_type || null
            });
          }
        } catch (err) {
          console.error(err);
        }
      }
      loadExistingRoutine();
    }
  }, [editId, dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0d1414] text-white font-sans antialiased pb-[400px]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0d1414]/95 backdrop-blur-md px-4 py-3 border-b border-white/5 border-b-[#06e0ce]/30">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackClick}
            className="flex items-center justify-center size-10 rounded-full active:bg-white/10 transition-colors"
          >
            <ArrowLeft className="text-gray-300" />
          </button>
          <h2 className="text-lg font-bold tracking-tight text-gray-100">
            {editId ? "커스텀 루틴 수정" : "커스텀 트레이닝 생성"}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsLoadPickerOpen(true)}
              className="bg-[#2a3636] text-xs font-bold px-3 py-1.5 rounded-full hover:bg-[#384545] transition-colors border border-white/10 flex items-center gap-1 text-[#06e0ce] shadow-sm"
            >
              불러오기
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#2a3636] size-8 flex items-center justify-center rounded-full hover:bg-[#384545] transition-colors border border-white/10 text-[#06e0ce] disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto p-4 space-y-6">
        {/* Routine Name Input */}
        <div>
          <input
            className="w-full bg-[#1d2626] border-white/5 border rounded-xl px-4 py-4 text-gray-100 placeholder:text-gray-500 focus:ring-1 focus:ring-[#06e0ce] focus:border-[#06e0ce] transition-all outline-none shadow-sm font-bold text-lg"
            placeholder="나의 루틴"
            type="text"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
          />
        </div>

        {/* Routine Categories */}
        <div className="flex items-stretch gap-2">
          {showCategories && (
            <>
              <button
                type="button"
                onClick={() => setIsEnergyModalOpen(true)}
                className="flex-1 flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-[#1d2626] hover:bg-[#2a3636] transition-all"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs font-bold text-gray-500">훈련 목적</span>
                  <span className={`text-sm font-bold ${energySystem ? 'text-[#06e0ce]' : 'text-gray-300'}`}>
                    {energySystem === "max_strength" && "최대 근력"}
                    {energySystem === "power" && "파워"}
                    {energySystem === "power_endurance" && "파워 지구력"}
                    {energySystem === "endurance" && "지구력 / ARC"}
                    {!energySystem && "선택 안함"}
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-500" />
              </button>

              <button
                type="button"
                onClick={() => setIsEquipmentModalOpen(true)}
                className="flex-1 flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-[#1d2626] hover:bg-[#2a3636] transition-all"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="text-xs font-bold text-gray-500">훈련 기구</span>
                  <span className={`text-sm font-bold ${equipmentType ? 'text-[#06e0ce]' : 'text-gray-300'}`}>
                    {equipmentType === "pullup_bar" && "철봉류"}
                    {equipmentType === "hangboard" && "행보드"}
                    {equipmentType === "no_hang" && "노행 리프트"}
                    {equipmentType === "campus_board" && "캠퍼스 보드"}
                    {equipmentType === "spray_wall" && "스프레이 월"}
                    {equipmentType === "bodyweight" && "맨몸운동"}
                    {equipmentType === "other" && "기타"}
                    {!equipmentType && "선택 안함"}
                  </span>
                </div>
                <ChevronRight size={18} className="text-gray-500" />
              </button>
            </>
          )}

          {/* 우측 토글 버튼 */}
          <button
            type="button"
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center justify-center w-12 rounded-2xl border border-white/5 bg-[#1d2626] hover:bg-[#2a3636] transition-all shrink-0"
          >
            {showCategories ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
        </div>


        {/* Block List */}
        <BlockListRoot />
      </main>

      {/* Footer (Fixed) */}
      <EditorFooter routineName={routineName} editId={editId} />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#162629] p-6 rounded-3xl max-w-sm w-full border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">변경사항 버리기</h3>
            <p className="text-gray-400 mb-6 text-sm leading-tight">저장하지 않은 루틴 내용이 사라집니다. 뒤로 이동하시겠습니까?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="px-5 py-2.5 rounded-xl font-bold hover:bg-white/5 transition-colors text-white">
                취소
              </button>
              <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl font-bold bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors">
                버리고 이동
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modals */}
      <EnergySystemModal
        isOpen={isEnergyModalOpen}
        onClose={() => setIsEnergyModalOpen(false)}
        selected={energySystem}
        onSelect={setEnergySystem}
      />

      <EquipmentTypeModal
        isOpen={isEquipmentModalOpen}
        onClose={() => setIsEquipmentModalOpen(false)}
        selected={equipmentType}
        onSelect={setEquipmentType}
      />

      {/* Routine Load Picker Modal */}
      <RoutineLoadPicker
        isOpen={isLoadPickerOpen}
        onClose={() => setIsLoadPickerOpen(false)}
        onSelect={handleRoutineLoad}
      />

      {/* Missing Weight Modal Guard */}
      <MissingWeightModal
        open={showWeightModal}
        onOpenChange={setShowWeightModal}
        title="루틴을 저장하기 전 체중 입력"
        description="해당 루틴의 정확한 운동 볼륨과 성장을 기록하기 위해 체중 데이터가 필요합니다."
        onSuccess={() => {
          setHasWeightCache(true);
          execSaveRoutine();
        }}
      />
    </div>
  );
}

export default function RoutineEditorPage() {
  return (
    <RoutineEditorProvider>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center bg-[#0d1414] text-white">
            로딩 중...
          </div>
        }
      >
        <EditorContent />
      </Suspense>
    </RoutineEditorProvider>
  );
}
