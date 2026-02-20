"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export type StatsPeriod = "1M" | "3M" | "all";

export type TrainingStatsPoint = {
  date: string;
  volume: number;
  maxLoad: number;
};

export type HomeMetrics = {
  displayName: string;
  currentTier: number | null;
  currentStreak: number;
  maxHang1rm: number | null;
  totalSessions: number;
  totalReps: number;
  consistencyPercent: number;
};

/**
 * 홈 화면용 요약 메트릭. users 테이블 및 집계 데이터 반환.
 */
export async function getHomeMetrics(): Promise<{
  data: HomeMetrics | null;
  error: string | null;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { data: null, error: "로그인이 필요합니다." };
    }

    const supabase = getServiceRoleClient();

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("name, current_tier, max_hang_1rm")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (userError) {
      return { data: null, error: userError.message };
    }

    const currentStreak = 0;

    return {
      data: {
        displayName: userRow?.name ?? "User",
        currentTier: userRow?.current_tier ?? null,
        currentStreak,
        maxHang1rm: userRow?.max_hang_1rm ?? null,
        totalSessions: 0,
        totalReps: 0,
        consistencyPercent: 0,
      },
      error: null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "getHomeMetrics failed";
    return { data: null, error: message };
  }
}

/**
 * 기간별 훈련 통계 (차트용). training_logs.user_id는 profiles.id를 참조하므로
 * Clerk 전용 users 테이블과 직접 매핑되지 않음. MVP에서는 빈 배열 반환.
 */
export async function getTrainingStats(
  _period: StatsPeriod
): Promise<{ data: TrainingStatsPoint[]; error: string | null }> {
  try {
    await auth();
    return { data: [], error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "getTrainingStats failed";
    return { data: [], error: message };
  }
}
