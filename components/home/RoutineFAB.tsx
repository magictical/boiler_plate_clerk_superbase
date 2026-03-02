"use client";

/**
 * @file components/home/RoutineFAB.tsx
 * @description Regular User 홈 우하단 FAB. [+ 새 루틴 만들기] → /routine-builder.
 * @see docs/design-refs/07_home_user.html, docs/TODO.md 3.2 HM-02
 */

import { Plus } from "lucide-react";
import { useState } from "react";
import { RoutineEntryMenu } from "./RoutineEntryMenu";

export function RoutineFAB() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-24 w-full max-w-[430px] left-1/2 -translate-x-1/2 z-40 flex justify-end px-5">
        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1fe7f9] text-[#0f2123] shadow-[0_0_20px_rgba(31,231,249,0.4)] hover:shadow-[0_0_30px_rgba(31,231,249,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 group"
          aria-label="루틴 메뉴 열기"
        >
          <Plus className={`w-7 h-7 font-bold transition-transform duration-300 ${isMenuOpen ? "rotate-45" : "group-hover:rotate-90"}`} />
        </button>
      </div>

      <RoutineEntryMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />
    </>
  );
}
