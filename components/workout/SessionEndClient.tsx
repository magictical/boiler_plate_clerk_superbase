"use client";

import { RoutineResult } from "@/actions/routines";
import { createTrainingLog } from "@/actions/training-logs";
import { Dumbbell, Save, XOctagon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface SessionEndClientProps {
  routine: RoutineResult;
}

const RPE_DESCRIPTIONS: Record<number, string> = {
  1: "매우 가벼움 - 힘들지 않은 활동",
  2: "가벼움 - 숨쉬기 편하고 대화 가능",
  3: "보통 - 약간 숨이 차지만 대화 가능",
  4: "약간 힘듦 - 숨이 차기 시작함",
  5: "힘듦 - 땀이 나기 시작함",
  6: "제법 힘듦 - 대화하기 다소 어려움",
  7: "많이 힘듦 - 문장 단위 대화 불가",
  8: "매우 힘듦 - 한두 단어만 말할 수 있음",
  9: "거의 한계 - 극도의 피로감",
  10: "최대 노력 - 한 번도 더 못 함",
};

const ABORT_REASONS = [
  "부상 위험 감지 / 통증",
  "스킨(피부) 까짐",
  "펌핑/컨디션 난조",
  "시간 부족",
  "단순 변심 / 잘못 누름",
];

export function SessionEndClient({ routine }: SessionEndClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const status = (searchParams.get("status") as "completed" | "aborted") || "completed";
  const startParam = searchParams.get("start") || new Date().toISOString();
  const resultsParam = searchParams.get("results") || "{}";

  const [rpe, setRpe] = useState<number>(5);
  const [abortReason, setAbortReason] = useState<string>(ABORT_REASONS[0]);
  const [isSaving, setIsSaving] = useState(false);

  const isCompleted = status === "completed";

  const handleSave = async () => {
    setIsSaving(true);
    let setResults = {};
    try {
      setResults = JSON.parse(resultsParam);
    } catch (e) {
      // ignore JSON parse error
    }

    const { error } = await createTrainingLog({
      routine_id: routine.id,
      status: status,
      rpe: isCompleted ? rpe : undefined,
      abort_reason: !isCompleted ? abortReason : undefined,
      set_results_json: setResults,
      started_at: startParam,
      ended_at: new Date().toISOString()
    });

    setIsSaving(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("훈련 로그가 성공적으로 저장되었습니다!");
    router.push("/");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto px-6 py-8 pb-24 bg-[#0d1414]">
      {/* 타이틀 및 아이콘 */}
      <div className="flex flex-col items-center justify-center pt-4 pb-8 border-b border-white/5">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-xl ${isCompleted ? "bg-[#06e0ce]/10 text-[#06e0ce]" : "bg-red-500/10 text-red-500"}`}>
          {isCompleted ? <Dumbbell size={40} /> : <XOctagon size={40} />}
        </div>
        <h1 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">
          {isCompleted ? "세션 클리어!" : "세션 중단됨"}
        </h1>
        <p className="text-gray-400 text-sm">
          {routine.title} 기록을 저장합니다.
        </p>
      </div>

      <div className="mt-8 flex-1 flex flex-col gap-8">
        {isCompleted ? (
          // RPE 슬라이더 영역 (완료 시)
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">운동 자각도 (RPE)</h2>
            <p className="text-sm text-gray-400 mb-6">이번 훈련이 전반적으로 얼마나 힘들었나요?</p>

            <div className="flex flex-col gap-5 items-center bg-[#162629] p-6 rounded-2xl border border-white/5">
              <span className="text-6xl font-display font-bold text-[#06e0ce]">
                {rpe}
              </span>
              <span className="text-sm font-bold text-gray-300 h-6 text-center">
                {RPE_DESCRIPTIONS[rpe]}
              </span>
              <input
                type="range"
                min={1}
                max={10}
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full accent-[#06e0ce] h-2 bg-black/30 rounded-lg appearance-none cursor-pointer mt-2"
              />
              <div className="w-full flex justify-between px-1 text-xs text-gray-500 font-bold mt-1">
                <span>Easy (1)</span>
                <span>Max (10)</span>
              </div>
            </div>
          </div>
        ) : (
          // 중단 사유 선택 영역 (중단 시)
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-white mb-4">중단 사유 기록</h2>
            <p className="text-sm text-gray-400 mb-6">부상 방지와 올바른 통계를 위해 사유를 남겨주세요.</p>

            <div className="flex flex-col gap-3">
              {ABORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setAbortReason(reason)}
                  className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-300 font-bold border ${abortReason === reason ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-[#162629] border-white/5 text-gray-400 hover:bg-[#1d2d30]"}`}
                >
                  {reason}
                  {abortReason === reason && (
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-6 bg-gradient-to-t from-[#0d1414] via-[#0d1414]/90 to-transparent">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center justify-center gap-2 w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-xl ${isCompleted ? "bg-[#06e0ce] text-[#0d1414] hover:bg-[#25d1f4]" : "bg-red-500 hover:bg-red-600 text-white"} disabled:opacity-50`}
        >
          <Save size={24} />
          {isSaving ? "저장 중..." : "결과 기록하기"}
        </button>
      </div>
    </div>
  );
}
