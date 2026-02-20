"use client";

/**
 * @file components/home/GuestChartSection.tsx
 * @description Guest 홈 차트 영역. 블러 처리된 샘플 막대 차트 + "데이터가 필요합니다" 오버레이.
 * @see docs/design-refs/06_home_guest.html, docs/ui_specs.md HM-01
 */

import { BarChart2 } from "lucide-react";

const SAMPLE_HEIGHTS = [40, 60, 30, 80, 50, 70, 45];
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export function GuestChartSection() {
  return (
    <section className="flex flex-col px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xl font-bold">주간 성장 그래프</h3>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-gray-400 uppercase tracking-wider">
          PREVIEW
        </span>
      </div>
      <div className="relative w-full aspect-[4/3] rounded-xl bg-[#162a2d] border border-white/5 overflow-hidden">
        {/* Overlay Message */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0f2123]/40 backdrop-blur-[2px]">
          <div className="bg-[#162a2d]/90 backdrop-blur-md border border-[#1fe7f9]/10 px-6 py-4 rounded-xl flex flex-col items-center gap-2 shadow-2xl">
            <BarChart2 className="text-[#1fe7f9] w-8 h-8 mb-1" />
            <p className="text-white font-bold text-base">데이터가 필요합니다</p>
            <p className="text-xs text-gray-300 text-center">
              활동 기록이 없습니다.
            </p>
          </div>
        </div>
        {/* Blurred Chart Content (sample) */}
        <div className="absolute inset-0 p-4 opacity-30 blur-sm pointer-events-none select-none">
          <div className="flex flex-col h-full justify-between">
            <div className="flex justify-between items-end h-3/4 gap-2">
              {SAMPLE_HEIGHTS.map((h, i) => (
                <div
                  key={i}
                  className="w-full bg-[#1fe7f9] rounded-t-sm flex-1"
                  style={{
                    height: `${h}%`,
                    backgroundColor:
                      i === 4
                        ? "rgb(31 231 249)"
                        : `rgba(31, 231, 249, ${0.2 + (i % 4) * 0.15})`,
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-2">
              {DAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
