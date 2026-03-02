"use client";

import {
    ENERGY_SYSTEM_META,
    EQUIPMENT_META,
    EXERCISES,
    EnergySystem,
    Equipment,
    ExerciseDef
} from "@/lib/data/exercises";
import { cn } from "@/lib/utils";
import {
    Activity, ArrowUp, ArrowUpRight, Dumbbell,
    Hand, Lock, Minus, Plus, Repeat, Search, Timer, X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const ICON_MAP: Record<string, React.ReactNode> = {
  "hand": <Hand size={22} />,
  "repeat": <Repeat size={22} />,
  "minus": <Minus size={22} />,
  "timer": <Timer size={22} />,
  "dumbbell": <Dumbbell size={22} />,
  "arrow-up": <ArrowUp size={22} />,
  "lock": <Lock size={22} />,
  "activity": <Activity size={22} />,
  "arrow-up-right": <ArrowUpRight size={22} />
};

const ENERGY_SYSTEMS = Object.entries(ENERGY_SYSTEM_META) as [EnergySystem, typeof ENERGY_SYSTEM_META[EnergySystem]][];

interface ExercisePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: ExerciseDef) => void;
}

export function ExercisePicker({ isOpen, onClose, onSelect }: ExercisePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeEnergy, setActiveEnergy] = useState<EnergySystem>("max_strength");
  const [activeEquipment, setActiveEquipment] = useState<Equipment | "all">("all");
  const [isRendered, setIsRendered] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => setIsAnimating(true));
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      document.body.style.overflow = "";
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 현재 에너지 시스템 탭에 속한 운동들 추출 (equipment 필터 포함)
  const filteredExercises = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchSearch =
        ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchEnergy = searchQuery ? true : ex.energy_system === activeEnergy;
      const matchEquipment = activeEquipment === "all" || ex.equipment === activeEquipment;
      return matchSearch && matchEnergy && matchEquipment;
    });
  }, [searchQuery, activeEnergy, activeEquipment]);

  // 현재 에너지 시스템에서 사용 가능한 equipment 종류
  const availableEquipments = useMemo(() => {
    const inCurrent = EXERCISES.filter(ex => ex.energy_system === activeEnergy);
    const seen = new Set<Equipment>();
    inCurrent.forEach(ex => seen.add(ex.equipment));
    return Array.from(seen);
  }, [activeEnergy]);

  // 탭을 바꾸면 equipment 필터도 초기화
  const handleEnergyChange = (e: EnergySystem) => {
    setActiveEnergy(e);
    setActiveEquipment("all");
  };

  const energyMeta = ENERGY_SYSTEM_META[activeEnergy];

  if (!isRendered) return null;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />
      <div className="fixed inset-0 z-[100] flex items-end justify-center overflow-hidden font-display">
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-black/60 transition-opacity duration-300",
            isAnimating ? "opacity-100" : "opacity-0"
          )}
          onClick={onClose}
        />

        {/* Modal Sheet */}
        <div
          className={cn(
            "relative w-full max-w-md h-[92vh] bg-[#1d2626] rounded-t-[32px] overflow-hidden flex flex-col shadow-2xl transition-transform duration-300 ease-out transform border-x border-t border-white/10",
            isAnimating ? "translate-y-0" : "translate-y-full"
          )}
        >
          {/* Header */}
          <div className="flex-none pt-2 pb-2">
            <div className="w-full flex justify-center pt-2 pb-4 cursor-grab" onClick={onClose}>
              <div className="h-1.5 w-12 rounded-full bg-white/20" />
            </div>
            <div className="flex items-center justify-between px-6 pb-2">
              <div className="w-10" />
              <h2 className="text-xl font-bold text-white tracking-tight">운동 추가</h2>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex-none px-6 pb-3">
            <label className="relative block group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#06e0ce]">
                <Search size={20} />
              </span>
              <input
                className="block w-full bg-[#0d1414] border border-white/10 text-white placeholder:text-gray-500 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-[#06e0ce] focus:shadow-[0_0_10px_rgba(6,224,206,0.2)] transition-all placeholder:font-sans"
                placeholder="운동 이름을 검색하세요"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>

          {/* ── 1차: 에너지 시스템 탭 ── */}
          {!searchQuery && (
            <div className="flex-none px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto themed-scrollbar pb-2">
                {ENERGY_SYSTEMS.map(([id, meta]) => {
                  const isActive = activeEnergy === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleEnergyChange(id)}
                      className="flex-none flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all"
                      style={
                        isActive
                          ? {
                              backgroundColor: `${meta.color}20`,
                              border: `1px solid ${meta.color}`,
                              color: meta.color,
                            }
                          : {
                              backgroundColor: "#0d1414",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "#9ca3af",
                            }
                      }
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                        {meta.icon}
                      </span>
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 2차: 운동기구 필터 (상대적으로 작게) ── */}
          {!searchQuery && availableEquipments.length > 1 && (
            <div className="flex-none px-4 pb-3 border-b border-white/5">
              <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest shrink-0">기구</span>
                <button
                  onClick={() => setActiveEquipment("all")}
                  className={cn(
                    "flex-none px-3 py-1 rounded-full text-xs font-bold transition-all",
                    activeEquipment === "all"
                      ? "bg-[#2a3636] text-white border border-white/20"
                      : "text-gray-500 border border-white/5 hover:text-gray-300"
                  )}
                >
                  전체
                </button>
                {availableEquipments.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setActiveEquipment(eq)}
                    className={cn(
                      "flex-none px-3 py-1 rounded-full text-xs font-bold transition-all",
                      activeEquipment === eq
                        ? "bg-[#2a3636] text-white border border-white/20"
                        : "text-gray-500 border border-white/5 hover:text-gray-300"
                    )}
                  >
                    {EQUIPMENT_META[eq].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 섹션 헤더 (현재 에너지 카테고리) */}
          {!searchQuery && (
            <div
              className="flex-none flex items-center gap-2 px-6 py-3"
              style={{ borderBottom: `1px solid ${energyMeta.color}20` }}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "18px", color: energyMeta.color }}
              >
                {energyMeta.icon}
              </span>
              <span className="text-sm font-bold" style={{ color: energyMeta.color }}>
                {energyMeta.label}
              </span>
              <span className="text-xs text-gray-500 ml-1">({filteredExercises.length})</span>
            </div>
          )}

          {/* Exercise List */}
          <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
            <div className="flex flex-col">
              {filteredExercises.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  운동이 없습니다.
                </div>
              ) : (
                filteredExercises.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => onSelect(ex)}
                    className="group flex items-center justify-between px-6 py-4 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer border-b border-white/5"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="flex-none w-11 h-11 rounded-full bg-[#0d1414] flex items-center justify-center text-[#06e0ce] ring-1 ring-white/5 group-hover:ring-[#06e0ce]/50 transition-all">
                        {ICON_MAP[ex.icon] || <Dumbbell size={22} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <p className="text-white text-base font-bold leading-tight truncate">
                          {ex.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-gray-400 text-sm font-sans leading-tight truncate">
                            {ex.description}
                          </p>
                          {/* 운동기구 뱃지 */}
                          <span className="flex-none text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-gray-500 font-bold">
                            {EQUIPMENT_META[ex.equipment].label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-none ml-4">
                      <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[#06e0ce]/10 text-[#06e0ce] group-hover:bg-[#06e0ce] group-hover:text-[#0d1414] transition-all duration-300">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
              <div className="h-10" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
