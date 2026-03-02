"use client";

/**
 * @file app/onboarding/tier-assign/page.tsx
 * @description 온보딩 Step 2: 티어 배정. 홈짐 색상 중 "한 세션에 50% 이상 완등 가능한" 색상 선택 → 티어 저장 → assessment 이동
 * @see docs/implementation-plans/2.4-on-03-tier-assign.md, PRD 3.1 [Step 2]
 */

import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getScalesByGymId } from "@/actions/gyms";
import { getCurrentUserHomeGym, setCurrentTier } from "@/actions/profiles";
import { TierBadge } from "@/components/common/TierBadge";
import { LOGIN_REQUIRED_MESSAGE, LoginRequiredModal } from "@/components/login-required-modal";
import { ColorGrid } from "@/components/onboarding/ColorGrid";
import { Button } from "@/components/ui/button";
import type { TierLevel } from "@/lib/utils/tier";
import type { GymGradeScale } from "@/types/database";

export default function TierAssignPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [scales, setScales] = useState<GymGradeScale[]>([]);
  const [selectedScale, setSelectedScale] = useState<GymGradeScale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { home_gym_id, error: homeError } = await getCurrentUserHomeGym();
    if (homeError) {
      setLoading(false);
      if (homeError === LOGIN_REQUIRED_MESSAGE) {
        router.replace("/onboarding/gym-select");
        return;
      }
      setError(homeError);
      setScales([]);
      return;
    }
    if (!home_gym_id) {
      setLoading(false);
      setScales([]);
      router.replace("/onboarding/gym-select");
      return;
    }
    const { data: scalesData, error: scalesError } = await getScalesByGymId(home_gym_id);
    setLoading(false);
    if (scalesError) {
      setError(scalesError);
      setScales([]);
      return;
    }
    setScales(scalesData ?? []);
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelect = useCallback((scale: GymGradeScale) => {
    setSelectedScale(scale);
    setBadgeKey((k) => k + 1);
  }, []);

  async function handleNext() {
    if (!selectedScale || submitting) return;
    const tier = selectedScale.tier_level as TierLevel;
    if (tier < 1 || tier > 6) return;
    if (isLoaded && !userId) {
      setShowLoginModal(true);
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: err } = await setCurrentTier(tier);
    setSubmitting(false);
    if (err) {
      if (err === LOGIN_REQUIRED_MESSAGE) {
        setShowLoginModal(true);
      } else {
        setError(err);
      }
      return;
    }
    router.push("/onboarding/assessment");
  }

  const canGoNext = !!selectedScale && !submitting;

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f2123] text-white gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#1fe7f9]" aria-hidden />
        <p className="text-sm text-gray-400">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f2123] text-white">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between px-4 py-4 pt-12 sticky top-0 z-50 bg-[#0f2123]/90 backdrop-blur-md">
        <Link
          href="/onboarding/gym-select"
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          aria-label="뒤로"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight flex-1 text-center">
          티어 배정
        </h1>
        <div className="w-10" aria-hidden />
      </header>

      <div className="flex-1 flex flex-col px-4 pb-28">
        {/* 안내 문구 */}
        <p className="text-[#9bbbbb] text-sm mt-2 mb-6 text-center">
          한 세션에 50% 이상 완등 가능한 난이도의 색상을 선택하세요
        </p>

        {/* ColorGrid */}
        <ColorGrid
          scales={scales}
          selectedScaleId={selectedScale?.id ?? null}
          onSelect={handleSelect}
          disabled={submitting}
        />

        {/* 티어 뱃지 (선택 시에만, 애니메이션) */}
        {selectedScale && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">선택한 티어</span>
            <TierBadge key={badgeKey} tier={selectedScale.tier_level as TierLevel} animate />
          </div>
        )}

        {scales.length === 0 && !loading && (
          <p className="mt-6 text-sm text-gray-400 text-center">
            이 암장에는 색상이 등록되지 않았습니다.{" "}
            <Link href="/onboarding/gym-select" className="text-[#1fe7f9] underline">
              홈짐 다시 선택
            </Link>
          </p>
        )}

        {error && (
          <p id="tier-assign-error" className="mt-4 text-sm text-red-400 text-center" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Fixed bottom: 다음 */}
      <div className="fixed bottom-0 w-full max-w-[430px] left-1/2 -translate-x-1/2 p-4 bg-linear-to-t from-[#0f2123] via-[#0f2123]/95 to-transparent z-20">
        <Button
          onClick={handleNext}
          disabled={!canGoNext}
          aria-busy={submitting}
          aria-describedby={error ? "tier-assign-error" : undefined}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-full bg-[#1fe7f9] text-[#0f2123] font-bold text-base hover:bg-[#1fe7f9]/90 shadow-[0_0_20px_rgba(31,231,249,0.3)] disabled:opacity-50 disabled:pointer-events-none"
        >
          {submitting ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : null}
          <span>{submitting ? "저장 중…" : "다음"}</span>
        </Button>
      </div>

      <LoginRequiredModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        description="티어를 저장하려면 로그인이 필요합니다. 로그인 후 다시 시도해 주세요."
      />
    </div>
  );
}
