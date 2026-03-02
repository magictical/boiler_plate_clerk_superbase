"use client";

import { Accessibility, Dumbbell, GripVertical, Layers, LayoutGrid, MoreHorizontal, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

interface EquipmentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selected: string | null;
  onSelect: (value: string | null) => void;
}

export function EquipmentTypeModal({ isOpen, onClose, selected, onSelect }: EquipmentTypeModalProps) {
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

  const equipments = [
    { id: "pullup_bar", label: "철봉류", icon: Dumbbell },
    { id: "hangboard", label: "행보드", icon: Layers },
    { id: "no_hang", label: "노행 리프트", icon: Upload },
    { id: "campus_board", label: "캠퍼스 보드", icon: GripVertical },
    { id: "spray_wall", label: "스프레이 월", icon: LayoutGrid },
    { id: "bodyweight", label: "맨몸운동", icon: Accessibility },
    { id: "other", label: "기타", icon: MoreHorizontal },
  ];

  return (
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
          <h2 className="text-lg font-bold text-white">어떤 환경에서 하나요? (훈련 기구)</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {equipments.map((eq) => {
            const Icon = eq.icon;
            const isActive = selected === eq.id;
            return (
              <button
                key={eq.id}
                type="button"
                onClick={() => { onSelect(isActive ? null : eq.id); onClose(); }}
                className={`flex items-center gap-4 py-4 px-5 rounded-2xl transition-all w-full text-left ${
                  isActive
                    ? "border border-[#06e0ce] bg-[#06e0ce]/10 text-white shadow-[0_0_15px_rgba(6,224,206,0.1)]"
                    : "border border-white/5 bg-[#1d2626] text-gray-300 hover:bg-[#2a3636] hover:text-white"
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? "bg-[#06e0ce]/20" : "bg-black/20"}`}>
                  <Icon size={24} className={isActive ? "text-[#06e0ce]" : "text-gray-400"} />
                </div>
                <span className="text-[15px] font-bold">{eq.label}</span>
              </button>
            );
          })}
        </div>
        <div className="pb-8 sm:pb-5"></div>
      </div>
    </div>
  );
}
