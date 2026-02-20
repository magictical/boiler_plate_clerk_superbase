/**
 * @file app/page.tsx
 * @description 메인 홈. Guest vs Regular 분기. Guest: 배너·잠금 티어·차트·새 루틴 버튼. Regular: 히어로·스트릭·차트·메트릭·FAB.
 * @see docs/TODO.md 3.1 HM-01, 3.2 HM-02
 */

import { getProfileForHome } from "@/actions/profiles";
import { getHomeMetrics } from "@/actions/training-logs";
import { GuestBanner } from "@/components/home/GuestBanner";
import { GuestChartSection } from "@/components/home/GuestChartSection";
import { GuestRoutineButton } from "@/components/home/GuestRoutineButton";
import { GuestTierSection } from "@/components/home/GuestTierSection";
import { HeroSection } from "@/components/home/HeroSection";
import { MetricGrid } from "@/components/home/MetricGrid";
import { RoutineFAB } from "@/components/home/RoutineFAB";
import { StatsChart } from "@/components/home/StatsChart";
import { StreakWidget } from "@/components/home/StreakWidget";
import type { TierLevel } from "@/lib/utils/tier";

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
  if (metricsError || !metrics) {
    return (
      <main className="min-h-screen bg-[#0f2123] text-white">
        <div className="max-w-[430px] mx-auto px-4 py-8">
          <p className="text-red-400">
            메트릭을 불러오는 중 오류가 발생했습니다.
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
          <StatsChart initialData={[]} initialPeriod="1M" />
          <MetricGrid metrics={metrics} />
        </div>
        <RoutineFAB />
      </div>
    </main>
  );
}
