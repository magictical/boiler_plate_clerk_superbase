"use client";

import { useWorkoutTimer } from "@/hooks/useWorkoutTimer";
import { WorkoutSegment } from "@/lib/utils/flattenRoutine";
import { formatDuration } from "@/lib/utils/routine-calc";
import { Pause, Play, SkipForward, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface TimerPlayerProps {
  segments: WorkoutSegment[];
  routineId: string;
}

export function TimerPlayer({ segments, routineId }: TimerPlayerProps) {
  const router = useRouter();
  const {
    isPlaying,
    isFinished,
    timeLeft,
    progress,
    currentSegment,
    currentSegmentIndex,
    totalSegments,
    pauseWorkout,
    playWorkout,
    skipRest,
  } = useWorkoutTimer(segments);

  const [showAbortModal, setShowAbortModal] = useState(false);
  const startedAtRef = useRef<string>(new Date().toISOString());

  // 세션 종료 결과 모달로 바로 가거나 메인으로 튕기기
  useEffect(() => {
    if (isFinished) {
      toast.success("훈련을 모두 완료하셨습니다! 🎉");

      // 타이머 모드: 모든 exercise 세그먼트를 "success"로 기록
      const completeResults: Record<string, string> = {};
      segments
        .filter(s => s.type === "exercise")
        .forEach(s => {
          completeResults[s.id] = "success";
        });

      const resultsJsonStr = JSON.stringify(completeResults);
      router.replace(
        `/workout/${routineId}/end?status=completed&start=${encodeURIComponent(startedAtRef.current)}&results=${encodeURIComponent(resultsJsonStr)}`
      );
    }
  }, [isFinished, router, routineId, segments]);

  if (isFinished) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <div className="animate-bounce mb-4 text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">훈련 코어 시스템 완료!</h2>
        <p className="text-gray-400">결과 화면으로 이동합니다...</p>
      </div>
    );
  }

  if (!currentSegment) return null;

  // 색상 등 시각 스타일
  let ringColor = "#06e0ce"; // ready
  if (currentSegment.type === "exercise") ringColor = currentSegment.color || "#f44336";
  if (currentSegment.type === "rest") ringColor = "#4caf50";

  // 다음 세그먼트 찾기
  const nextSegments = segments.slice(currentSegmentIndex + 1);

  const handleAbort = () => {
    // /workout/[routineId]/end 로 이동 (status=aborted)
    setShowAbortModal(false);
    router.replace(
      `/workout/${routineId}/end?status=aborted&start=${encodeURIComponent(startedAtRef.current)}`
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 상단: 상태 안내 및 전체 타임라인 프로그레스 */}
      <div className="flex flex-col px-6 py-4 gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
            Step {currentSegmentIndex + 1} / {totalSegments}
          </span>
          <button
            onClick={() => setShowAbortModal(true)}
            className="p-2 -mr-2 text-gray-500 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* 세그먼트 단위 진행 바 */}
        <div className="flex items-center gap-1 w-full h-1.5">
          {segments.map((seg, idx) => {
            const isPassed = idx < currentSegmentIndex;
            const isCurrent = idx === currentSegmentIndex;
            const isFuture = idx > currentSegmentIndex;

            // 색상 할당
            let baseColor = seg.color;
            if (!baseColor) {
              if (seg.type === "exercise") baseColor = "#f44336";
              else if (seg.type === "rest") baseColor = "#4caf50";
              else baseColor = "#06e0ce"; // ready
            }

            return (
              <div
                key={`${seg.id}_${idx}`}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? "opacity-100 scale-y-[1.5] shadow-[0_0_8px_rgba(255,255,255,0.4)]"
                    : isPassed
                    ? "opacity-40"
                    : "bg-white/10"
                }`}
                style={{
                  backgroundColor: isFuture ? undefined : baseColor,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* 중앙: 타이머 & 프로그레스 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h3 className="text-3xl font-bold mb-8 text-center" style={{ color: ringColor }}>
          {currentSegment.title}
        </h3>

        {/* Circular Progress (단순화: svg circle) */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-8">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle
              cx="144" cy="144" r="130"
              stroke="white" strokeOpacity="0.1" strokeWidth="8" fill="none"
            />
            <circle
              cx="144" cy="144" r="130"
              stroke={ringColor}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="816" // 2 * PI * 130 ≒ 816.8
              strokeDashoffset={816 - (816 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="text-center">
            {currentSegment.type === "ready" ? (
              <div className="text-7xl font-display font-bold text-white">
                {timeLeft}
              </div>
            ) : (
              <div className="text-6xl font-display font-bold text-white tracking-widest tabular-nums">
                {formatDuration(timeLeft)}
              </div>
            )}
          </div>
        </div>

        {/* Sub Info (현재 타겟 정보 등) */}
        <div className="h-10 flex flex-col items-center justify-center">
          {currentSegment.type === "exercise" && currentSegment.reps ? (
            <p className="text-white font-bold text-xl">
              {currentSegment.reps}회 반복
            </p>
          ) : (
            <p className="text-gray-500 text-sm">진행 중...</p>
          )}
        </div>
      </div>

      {/* 다음 훈련 블록 미니 프리뷰 */}
      {nextSegments.length > 0 && (
        <div className="mx-6 mb-6 p-4 rounded-2xl bg-[#162a2d] border border-white/5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 text-left">
              다음 예정
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: nextSegments[0].color || (nextSegments[0].type === 'exercise' ? '#f44336' : '#4caf50') }} />
              <span className="font-bold text-white tracking-tight">
                {nextSegments[0].type === "rest" ? `휴식 (${nextSegments[0].duration}초)` : nextSegments[0].title}
              </span>
            </div>
          </div>
          {nextSegments[0].type === "exercise" && nextSegments[0].reps && (
            <span className="text-sm font-bold text-gray-300">
              {nextSegments[0].reps}회
            </span>
          )}
        </div>
      )}

      {/* 하단 컨트롤러 */}
      <div className="px-6 pb-12 pt-4 flex gap-4">
        {isPlaying ? (
          <button
            onClick={pauseWorkout}
            className="flex-1 h-16 bg-[#162629] border border-white/10 hover:bg-[#1d2d30] rounded-2xl flex items-center justify-center gap-3 transition-colors text-white font-bold"
          >
            <Pause size={24} fill="currentColor" />
            <span className="text-lg text-white">일시정지</span>
          </button>
        ) : (
          <button
            onClick={playWorkout}
            className="flex-1 h-16 bg-[#06e0ce] rounded-2xl flex items-center justify-center gap-3 transition-colors text-[#0d1414] font-bold shadow-[0_0_20px_rgba(6,224,206,0.3)] hover:scale-[1.02] active:scale-95"
          >
            <Play size={24} fill="currentColor" />
            <span className="text-lg">계속 진행</span>
          </button>
        )}

        {currentSegment.type === "rest" && (
          <button
            onClick={skipRest}
            className="w-16 h-16 bg-[#162629] border border-white/10 hover:bg-[#1d2d30] rounded-2xl flex items-center justify-center text-gray-300 transition-colors"
          >
            <SkipForward size={24} />
          </button>
        )}
      </div>

      {/* 중단 확인 모달 */}
      {showAbortModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#162629] p-6 rounded-3xl max-w-sm w-full border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">훈련을 중단하시겠습니까?</h3>
            <p className="text-gray-400 mb-6 text-sm leading-tight">
              지금까지의 진행 상황은 Aborted 상태로 로그에 기록됩니다.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowAbortModal(false)}
                className="bg-[#1d2d30] hover:bg-[#25393d] p-4 rounded-xl font-bold transition-colors"
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
