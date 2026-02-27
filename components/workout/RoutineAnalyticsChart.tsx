"use client";

import { getRoutineAnalytics, RoutineAnalyticsPoint } from "@/actions/training-logs";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TabType = "weight" | "rpe" | "volume";

/**
 * 실제 최대값을 기준으로 Y축 상단 여유값을 계산합니다.
 * - 5의 배수로 올림하여 깔끔한 눈금 보장
 * - 최솟값(fallback)보다 작아지지 않도록 처리
 */
function calcYMax(maxVal: number, fallback: number): number {
  if (maxVal <= 0) return fallback;
  // 최대값의 약 15% 여유 + 5의 배수 올림
  const withMargin = maxVal * 1.15;
  const step = maxVal < 20 ? 2 : maxVal < 100 ? 5 : 10;
  return Math.ceil(withMargin / step) * step;
}

export function RoutineAnalyticsChart({ routineId }: { routineId: string }) {
  const [data, setData] = useState<RoutineAnalyticsPoint[]>([]);
  const [userWeight, setUserWeight] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("weight");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 드래그 스크롤을 위한 상태
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    async function loadData() {
      const result = await getRoutineAnalytics(routineId);
      setData(result.data || []);
      setUserWeight(result.userWeight ?? 0);
      setLoading(false);
    }
    loadData();
  }, [routineId]);

  // 데이터 로드 또는 탭 변경 시 오른쪽 끝으로 스크롤 이동
  useEffect(() => {
    if (scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      setTimeout(() => {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      }, 50);
    }
  }, [data.length, activeTab]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48 py-8 w-full border border-white/5 bg-[#162629]/30 rounded-3xl mt-6">
        <Loader2 className="animate-spin text-[#06e0ce]" size={32} />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 py-8 w-full text-gray-500 text-sm font-bold border border-white/5 bg-[#162629]/30 rounded-3xl mt-6">
        <p>기록된 훈련 기반 성장이 여기에 그려집니다</p>
      </div>
    );
  }

  // 실제 데이터 최댓값 기반 Y축 상단 계산
  const rawMaxWeight = Math.max(...data.map(d => d.maxLoad), 0);
  const rawMaxVolume = Math.max(...data.map(d => d.volume), 0);
  const yMaxWeight = calcYMax(rawMaxWeight, 10);
  const yMaxVolume = calcYMax(rawMaxVolume, 100);

  const chartData = data.map((d) => {
    // d.date가 "2025. 2. 21." 또는 "2025-02-21" 형태일 수 있으므로 포맷 정제
    const cleanDate = d.date.replace(/\./g, '-').replace(/\s/g, '').replace(/-+$/, '');
    const dObj = new Date(cleanDate);
    const m = dObj.getMonth() + 1;
    const day = dObj.getDate();
    return {
      ...d,
      dateShort: !isNaN(m) && !isNaN(day) ? `${m}.${day}` : d.date,
    };
  });

  // 데이터 길이에 비례하여 최소 너비 계산 (정확히 한 화면(100%)에 15개 세션이 배치되도록 % 설정)
  const chartMinWidth = Math.max(100, (chartData.length / 15) * 100);

  const yAxisDomain = activeTab === "weight" ? [0, yMaxWeight] : activeTab === "rpe" ? [1, 10] : [0, yMaxVolume];
  const yAxisFormatter = (v: number) =>
    activeTab === "weight" ? `${v}kg` : activeTab === "volume" ? `${Math.round(v)}` : `${v}`;

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
      scrollContainerRef.current.style.cursor = "auto";
      scrollContainerRef.current.style.scrollBehavior = "smooth";
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "auto";
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

  // 차트 렌더링
  const renderChart = () => {
    switch (activeTab) {
      case "weight":
        return (
          <div style={{ width: `${chartMinWidth}%`, minWidth: "100%", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 36, left: 0, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3636" vertical={false} />
              <XAxis dataKey="dateShort" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} dy={5} dx={-5} interval={0} angle={-45} textAnchor="end" />
              <YAxis hide domain={[0, yMaxWeight]} />
              <Tooltip
                offset={0}
                cursor={{ stroke: '#ffffff55', strokeWidth: 1 }}
                content={({ active, payload, label, coordinate }) => {
                  if (active && payload && payload.length) {
                    const point = payload[0].payload as RoutineAnalyticsPoint;
                    const added = point?.maxAddedWeight ?? 0;
                    const bwPct = userWeight > 0 ? Math.round(((userWeight + added) / userWeight) * 100) : 0;
                    const addedStr = added >= 0 ? `+${added}kg` : `${added}kg`;
                    const currentLoad = Math.round(payload[0].value as number);

                    // 스크롤 뷰포트 기준으로 우측 가장자리 근처인지 판단
                    const sc = scrollContainerRef.current;
                    const visibleX = coordinate ? coordinate.x - (sc?.scrollLeft ?? 0) : 0;
                    const viewportW = sc?.clientWidth ?? 300;
                    const isNearRight = visibleX > viewportW * 0.55;

                    return (
                      <div
                        style={{
                          backgroundColor: "#162629",
                          border: "1px solid #2a3636",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          maxWidth: "140px",
                          fontWeight: "bold",
                          fontSize: "12px",
                          transform: isNearRight ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
                        }}
                      >
                        <div style={{ marginBottom: "6px", color: "white", fontSize: "11px" }}>{`날짜: ${label}`}</div>
                        <div style={{ color: "#06e0ce", lineHeight: "1.4" }}>
                          최대 중량: {currentLoad}kg
                          <div style={{ color: "#6b7280", fontSize: "11px", fontWeight: "normal", marginTop: "2px" }}>
                            {`(${addedStr} / ${bwPct}% BW)`}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="maxLoad" stroke="#06e0ce" strokeWidth={3} dot={{ r: 4, fill: "#0d1414", strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case "rpe":
        return (
          <div style={{ width: `${chartMinWidth}%`, minWidth: "100%", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 36, left: 0, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3636" vertical={false} />
              <XAxis dataKey="dateShort" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} dy={5} dx={-5} interval={0} angle={-45} textAnchor="end" />
              <YAxis hide domain={[1, 10]} />
              <Tooltip
                offset={0}
                cursor={{ stroke: '#ffffff55', strokeWidth: 1 }}
                content={({ active, payload, label, coordinate }) => {
                  if (active && payload && payload.length) {
                    const sc = scrollContainerRef.current;
                    const visibleX = coordinate ? coordinate.x - (sc?.scrollLeft ?? 0) : 0;
                    const viewportW = sc?.clientWidth ?? 300;
                    const isNearRight = visibleX > viewportW * 0.55;

                    return (
                      <div
                        style={{
                          backgroundColor: "#162629",
                          border: "1px solid #2a3636",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          maxWidth: "140px",
                          fontWeight: "bold",
                          fontSize: "12px",
                          transform: isNearRight ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
                        }}
                      >
                        <div style={{ marginBottom: "6px", color: "white", fontSize: "11px" }}>{`날짜: ${label}`}</div>
                        <div style={{ color: "#f59e0b" }}>자각도(RPE): {payload[0].value as number}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line type="monotone" dataKey="rpe" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: "#0d1414", strokeWidth: 2 }} activeDot={{ r: 6 }} connectNulls />
            </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case "volume":
        return (
          <div style={{ width: `${chartMinWidth}%`, minWidth: "100%", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 36, left: 0, bottom: 36 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3636" vertical={false} />
              <XAxis dataKey="dateShort" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} dy={5} dx={-5} interval={0} angle={-45} textAnchor="end" />
              <YAxis hide domain={[0, yMaxVolume]} />
                <Tooltip
                offset={0}
                cursor={{ fill: '#ffffff05' }}
                content={({ active, payload, label, coordinate }) => {
                  if (active && payload && payload.length) {
                    const sc = scrollContainerRef.current;
                    const visibleX = coordinate ? coordinate.x - (sc?.scrollLeft ?? 0) : 0;
                    const viewportW = sc?.clientWidth ?? 300;
                    const isNearRight = visibleX > viewportW * 0.55;

                    return (
                      <div
                        style={{
                          backgroundColor: "#162629",
                          border: "1px solid #2a3636",
                          borderRadius: "8px",
                          padding: "8px 12px",
                          maxWidth: "140px",
                          fontWeight: "bold",
                          fontSize: "12px",
                          transform: isNearRight ? "translateX(calc(-100% - 12px))" : "translateX(12px)",
                        }}
                      >
                        <div style={{ marginBottom: "6px", color: "white", fontSize: "11px" }}>{`날짜: ${label}`}</div>
                        <div style={{ color: "#a855f7" }}>총 볼륨: {Math.round(payload[0].value as number)} kg·rep</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="volume" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
            </ResponsiveContainer>
          </div>
        );
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 mt-8 pb-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xl font-bold text-white tracking-tight">성장 지표</h3>
      </div>

      {/* 탭 버튼 */}
      <div className="flex bg-[#162629] p-1.5 rounded-2xl border border-white/5">
        <button
          onClick={() => setActiveTab("weight")}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all ${activeTab === "weight" ? "bg-[#2a3636] text-white shadow-sm" : "text-gray-400 hover:text-gray-300"}`}
        >
          최대 중량
        </button>
        <button
          onClick={() => setActiveTab("rpe")}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all ${activeTab === "rpe" ? "bg-[#2a3636] text-white shadow-sm" : "text-gray-400 hover:text-gray-300"}`}
        >
          RPE
        </button>
        <button
          onClick={() => setActiveTab("volume")}
          className={`flex-1 text-sm font-bold py-2.5 rounded-xl transition-all ${activeTab === "volume" ? "bg-[#2a3636] text-white shadow-sm" : "text-gray-400 hover:text-gray-300"}`}
        >
          총 볼륨
        </button>
      </div>

      {/* 차트 영역 (좌측 고정 Y축 + 우측 가로 스크롤 차트) */}
      <div className="relative h-56 mt-2 w-full flex">
        {/* 고정 Y축 (좌측) */}
        <div className="w-[45px] flex-shrink-0 z-10 bg-transparent">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[]} margin={{ top: 10, right: 0, left: -16, bottom: 36 }}>
              <YAxis
                domain={yAxisDomain}
                tickFormatter={yAxisFormatter}
                stroke="#6b7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                type="number"
                width={45}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 스크롤 영역 */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing relative"
          style={{ scrollBehavior: "smooth" }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          {renderChart()}
        </div>
      </div>
    </div>
  );
}
