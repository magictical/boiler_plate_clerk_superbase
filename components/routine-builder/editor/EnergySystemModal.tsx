"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface EnergySystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: string | null;
  onSelect: (value: string | null) => void;
}

const PROTOCOLS = [
  {
    id: "max_strength",
    label: "최대 근력",
    labelEn: "Max Strength",
    description: "최대 출력 위주의 강도 높은 훈련",
    icon: "fitness_center",
    color: "#06e0ce",
    bg: "rgba(6,224,206,0.1)",
    border: "rgba(6,224,206,0.3)",
    shadow: "rgba(6,224,206,0.25)",
    hoverBorder: "rgba(6,224,206,0.5)",
  },
  {
    id: "power",
    label: "파워",
    labelEn: "Power",
    description: "순간 폭발력 & 동적 동작 위주",
    icon: "flash_on",
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)",
    border: "rgba(249,115,22,0.3)",
    shadow: "rgba(249,115,22,0.25)",
    hoverBorder: "rgba(249,115,22,0.5)",
  },
  {
    id: "power_endurance",
    label: "파워 지구력",
    labelEn: "Power Endure",
    description: "지속적인 고강도 유지 훈련",
    icon: "battery_charging_full",
    color: "#facc15",
    bg: "rgba(250,204,21,0.1)",
    border: "rgba(250,204,21,0.3)",
    shadow: "rgba(250,204,21,0.25)",
    hoverBorder: "rgba(250,204,21,0.5)",
  },
  {
    id: "endurance",
    label: "지구력 / ARC",
    labelEn: "Endurance",
    description: "장시간 지속 능력 강화 훈련",
    icon: "all_inclusive",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.1)",
    border: "rgba(34,197,94,0.3)",
    shadow: "rgba(34,197,94,0.25)",
    hoverBorder: "rgba(34,197,94,0.5)",
  },
];

export function EnergySystemModal({ isOpen, onClose, selected, onSelect }: EnergySystemModalProps) {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <>
      {/* Material Symbols 폰트 로드 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
      />

      <div
        className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${
          isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-black/0 backdrop-blur-none"
        }`}
        onClick={onClose}
      >
        <div
          className={`w-full max-w-md bg-[#162629] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl transition-all duration-300 transform ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-full sm:translate-y-8 opacity-0"
          } overflow-hidden`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#06e0ce] rounded-full" />
              <h2 className="text-lg font-bold text-white">훈련 목적 선택</h2>
            </div>
            <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 grid grid-cols-2 gap-3">
            {PROTOCOLS.map((p) => {
              const isActive = selected === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onSelect(isActive ? null : p.id); onClose(); }}
                  className="group relative flex flex-col items-start justify-between h-40 p-4 rounded-2xl text-left overflow-hidden transition-all duration-300"
                  style={{
                    backgroundColor: "#1d2626",
                    border: `1px solid ${isActive ? p.color : "rgba(255,255,255,0.06)"}`,
                    boxShadow: isActive ? `0 0 20px ${p.shadow}` : "none",
                  }}
                >
                  {/* 배경 장식 원 */}
                  <div
                    className="absolute right-0 top-0 w-20 h-20 rounded-bl-full -mr-3 -mt-3 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: p.bg }}
                  />

                  {/* 아이콘 박스 */}
                  <div
                    className="relative z-10 w-11 h-11 flex items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: "#0d1414",
                      border: `1px solid ${p.border}`,
                      color: p.color,
                      boxShadow: `0 0 12px ${p.shadow}`,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "26px" }}>
                      {p.icon}
                    </span>
                  </div>

                  {/* 텍스트 */}
                  <div className="relative z-10">
                    <p
                      className="text-sm font-bold text-white mb-0.5 transition-colors duration-200"
                      style={{ color: isActive ? p.color : "white" }}
                    >
                      {p.label}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">{p.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="pb-8 sm:pb-5" />
        </div>
      </div>
    </>
  );
}
