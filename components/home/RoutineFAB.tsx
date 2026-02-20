"use client";

/**
 * @file components/home/RoutineFAB.tsx
 * @description Regular User 홈 우하단 FAB. [+ 새 루틴 만들기] → /routine-builder.
 * @see docs/design-refs/07_home_user.html, docs/TODO.md 3.2 HM-02
 */

import { Plus } from "lucide-react";
import Link from "next/link";

export function RoutineFAB() {
  return (
    <div className="fixed bottom-24 right-5 z-50 max-w-[430px] mx-auto w-full flex justify-end pr-5">
      <Link
        href="/routine-builder"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#1fe7f9] text-[#0f2123] shadow-[0_0_20px_rgba(31,231,249,0.4)] hover:shadow-[0_0_30px_rgba(31,231,249,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 group"
        aria-label="새 루틴 만들기"
      >
        <Plus className="w-7 h-7 font-bold group-hover:rotate-90 transition-transform duration-300" />
      </Link>
    </div>
  );
}
