"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { auth } from "@clerk/nextjs/server";

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
      .select("id, name, current_tier, max_hang_1rm, current_streak")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (userError || !userRow) {
      return { data: null, error: userError?.message || "사용자 정보를 찾을 수 없습니다." };
    }

    const currentStreak = userRow.current_streak || 0;

    // Fetch logs to calculate sessions & reps
    const { data: logs, error: logsError } = await supabase
      .from("training_logs")
      .select("set_results_json")
      .eq("user_id", userRow.id)
      .eq("status", "completed");

    let totalSessions = 0;
    let totalReps = 0;

    if (logs && !logsError) {
      totalSessions = logs.length;
      logs.forEach(log => {
        const res = log.set_results_json;
        if (Array.isArray(res)) {
           totalReps += res.length;
        } else if (typeof res === 'object' && res !== null) {
           totalReps += Object.keys(res).length;
        }
      });
    }

    // Consistency percent logic: For MVP, assume 100% max if 4 sessions are done
    const consistencyPercent = totalSessions > 0 ? Math.min(100, (totalSessions / 4) * 100) : 0;

    return {
      data: {
        displayName: userRow.name ?? "User",
        currentTier: userRow.current_tier ?? null,
        currentStreak,
        maxHang1rm: userRow.max_hang_1rm ?? null,
        totalSessions,
        totalReps,
        consistencyPercent: Math.round(consistencyPercent),
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
  period: StatsPeriod
): Promise<{ data: TrainingStatsPoint[]; error: string | null }> {
  try {
    const { userId } = await auth();
    if (!userId) return { data: [], error: "Unauthorized" };

    const supabase = getServiceRoleClient();

    // Get user Id
    const { data: userRow } = await supabase.from("users").select("id").eq("clerk_id", userId).maybeSingle();
    if (!userRow) return { data: [], error: "User not found" };

    // Fetch all logs according to period
    let query = supabase.from("training_logs").select("ended_at, set_results_json").eq("user_id", userRow.id).eq("status", "completed");

    if (period === "1M") {
       const date = new Date();
       date.setMonth(date.getMonth() - 1);
       query = query.gte("ended_at", date.toISOString());
    } else if (period === "3M") {
       const date = new Date();
       date.setMonth(date.getMonth() - 3);
       query = query.gte("ended_at", date.toISOString());
    }

    const { data: logs, error } = await query;
    if (error) return { data: [], error: error.message };

    const grouped: Record<string, TrainingStatsPoint> = {};

    if (logs) {
      logs.forEach(log => {
        if (!log.ended_at) return;

        // Convert to YYYY-MM-DD
        const dateStr = new Date(log.ended_at).toISOString().split("T")[0];

        let volume = 0;
        const res = log.set_results_json;
        if (Array.isArray(res)) volume = res.length;
        else if (typeof res === 'object' && res !== null) volume = Object.keys(res).length;

        if (!grouped[dateStr]) {
          grouped[dateStr] = { date: dateStr, volume: 0, maxLoad: 0 };
        }
        grouped[dateStr].volume += volume;
        // In MVP, we use successful sets or total volume as maxLoad indicator to draw the chart properly
        grouped[dateStr].maxLoad += typeof res === 'object' && res !== null && !Array.isArray(res)
          ? Object.values(res).filter(v => v === "success").length || volume
          : volume;
      });
    }

    const data = Object.values(grouped).sort((a,b) => a.date.localeCompare(b.date));

    return { data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "getTrainingStats failed";
    return { data: [], error: message };
  }
}

export type CreateLogPayload = {
  routine_id: string;
  status: "completed" | "aborted";
  rpe?: number;
  abort_reason?: string;
  set_results_json?: any;
  started_at: string; // ISO DateTime
  ended_at: string; // ISO DateTime
};

export async function createTrainingLog(payload: CreateLogPayload): Promise<{ error: string | null }> {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "로그인이 필요합니다." };

    const supabase = getServiceRoleClient();

    // Get user UUID
    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (!userRow?.id) return { error: "사용자 정보를 찾을 수 없습니다." };

    const userUuid = userRow.id;

    const { error } = await supabase
      .from("training_logs")
      .insert({
        user_id: userUuid,
        routine_id: payload.routine_id,
        status: payload.status,
        rpe: payload.rpe,
        abort_reason: payload.abort_reason,
        set_results_json: payload.set_results_json || [],
        started_at: payload.started_at,
        ended_at: payload.ended_at,
      });

    if (error) throw error;

    // updateStreak 로직 호출 (간단히 연동만)
    await updateStreak(userUuid);

    return { error: null };
  } catch (e: any) {
    return { error: e?.message || "훈련 기록 저장에 실패했습니다." };
  }
}

/**
 * 간단한 스트릭 업데이트
 */
async function updateStreak(userUuid: string) {
  // 실제 로직: 오늘 완주한 횟수나 연속 일수 증가
  // 여기선 단순히 current_streak 을 +1 한다고 가정
  const supabase = getServiceRoleClient();
  const { data: user } = await supabase
    .from("users")
    .select("current_streak")
    .eq("id", userUuid)
    .single();

  if (user) {
    await supabase
      .from("users")
      .update({ current_streak: (user.current_streak || 0) + 1 })
      .eq("id", userUuid);
  }
}
