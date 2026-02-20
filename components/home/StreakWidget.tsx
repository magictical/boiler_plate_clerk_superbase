"use client";

/**
 * @file components/home/StreakWidget.tsx
 * @description Regular User 홈 스트릭 위젯: 불꽃 아이콘 + 연속 운동 일수.
 * @see docs/design-refs/07_home_user.html, docs/TODO.md 3.2 HM-02
 */

import { Flame, ChevronRight } from "lucide-react";

export type StreakWidgetProps = {
  currentStreak: number;
  bestStreak?: number;
};

export function StreakWidget({
  currentStreak,
  bestStreak,
}: StreakWidgetProps) {
  return (
    <section className="px-5">
      <div className="flex items-center justify-between py-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded text-orange-400 bg-orange-500/10">
            <Flame className="w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center h-full">
            <p className="text-white text-sm font-bold tracking-wider leading-none mb-1">
              {currentStreak}일 연속
            </p>
            {bestStreak != null && bestStreak > 0 && (
              <p className="text-gray-500 text-[10px] uppercase tracking-widest leading-none">
                최고 기록: {bestStreak}일
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-600" />
      </div>
    </section>
  );
}
