"use client";

/**
 * @file components/home/MetricGrid.tsx
 * @description Regular User 홈 메트릭 카드 4종: Max Grip, Total Reps, Global Rank, Consistency.
 * @see docs/design-refs/07_home_user.html, docs/TODO.md 3.2 HM-02
 */

import type { HomeMetrics } from "@/actions/training-logs";
import {
  Dumbbell,
  Globe,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

export type MetricGridProps = {
  metrics: HomeMetrics;
};

const cardClass =
  "group relative p-4 rounded-lg border border-white/5 bg-[#162a2d]/30 hover:bg-[#162a2d]/50 transition-colors";
const iconClass =
  "text-gray-600 text-[18px] group-hover:text-[#1fe7f9] transition-colors";

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <section className="px-5">
      <div className="grid grid-cols-2 gap-3">
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
              Max Grip
            </p>
            <Dumbbell className={iconClass} />
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-white text-3xl font-bold tracking-tight group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all">
              {metrics.maxHang1rm != null ? metrics.maxHang1rm.toFixed(1) : "—"}
            </p>
            <span className="text-sm font-medium text-gray-500">kg</span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
              Total Reps
            </p>
            <RefreshCw className={iconClass} />
          </div>
          <p className="text-white text-3xl font-bold tracking-tight group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] transition-all">
            {metrics.totalReps > 0
              ? metrics.totalReps.toLocaleString()
              : "—"}
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
              Global Rank
            </p>
            <Globe className={iconClass} />
          </div>
          <p className="text-[#1fe7f9] text-3xl font-bold tracking-tight drop-shadow-[0_0_5px_rgba(31,231,249,0.3)]">
            —
          </p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest">
              Consistency
            </p>
            <ShieldCheck className={iconClass} />
          </div>
          <div className="flex items-end justify-between">
            <p className="text-white text-3xl font-bold tracking-tight">
              {metrics.consistencyPercent > 0
                ? `${metrics.consistencyPercent}%`
                : "—"}
            </p>
            {metrics.consistencyPercent > 0 && (
              <div className="w-12 h-1 bg-white/10 rounded-full mb-2">
                <div
                  className="h-full bg-[#1fe7f9] rounded-full shadow-[0_0_8px_rgba(31,231,249,0.5)]"
                  style={{ width: `${Math.min(100, metrics.consistencyPercent)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
