"use client";

/**
 * @file app/onboarding/gym-select/page.tsx
 * @description 온보딩 Step 1: 홈짐 선택. 건너뛰기(Guest), 검색/필터, 리스트 선택, 새 암장 등록 버튼
 * @see docs/design-refs/02_gym_select.html
 */

import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getGyms } from "@/actions/gyms";
import { setHomeGym } from "@/actions/profiles";
import { LOGIN_REQUIRED_MESSAGE, LoginRequiredModal } from "@/components/login-required-modal";
import { GymSearchList } from "@/components/onboarding/GymSearchList";
import { Button } from "@/components/ui/button";
import type { Gym } from "@/types/database";

type FilterType = "all" | "official" | "community";

export default function GymSelectPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchGyms = useCallback(async (searchTerm?: string) => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getGyms(searchTerm?.trim() || undefined);
    setLoading(false);
    if (err) {
      setError(err);
      setGyms([]);
      return;
    }
    setGyms(data ?? []);
  }, []);

  useEffect(() => {
    fetchGyms();
  }, [fetchGyms]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchGyms(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search, fetchGyms]);

  const filteredGyms =
    filter === "all"
      ? gyms
      : filter === "official"
        ? gyms.filter((g) => g.is_official)
        : gyms.filter((g) => !g.is_official);

  async function handleSkip() {
    router.push("/");
  }

  async function handleConfirm() {
    if (!selectedId || submitting) return;
    if (isLoaded && !userId) {
      setShowLoginModal(true);
      return;
    }
    setSubmitting(true);
    const { error: err } = await setHomeGym(selectedId);
    setSubmitting(false);
    if (err) {
      if (err === LOGIN_REQUIRED_MESSAGE) {
        setShowLoginModal(true);
        setError(null);
      } else {
        setError(err);
      }
      return;
    }
    router.push("/onboarding/tier-assign");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f2123] text-white">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between p-4 pb-2 pt-12 sticky top-0 z-10 bg-[#0f2123]">
        <Link
          href="/"
          className="flex items-center justify-center p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold leading-tight tracking-tight flex-1 ml-2">
          홈짐 선택
        </h1>
        <Button
          variant="ghost"
          className="text-[#1fe7f9] font-bold text-sm uppercase tracking-wide hover:opacity-80 hover:bg-transparent"
          onClick={handleSkip}
        >
          건너뛰고 둘러보기
        </Button>
      </div>

      {/* Search */}
      <div className="shrink-0 px-4 py-4 z-10 bg-[#0f2123]">
        <div className="flex h-14 w-full items-center rounded-full border border-[#2a4043] bg-[#162a2d] px-4 focus-within:border-[#1fe7f9] focus-within:shadow-[0_0_12px_rgba(31,231,249,0.25)] transition-all">
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            type="search"
            placeholder="암장명 또는 지역 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 px-3 text-base font-medium"
          />
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {(["all", "official", "community"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                filter === key
                  ? "bg-[#1fe7f9]/10 border border-[#1fe7f9]/30 text-[#1fe7f9]"
                  : "bg-[#162a2d] border border-[#2a4043] text-gray-400 hover:border-gray-500 hover:text-white"
              }`}
            >
              {key === "all" ? "전체" : key === "official" ? "공식" : "커뮤니티"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <GymSearchList
        gyms={filteredGyms}
        selectedId={selectedId}
        onSelect={setSelectedId}
        loading={loading}
        error={error}
      />

      {/* Bottom: Next (if selected) + Create New Gym */}
      <div className="fixed bottom-0 w-full max-w-[430px] left-1/2 -translate-x-1/2 z-20 px-4 pb-8 pt-4 bg-linear-to-t from-[#0f2123] via-[#0f2123]/95 to-transparent">
        <div className="flex flex-col gap-3">
          {selectedId && (
            <Button
              onClick={handleConfirm}
              disabled={submitting}
              className="w-full h-14 rounded-full bg-[#1fe7f9] text-[#0f2123] font-bold text-base hover:bg-[#1fe7f9]/90 shadow-[0_0_20px_rgba(31,231,249,0.3)]"
            >
              {submitting ? "저장 중…" : "다음"}
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="w-full h-14 rounded-full border-[#2a4043] bg-[#162a2d] text-white font-bold text-base hover:bg-[#1c3336] hover:text-white"
          >
            <Link href="/onboarding/gym-create" className="flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              새 암장 등록
            </Link>
          </Button>
        </div>
      </div>

      <LoginRequiredModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        description="홈짐을 저장하려면 로그인이 필요합니다. 로그인 후 다시 시도해 주세요."
      />
    </div>
  );
}
