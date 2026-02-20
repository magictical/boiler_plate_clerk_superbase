"use client";

/**
 * @file components/home/StatsChart.tsx
 * @description Regular User 홈 성과 차트. 기간 필터(1M/3M/All), Recharts 라인·에어리어.
 * @see docs/design-refs/07_home_user.html, docs/TODO.md 3.2 HM-02
 */

import { getTrainingStats } from "@/actions/training-logs";
import type {
  StatsPeriod,
  TrainingStatsPoint,
} from "@/actions/training-logs";
import { TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  "1M": "최근 1개월",
  "3M": "최근 3개월",
  all: "전체",
};

export type StatsChartProps = {
  initialData?: TrainingStatsPoint[];
  initialPeriod?: StatsPeriod;
};

export function StatsChart({
  initialData = [],
  initialPeriod = "1M",
}: StatsChartProps) {
  const [period, setPeriod] = useState<StatsPeriod>(initialPeriod);
  const [data, setData] = useState<TrainingStatsPoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async (p: StatsPeriod) => {
    setLoading(true);
    const { data: next } = await getTrainingStats(p);
    setData(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats(period);
  }, [period, loadStats]);

  const chartData = data.map((d) => ({
    ...d,
    dateShort: d.date.slice(5).replace(/-/g, "/"),
  }));

  const hasData = chartData.length > 0;
  const trendLabel = hasData ? "성장 추이" : "데이터 없음";

  return (
    <section className="px-5">
      <div className="w-full flex flex-col gap-4">
        <div className="flex justify-between items-end px-1">
          <div>
            <p className="text-[#1fe7f9] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
              Growth Trajectory
            </p>
            <h3 className="text-white text-2xl font-bold tracking-tight">
              {loading ? "로딩 중..." : trendLabel}
            </h3>
          </div>
          <div className="flex gap-1">
            {(["1M", "3M", "all"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                disabled={loading}
                className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                  period === p
                    ? "bg-[#1fe7f9]/20 text-[#1fe7f9]"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <div className="relative w-full h-64 rounded-xl border border-white/5 bg-[#162a2d]/40 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
              >
                <defs>
                  <linearGradient
                    id="chartGradientStats"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#1fe7f9"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="100%"
                      stopColor="#1fe7f9"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="dateShort"
                  tick={{ fill: "#6b7280", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#162a2d",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#9ca3af" }}
                  formatter={(value: number) => [value, "부하"]}
                  labelFormatter={(label) => `날짜: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="maxLoad"
                  stroke="#1fe7f9"
                  strokeWidth={2.5}
                  fill="url(#chartGradientStats)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <TrendingUp className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm">훈련 기록이 없습니다</p>
              <p className="text-xs mt-1">
                루틴을 실행하고 기록을 쌓아보세요
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
