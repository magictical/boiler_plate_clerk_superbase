"use client";

/**
 * @file app/onboarding/gym-create/page.tsx
 * @description 온보딩: 커스텀 암장 등록. 이름 입력, 색상-티어 매핑 후 저장 → tier-assign 이동
 * @see docs/design-refs/03_gym_create.html, docs/implementation-plans/2.3-on-02-create-gym.md
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GymCreator } from "@/components/onboarding/GymCreator";
import { createGymWithScales, type GymScaleInput } from "@/actions/gyms";
import { setHomeGym } from "@/actions/profiles";

export default function GymCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [scales, setScales] = useState<GymScaleInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    scales.length > 0 &&
    !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    const { data, error: err } = await createGymWithScales(
      { name: name.trim() },
      scales,
    );
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    if (!data?.id) {
      setError("암장 생성에 실패했습니다.");
      return;
    }
    const setHomeResult = await setHomeGym(data.id);
    if (setHomeResult.error) {
      setError(setHomeResult.error);
      return;
    }
    router.push("/onboarding/tier-assign");
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
          커스텀 암장 등록
        </h1>
        <div className="w-10" aria-hidden />
      </header>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col px-4 pb-28">
        {/* 암장 이름 */}
        <div className="mt-2 space-y-2">
          <label
            htmlFor="gym-name"
            className="text-sm font-medium text-[#9bbbbb] pl-1 block"
          >
            암장 이름
          </label>
          <input
            id="gym-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="암장 이름을 입력하세요"
            className="block w-full rounded-xl border border-[#2a4043] py-4 pl-4 pr-10 text-white bg-[#162a2d] placeholder:text-gray-500 focus:ring-2 focus:ring-[#1fe7f9] focus:border-[#1fe7f9] transition-all"
          />
        </div>

        {/* GymCreator: 색상 + 티어 매핑 */}
        <div className="mt-6">
          <GymCreator onChange={setScales} />
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        {/* Fixed bottom: 저장하기 */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-[#0f2123] via-[#0f2123]/95 to-transparent z-20">
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 bg-[#1fe7f9] hover:bg-[#1fe7f9]/90 text-[#0f2123] font-bold py-4 px-6 rounded-xl shadow-[0_0_20px_-5px_rgba(31,231,249,0.5)] disabled:opacity-50 disabled:pointer-events-none"
          >
            <Save className="h-5 w-5" />
            <span className="text-lg">저장하기</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
