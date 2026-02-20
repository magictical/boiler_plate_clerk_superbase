"use client";

/**
 * @file components/home/GuestRoutineButton.tsx
 * @description Guest 홈 [+ 새 루틴] 버튼. 클릭 시 GatePopup 표시.
 * @see docs/TODO.md 3.1 HM-01, docs/implementation-plans/3.1-hm-01-guest-home.md
 */

import { useState } from "react";
import { PlusCircle, Lock } from "lucide-react";
import { GatePopup } from "@/components/common/GatePopup";

export function GuestRoutineButton() {
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <>
      <div className="px-4 mt-2">
        <button
          type="button"
          onClick={() => setPopupOpen(true)}
          className="w-full h-14 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center gap-2 group relative overflow-hidden active:scale-[0.98] transition-all hover:bg-white/10"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <PlusCircle className="w-6 h-6 text-white/40 group-hover:text-white/60" />
          <span className="text-white/40 font-medium text-lg group-hover:text-white/60">
            새 루틴 추가
          </span>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-white/30" />
          </div>
        </button>
        <p className="text-center text-[10px] text-gray-500 mt-2">
          * 정확한 분석을 위해 온보딩 설정이 필요합니다
        </p>
      </div>
      <GatePopup open={popupOpen} onOpenChange={setPopupOpen} />
    </>
  );
}
