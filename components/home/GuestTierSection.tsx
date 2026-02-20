"use client";

/**
 * @file components/home/GuestTierSection.tsx
 * @description Guest 홈 티어 영역. 잠금 아이콘 + ? 뱃지, 안내 문구, 프로필 완성하기 버튼.
 * @see docs/design-refs/06_home_guest.html, PRD 3.4 Guest Mode
 */

import Link from "next/link";
import { Lock, LogIn } from "lucide-react";

const ONBOARDING_GYM_SELECT_PATH = "/onboarding/gym-select";

export function GuestTierSection() {
  return (
    <section className="flex flex-col px-4 py-4">
      <h2 className="text-white text-xl font-bold mb-5 flex items-center gap-2">
        나의 클라이밍 티어
        <Lock className="text-white/30 w-5 h-5" />
      </h2>
      <div className="relative flex flex-col items-center justify-center py-8 rounded-2xl bg-gradient-to-b from-[#162a2d] to-transparent border border-white/5">
        {/* Locked Visual */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-[#1fe7f9]/20 blur-3xl rounded-full scale-150" />
          <div
            className="relative w-28 h-28 rounded-full flex items-center justify-center z-10 border border-white/10 bg-gradient-to-br from-gray-300 via-white to-gray-400 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),0_4px_8px_rgba(0,0,0,0.5)]"
            style={{
              background:
                "linear-gradient(135deg, #e2e8ec 0%, #ffffff 50%, #9ca3af 100%)",
            }}
          >
            <Lock className="w-12 h-12 text-gray-600 drop-shadow-sm" />
          </div>
          <div className="absolute -top-1 -right-1 z-20 w-10 h-10 rounded-full bg-[#1fe7f9] border-4 border-[#162a2d] flex items-center justify-center shadow-lg">
            <span className="text-[#0f2123] font-bold text-lg">?</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center z-10">
          <p className="text-white text-xl font-bold tracking-tight">
            프로필을 완성해주세요
          </p>
          <p className="text-gray-400 text-sm font-normal max-w-[240px]">
            홈짐과 티어를 설정하면 내 클라이밍 실력을
            <br />
            AI로 정밀하게 분석해볼 수 있어요.
          </p>
        </div>
        <Link
          href={ONBOARDING_GYM_SELECT_PATH}
          className="mt-6 flex items-center justify-center h-10 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/5"
        >
          <span className="mr-2">프로필 완성하기</span>
          <LogIn className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
