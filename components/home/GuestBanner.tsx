"use client";

/**
 * @file components/home/GuestBanner.tsx
 * @description Guest 홈 상단 CTA 배너. 클릭 시 온보딩 Step 1(홈짐 선택)으로 이동.
 * @see docs/design-refs/06_home_guest.html, docs/TODO.md 3.1 HM-01
 */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ONBOARDING_GYM_SELECT_PATH = "/onboarding/gym-select";

export function GuestBanner() {
  return (
    <div className="px-4 mb-6">
      <Link
        href={ONBOARDING_GYM_SELECT_PATH}
        className="relative overflow-hidden rounded-xl bg-[#162a2d] border border-[#1fe7f9]/30 p-4 shadow-[0_0_15px_rgba(31,231,249,0.15)] group cursor-pointer transition-all hover:border-[#1fe7f9]/60 block"
      >
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#1fe7f9]/10 rounded-full blur-2xl" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex flex-col gap-1">
            <p className="text-[#1fe7f9] text-sm font-bold tracking-wide uppercase">
              AI Coaching
            </p>
            <p className="text-white text-base font-bold leading-tight">
              내 티어 확인하고
              <br />
              AI 코칭 받기
            </p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1fe7f9] text-black shadow-lg shadow-[#1fe7f9]/20">
            <ArrowRight className="h-5 w-5" />
          </span>
        </div>
      </Link>
    </div>
  );
}
