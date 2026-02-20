"use client";

import Link from "next/link";
import { Sparkles, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModeSelectCardProps {
  variant: "ai" | "custom";
  href: string;
}

export function ModeSelectCard({ variant, href }: ModeSelectCardProps) {
  const isAI = variant === "ai";

  return (
    <Link href={href} className="block w-full flex-1 min-h-[260px]">
      <div
        className={cn(
          "relative group w-full h-full overflow-hidden rounded-2xl border transition-all duration-300",
          isAI
            ? "border-[#1fe7f9]/40 bg-[#142628] hover:border-[#1fe7f9] shadow-[0_0_15px_rgba(31,231,249,0.2)]"
            : "border-gray-700 bg-[#18181b] hover:border-gray-500"
        )}
      >
        {/* Background Image */}
        <div
          className={cn(
            "absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-300",
            isAI ? "opacity-40 mix-blend-overlay" : "opacity-20 grayscale"
          )}
          style={{
            backgroundImage: isAI
              ? 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBEZyBgBUIuvy7YE1bO0c-vgDs-FCrve9-5wlQ0A97Ua38b6rCbz3Gm2z9MZbfy1IRSjTCfAumPPe4w42bclM5TYtRYtg5YFwlgOlNZc0xbnVAcBQGohx-VHmCCuRYweU-jyLg-Bvdwc9-ziJQ8vc2Cu1jqHsGQWINyVo-TFCoSd0Kfvife48NK0nP_P0RgIb3xoh5piiML-Oe_Ax1oMJtko0nuMezRxZtquCQBCNTuPwp6RT6RUZD5EnBDJ7Q8ZlFECX4sizREYt96")'
              : 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA_HS2VGfyKjXBdSxtqY9JW7M4HeYvC-x5XY4ym31c8wzMzMZJ-nUGWI0mWU7PetCPZH3FNUYI3CsZhHVnrOUCMUlxIRdGLYeJsPNBJMaYewJsUvSP3g75kYItghqyGzS9ZQia1Zp7ZaikXz_snZee6TMPOx55s2Lwa6t8J2OOzywvNbyiBFNNLGwA2-zIo7JgSYTQgpikEV6b1tmBB0iiUVqXrTjBBA3_6-jr5diKorD6x2JCZlb_i8H22QFu8TXKrAxvHSvzrt6YX")',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f2123]/80 to-[#0f2123] z-0" />
        
        {/* Hover Effect */}
        <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0",
            isAI ? "bg-[#1fe7f9]/5" : "bg-white/5"
        )} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between p-6">
          {/* Top Row */}
          <div className="flex justify-between items-start">
            <div
              className={cn(
                "flex items-center justify-center w-14 h-14 rounded-xl backdrop-blur-sm transition-colors",
                isAI
                  ? "bg-[#1fe7f9]/10 border border-[#1fe7f9]/30 text-[#1fe7f9] shadow-[0_0_15px_rgba(31,231,249,0.3)]"
                  : "bg-white/5 border border-white/10 text-gray-300 group-hover:text-white group-hover:border-white/30"
              )}
            >
              {isAI ? <Sparkles size={32} className="animate-pulse" /> : <Settings size={32} />}
            </div>
            {isAI && (
              <span className="bg-[#1fe7f9] text-[#0f2123] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-[0_0_10px_rgba(31,231,249,0.4)]">
                Smart Choice
              </span>
            )}
          </div>

          {/* Bottom Row */}
          <div>
            <h3 className={cn(
                "text-2xl font-bold mb-2 tracking-tight transition-colors",
                isAI ? "text-white group-hover:text-[#1fe7f9]" : "text-gray-200 group-hover:text-white"
            )}>
              {isAI ? "AI 코치 추천" : "커스텀 디자인"}
            </h3>
            <div className={cn(
                "h-0.5 w-12 mb-3 transition-colors",
                isAI ? "bg-[#1fe7f9]" : "bg-gray-600 group-hover:bg-white"
            )} />
            <p className={cn(
                "text-sm font-normal leading-relaxed",
                isAI ? "text-gray-300 opacity-90" : "text-gray-400"
            )}>
              {isAI 
                ? "컨디션과 피로도를 분석하여 최적의 루틴을 제안합니다."
                : "직접 홀드, 휴식 시간, 세트를 설정하여 나만의 루틴을 만듭니다."
              }
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
