"use client";

/**
 * @file components/home/HeroSection.tsx
 * @description Regular User 홈 상단: 프로필 이미지, 닉네임, 티어 뱃지.
 * @see docs/design-refs/07_home_user.html, docs/TODO.md 3.2 HM-02
 */

import { TierBadge } from "@/components/common/TierBadge";
import type { TierLevel } from "@/lib/utils/tier";
import { Settings, User } from "lucide-react";
import Link from "next/link";

export type HeroSectionProps = {
  displayName: string;
  imageUrl?: string | null;
  tier: TierLevel | null;
};

export function HeroSection({
  displayName,
  imageUrl,
  tier,
}: HeroSectionProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between px-5 py-4 bg-[#0f2123]/90 backdrop-blur-lg border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-[#1fe7f9] to-cyan-800 p-[1.5px] shadow-[0_0_12px_rgba(31,231,249,0.3)]">
          {imageUrl ? (
            <img
              alt="프로필"
              className="h-full w-full rounded-full object-cover border-2 border-[#0f2123]"
              src={imageUrl}
            />
          ) : (
            <div className="h-full w-full rounded-full bg-[#162a2d] border-2 border-[#0f2123] flex items-center justify-center">
              <User className="w-4 h-4 text-white/60" />
            </div>
          )}
        </div>
        <h2 className="text-white text-lg font-bold tracking-tight truncate max-w-[180px]">
          {displayName}
        </h2>
      </div>
      <div className="flex items-center gap-3">
        {tier != null && (
          <div className="flex items-center gap-2 px-3 py-1 rounded border border-[#1fe7f9]/20 bg-[#1fe7f9]/5 shadow-[0_0_8px_rgba(31,231,249,0.1)]">
            <TierBadge tier={tier as TierLevel} animate={false} className="!px-2 !py-0.5 !text-xs" />
          </div>
        )}
        <Link href="/settings" className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors">
          <Settings size={22} />
        </Link>
      </div>
    </header>
  );
}
