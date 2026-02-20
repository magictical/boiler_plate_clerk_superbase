/**
 * @file app/page.tsx
 * @description 메인 홈. Guest vs Regular 분기. Guest: 배너·잠금 티어·차트·새 루틴 버튼. Regular: 히어로·스트릭·차트·메트릭·FAB.
 * @see docs/TODO.md 3.1 HM-01, 3.2 HM-02
 */

import { getProfileForHome } from "@/actions/profiles";
import { getHomeMetrics, getTrainingStats } from "@/actions/training-logs";
import { GuestBanner } from "@/components/home/GuestBanner";
import { GuestChartSection } from "@/components/home/GuestChartSection";
import { GuestRoutineButton } from "@/components/home/GuestRoutineButton";
import { GuestTierSection } from "@/components/home/GuestTierSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HomeRoutineActions } from "@/components/home/HomeRoutineActions";
import { MetricGrid } from "@/components/home/MetricGrid";
import { RoutineFAB } from "@/components/home/RoutineFAB";
import { StatsChart } from "@/components/home/StatsChart";
import { StreakWidget } from "@/components/home/StreakWidget";
import type { TierLevel } from "@/lib/utils/tier";
import { Settings } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const { isGuest, error } = await getProfileForHome();

  if (error) {
    return (
      <main className="min-h-screen bg-[#0f2123] text-white">
        <div className="max-w-[430px] mx-auto px-4 py-8">
          <p className="text-red-400">프로필을 불러오는 중 오류가 발생했습니다.</p>
        </div>
      </main>
    );
  }

  if (isGuest) {
    return (
      <main className="min-h-screen max-w-[430px] w-full mx-auto bg-[#0f2123] text-white pb-8 pt-0 px-0">
        <div className="relative w-full min-h-screen flex flex-col overflow-x-hidden">
          <header className="flex items-center justify-between px-5 pt-4 pb-4">
            <h1 className="text-xl font-black tracking-widest italic text-[#1fe7f9]">GRIPLAB</h1>
            <Link href="/settings" className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors">
              <Settings size={22} />
            </Link>
          </header>
          <GuestBanner />
          <GuestTierSection />
          <GuestChartSection />
          <GuestRoutineButton />
          <div className="h-6" />
        </div>
      </main>
    );
  }

  const { data: metrics, error: metricsError } = await getHomeMetrics();
  const { data: initialChartData } = await getTrainingStats("1M");

  if (metricsError || !metrics) {
    return (
      <main className="min-h-screen bg-[#0f2123] text-white">
        <div className="max-w-[430px] mx-auto px-4 py-8">
          <p className="text-red-400 font-bold">
            메트릭을 불러오는 중 오류가 발생했습니다.
          </p>
          <p className="text-sm text-red-300 mt-2 bg-red-500/10 p-4 rounded-xl break-words">
            {metricsError || "데이터를 찾을 수 없습니다."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-[430px] w-full mx-auto bg-[#0f2123] text-white pb-24 pt-0 px-0">
      <div className="relative flex min-h-screen w-full flex-col">
        <HeroSection
          displayName={metrics.displayName}
          imageUrl={null}
          tier={metrics.currentTier as TierLevel | null}
        />
        <div className="flex-1 flex flex-col gap-6 pt-2">
          <StreakWidget
            currentStreak={metrics.currentStreak}
            bestStreak={undefined}
          />
          <HomeRoutineActions />
          <StatsChart initialData={initialChartData || []} initialPeriod="1M" />
          <MetricGrid metrics={metrics} />
        </div>
        <RoutineFAB />
      </div>
    </main>
  );
}
