"use client";

/**
 * @file components/home/StatsChart.tsx
 * @description Regular User 홈 성과 차트. 루틴 선택 + 기간 필터(1M/3M/All), Recharts 라인·에어리어.
 */

import { setFavoriteRoutine } from "@/actions/routines";
import type {
    TrainingStatsPoint
} from "@/actions/training-logs";
import { getTrainingStats } from "@/actions/training-logs";
import { ChevronDown, Star, TrendingUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";
import { toast } from "sonner";

export type RoutineOption = {
  id: string;
  title: string;
};

export type StatsChartProps = {
  initialData?: TrainingStatsPoint[];
  /** 최근 수행 루틴 목록 (첫 번째 = 가장 최근 수행) */
  routines?: RoutineOption[];
  /** 사용자의 현재 즐겨찾기 루틴 ID */
  favoriteId?: string | null;
};

export function StatsChart({
  initialData = [],
  routines = [],
  favoriteId = null,
}: StatsChartProps) {
  const [data, setData] = useState<TrainingStatsPoint[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(
    favoriteId || routines[0]?.id || ""
  );
  const [currentFavoriteId, setCurrentFavoriteId] = useState<string | null>(favoriteId);
  const [togglingFav, setTogglingFav] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 드래그 스크롤을 위한 상태
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const loadStats = useCallback(async (routineId: string) => {
    setLoading(true);
    const { data: next } = await getTrainingStats("all", routineId);
    setData(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats(selectedRoutineId);
  }, [selectedRoutineId, loadStats]);

  // 외부에서 favoriteId가 바뀌었을 때 동기화
  useEffect(() => {
    setCurrentFavoriteId(favoriteId);
  }, [favoriteId]);

  const handleFavoriteToggle = async (e: React.MouseEvent, routineId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (togglingFav) return;

    setTogglingFav(true);
    const newFavoriteId = currentFavoriteId === routineId ? null : routineId;
    setCurrentFavoriteId(newFavoriteId);

    setIsDropdownOpen(false);
    if (newFavoriteId) {
      setSelectedRoutineId(newFavoriteId);
    }

    try {
      const { error } = await setFavoriteRoutine(newFavoriteId);
      if (error) {
        setCurrentFavoriteId(currentFavoriteId);
        toast.error("즐겨찾기 설정에 실패했습니다.");
      }
    } catch {
      setCurrentFavoriteId(currentFavoriteId);
      toast.error("즐겨찾기 설정 중 오류가 발생했습니다.");
    } finally {
      setTogglingFav(false);
    }
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const chartData = data.map((d) => {
    const cleanDate = d.date.replace(/\./g, '-').replace(/\s/g, '').replace(/-+$/, '');
    const dObj = new Date(cleanDate);
    const m = dObj.getMonth() + 1;
    const day = dObj.getDate();
    return {
      ...d,
      dateShort: !isNaN(m) && !isNaN(day) ? `${m}.${day}` : d.date,
    };
  });

  // 데이터가 로드될 때 오른쪽 끝으로 자동 스크롤
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      setTimeout(() => {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      }, 50);
    }
  }, [chartData.length]);

  const hasData = chartData.length > 0;
  const chartMinWidth = Math.max(100, (chartData.length / 15) * 100);
  const trendLabel = hasData ? "성장 추이" : "데이터 없음";

  // 현재 선택된 루틴의 이름
  const selectedRoutineName =
    routines.find((r) => r.id === selectedRoutineId)?.title ?? "루틴 선택";

  // 드래그 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDragging.current = true;
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeft.current = scrollContainerRef.current.scrollLeft;
    scrollContainerRef.current.style.cursor = "grabbing";
    scrollContainerRef.current.style.scrollBehavior = "auto";
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
      scrollContainerRef.current.style.scrollBehavior = "smooth";
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
      scrollContainerRef.current.style.scrollBehavior = "smooth";
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

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
        </div>

        {/* 루틴 선택 드롭다운 */}
        {routines.length > 0 && (
          <div ref={dropdownRef} className="relative px-1">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 bg-[#162629] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:border-[#1fe7f9]/30 transition-all"
            >
              <span className="truncate max-w-[180px]">{selectedRoutineName}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {isDropdownOpen && (
              <div className="absolute top-full left-1 mt-1 z-50 bg-[#0d1a1d] border border-white/10 rounded-xl shadow-xl overflow-hidden min-w-[200px] max-w-[280px] max-h-[240px] overflow-y-auto">
                {routines.map((r) => {
                  const isFav = currentFavoriteId === r.id;
                  const isSelected = selectedRoutineId === r.id;
                  return (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between w-full px-2 py-1.5 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#1fe7f9]/10"
                          : "hover:bg-white/5"
                      }`}
                      onClick={() => {
                        setSelectedRoutineId(r.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => handleFavoriteToggle(e, r.id)}
                        className={`p-1.5 rounded-md shrink-0 transition-colors ${
                          isFav
                            ? "text-amber-400"
                            : "text-gray-500 hover:text-amber-400/70"
                        }`}
                        title={isFav ? "즐겨찾기 해제" : "즐겨찾기 지정"}
                      >
                        <Star size={14} className={isFav ? "fill-amber-400" : ""} />
                      </button>
                      <span className={`text-xs ml-1.5 flex-1 truncate text-left ${
                        isSelected ? "text-[#1fe7f9] font-bold" : (isFav ? "text-amber-400/90" : "text-gray-400 hover:text-white")
                      }`}>
                        {r.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="relative w-full h-64 rounded-xl border border-white/5 bg-[#162a2d]/40 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing"
          style={{ scrollBehavior: "smooth" }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {hasData ? (
            <div style={{ width: `${chartMinWidth}%`, minWidth: "100%", height: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                data={chartData}
                margin={{ top: 8, right: 36, left: 8, bottom: 36 }}
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
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  dx={-5}
                  dy={5}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip
                  offset={0}
                  cursor={{ stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 }}
                  content={({ active, payload, label, coordinate }) => {
                    if (active && payload && payload.length) {
                      // 스크롤 뷰포트 기준 반전
                      const sc = scrollContainerRef.current;
                      const visibleX = coordinate ? coordinate.x - (sc?.scrollLeft ?? 0) : 0;
                      const viewportW = sc?.clientWidth ?? 300;
                      const isNearRight = visibleX > viewportW * 0.55;

                      return (
                        <div
                          style={{
                            backgroundColor: "#162a2d",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            maxWidth: "140px",
                            fontSize: "12px",
                            transform: isNearRight ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
                          }}
                        >
                          <div style={{ color: "#9ca3af", marginBottom: "6px", fontSize: "11px" }}>{`날짜: ${label}`}</div>
                          <div style={{ color: "#1fe7f9", fontWeight: "bold" }}>
                            {`부하: ${Math.round(payload[0].value as number)}`}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
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
            </div>
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
