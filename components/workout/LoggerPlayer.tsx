"use client";

import { cn } from "@/lib/utils";
import { WorkoutSegment } from "@/lib/utils/flattenRoutine";
import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface LoggerPlayerProps {
  segments: WorkoutSegment[];
  routineId: string;
  userWeight: number;
}

export type LoggerStatus = "success" | "half" | "fail" | null;

export function LoggerPlayer({ segments, routineId, userWeight }: LoggerPlayerProps) {
  const router = useRouter();

  // 로거 모드에서는 운동(exercise) 세그먼트만 집중적으로 보여줍니다.
  const exerciseSegments = segments.filter((s) => s.type === "exercise");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, LoggerStatus>>({});
  const [showAbortModal, setShowAbortModal] = useState(false);
  const startedAtRef = useRef<string>(new Date().toISOString());

  const isFinished = currentIndex >= exerciseSegments.length;

  useEffect(() => {
    if (isFinished) {
      toast.success("훈련을 모두 완료하셨습니다! 로그가 저장됩니다.");
      const resultsJsonStr = JSON.stringify(results);
      router.replace(
        `/workout/${routineId}/end?status=completed&start=${encodeURIComponent(startedAtRef.current)}&results=${encodeURIComponent(resultsJsonStr)}`
      );
    }
  }, [isFinished, router, routineId, results]);

  if (isFinished) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <div className="animate-bounce mb-4 text-6xl">📝</div>
        <h2 className="text-2xl font-bold text-white mb-2">기록 저장 중...</h2>
        <p className="text-gray-400">결과 화면으로 이동합니다.</p>
      </div>
    );
  }

  const currentSegment = exerciseSegments[currentIndex];

  const handleLog = (status: "success" | "half" | "fail") => {
    setResults((prev) => ({
      ...prev,
      [currentSegment.id]: status,
    }));

    // 자동 다음 세트 진행
    setCurrentIndex((prev) => prev + 1);
  };

  const handleAbort = () => {
    setShowAbortModal(false);
    const resultsJsonStr = JSON.stringify(results);
    router.replace(
      `/workout/${routineId}/end?status=aborted&start=${encodeURIComponent(startedAtRef.current)}&results=${encodeURIComponent(resultsJsonStr)}`
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1414]">
      {/* 헤더 및 진행 프로그레스 바 */}
      <header className="flex flex-col px-6 py-4 gap-3 border-b border-white/5 bg-[#0d1414]/95 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">수동 기록 (로거 모드)</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Step {currentIndex + 1} / {exerciseSegments.length}
            </span>
            <button
              onClick={() => setShowAbortModal(true)}
              className="p-2 -mr-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* 세그먼트 단위 진행 바 */}
        <div className="flex items-center gap-1 w-full h-1.5 mt-1">
          {exerciseSegments.map((seg, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isFuture = idx > currentIndex;

            const baseColor = seg.color || "#f44336";

            return (
              <div
                key={`${seg.id}_progress_${idx}`}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "opacity-100 scale-y-[1.5] shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    : isPassed
                    ? "opacity-50"
                    : "bg-white/10"
                }`}
                style={{
                  backgroundColor: isFuture ? undefined : baseColor,
                }}
              />
            );
          })}
        </div>
      </header>

      {/* 세트 리스트 */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
        {exerciseSegments.map((segment, index) => {
          const isCurrent = index === currentIndex;
          const isPassed = index < currentIndex;
          const status = results[segment.id];

          return (
            <div
              key={`${segment.id}_${index}`}
              className={cn(
                "p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between",
                isCurrent ? "bg-[#162629] border-[#06e0ce]/50 shadow-[0_0_15px_rgba(6,224,206,0.15)] scale-[1.02]" :
                isPassed ? "bg-white/5 border-transparent opacity-60" : "bg-[#162629]/50 border-white/5 opacity-80"
              )}
            >
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    isCurrent ? "bg-[#06e0ce]/20 text-[#06e0ce]" : "bg-white/10 text-gray-400"
                  )}>
                    Set {index + 1}
                  </span>
                </div>
                <h3 className={cn(
                  "font-bold text-lg",
                  isCurrent ? "text-white" : "text-gray-300"
                )} style={{ color: isCurrent && segment.color ? segment.color : undefined }}>
                  {segment.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {segment.reps && (
                    <span className="text-sm text-gray-400 font-medium bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
                      {segment.reps}회
                    </span>
                  )}
                  {segment.edgeSize && (
                    <span className="text-sm text-gray-400 font-medium bg-black/20 px-2 py-0.5 rounded-md border border-white/5">
                      {segment.edgeSize}mm
                    </span>
                  )}
                  {segment.weight !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-[#06e0ce] bg-[#06e0ce]/10 px-2 py-0.5 rounded-md border border-[#06e0ce]/20">
                        {segment.weight > 0 ? `+${segment.weight}` : segment.weight}kg
                      </span>
                      {userWeight > 0 && (
                        <span className="text-xs font-bold text-[#06e0ce]/80 px-1.5 py-0.5 rounded-md border border-[#06e0ce]/30 bg-black/20">
                          {Math.round(((userWeight + segment.weight) / userWeight) * 100)}% BW
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-center">
                {status === "success" && <CheckCircle2 className="text-green-500" size={28} />}
                {status === "half" && <AlertTriangle className="text-yellow-500" size={28} />}
                {status === "fail" && <XCircle className="text-red-500" size={28} />}
              </div>
            </div>
          );
        })}
        {/* 하단 패딩 확보 */}
        <div className="h-32" />
      </main>

      {/* 상태 버튼 고정 패널 */}
      <div className="fixed bottom-0 w-full max-w-[430px] left-1/2 -translate-x-1/2 p-4 bg-gradient-to-t from-[#0d1414] via-[#0d1414]/90 to-transparent pb-8">
        <div className="bg-[#162629] border border-white/10 p-2 rounded-3xl flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <button
            onClick={() => handleLog("success")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-[#1d2d30] border-2 border-transparent hover:border-green-500/50 hover:bg-green-500/10 transition-all font-bold text-white group"
          >
            <CheckCircle2 size={28} className="text-green-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm">성공</span>
          </button>

          <button
           onClick={() => handleLog("half")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-[#1d2d30] border-2 border-transparent hover:border-yellow-500/50 hover:bg-yellow-500/10 transition-all font-bold text-white group"
          >
            <AlertTriangle size={28} className="text-yellow-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm">절반</span>
          </button>

          <button
             onClick={() => handleLog("fail")}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-[#1d2d30] border-2 border-transparent hover:border-red-500/50 hover:bg-red-500/10 transition-all font-bold text-white group"
          >
            <XCircle size={28} className="text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-sm">실패</span>
          </button>
        </div>
      </div>

      {/* 중단 모달 동일 */}
      {showAbortModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#162629] p-6 rounded-3xl max-w-sm w-full border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">훈련 기록을 중단할까요?</h3>
            <p className="text-gray-400 mb-6 text-sm leading-tight">
              지금까지 입력한 기록만 부분 저장됩니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowAbortModal(false)}
                className="bg-[#1d2d30] hover:bg-[#25393d] p-4 rounded-xl font-bold transition-colors text-white"
              >
                계속 하기
              </button>
              <button
                onClick={handleAbort}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 p-4 rounded-xl font-bold transition-colors"
              >
                훈련 중단
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
