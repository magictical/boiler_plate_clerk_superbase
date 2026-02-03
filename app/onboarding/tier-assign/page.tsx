"use client";

/**
 * @file app/onboarding/tier-assign/page.tsx
 * @description 온보딩 Step 2: 티어 배정 — placeholder (TODO 2.4에서 본 구현)
 * @see docs/TODO.md § 2.4
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TierAssignPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f2123] text-white">
      <header className="shrink-0 flex items-center justify-between px-4 py-4 pt-12">
        <Link
          href="/onboarding/gym-select"
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="뒤로"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight flex-1 text-center">
          티어 배정
        </h1>
        <div className="w-10" aria-hidden />
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <p className="text-[#9bbbbb] text-center">
          티어 배정 (구현 예정)
        </p>
        <Link
          href="/onboarding/gym-select"
          className="mt-6 text-[#1fe7f9] hover:underline"
        >
          홈짐 선택으로 돌아가기
        </Link>
      </main>
    </div>
  );
}
