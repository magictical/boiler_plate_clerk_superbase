"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { flattenRoutine, WorkoutSegment } from "@/lib/utils/flattenRoutine";
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
  lastWeightUpdate: string | null;
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
      .select("id, name, current_tier, max_hang_1rm, current_streak, created_at")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (userError || !userRow) {
      return { data: null, error: userError?.message || "사용자 정보를 찾을 수 없습니다." };
    }

    // Fetch latest weight history
    const { data: weightHistory } = await supabase
      .from("user_weight_history")
      .select("recorded_at")
      .eq("user_id", userRow.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastWeightUpdate = weightHistory?.recorded_at || userRow.created_at;

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
        lastWeightUpdate,
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
  period: StatsPeriod,
  routineId?: string
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

    // 루틴 ID 필터 적용
    if (routineId) {
      query = query.eq("routine_id", routineId);
    }

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

        const res = log.set_results_json;
        // set_results_json은 { [segmentId]: "success"|"half"|"fail" } 형식의 객체
        let volume = 0;
        let maxLoad = 0;

        if (typeof res === 'object' && res !== null && !Array.isArray(res)) {
          const entries = Object.entries(res as Record<string, string>);
          volume = entries.filter(([, status]) => status === "success" || status === "half").length;
          maxLoad = volume; // 홈 차트에는 성공/절반 세트 수를 maxLoad 대신 사용
        } else if (Array.isArray(res)) {
          volume = res.length;
          maxLoad = volume;
        }

        if (!grouped[dateStr]) {
          grouped[dateStr] = { date: dateStr, volume: 0, maxLoad: 0 };
        }
        grouped[dateStr].volume += volume;
        grouped[dateStr].maxLoad += maxLoad;
      });
    }

    const data = Object.values(grouped).sort((a,b) => a.date.localeCompare(b.date));

    return { data, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "getTrainingStats failed";
    return { data: [], error: message };
  }
}

/**
 * 최근 수행한 루틴 목록 조회 (고유 routine_id 기준, 최근 수행순)
 */
export async function getRecentlyUsedRoutines(): Promise<{
  data: { id: string; title: string }[];
  error: string | null;
}> {
  try {
    const { userId } = await auth();
    if (!userId) return { data: [], error: "Unauthorized" };

    const supabase = getServiceRoleClient();

    const { data: userRow } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .maybeSingle();
    if (!userRow) return { data: [], error: "User not found" };

    // 최근 수행 로그에서 고유 routine_id를 최신순으로 추출
    const { data: logs, error: logError } = await supabase
      .from("training_logs")
      .select("routine_id, ended_at")
      .eq("user_id", userRow.id)
      .eq("status", "completed")
      .order("ended_at", { ascending: false });

    if (logError) return { data: [], error: logError.message };
    if (!logs || logs.length === 0) return { data: [], error: null };

    // 고유 routine_id 추출 (최근순 유지)
    const seen = new Set<string>();
    const uniqueRoutineIds: string[] = [];
    for (const log of logs) {
      if (log.routine_id && !seen.has(log.routine_id)) {
        seen.add(log.routine_id);
        uniqueRoutineIds.push(log.routine_id);
      }
    }

    if (uniqueRoutineIds.length === 0) return { data: [], error: null };

    // 루틴 정보 조회
    const { data: routines, error: routineError } = await supabase
      .from("routines")
      .select("id, title")
      .in("id", uniqueRoutineIds);

    if (routineError) return { data: [], error: routineError.message };

    // 최근 수행순으로 정렬 (동일 시간이면 이름순)
    const routineMap = new Map(routines?.map((r) => [r.id, r.title]) ?? []);

    // 각 routine_id 별 최근 수행 시간 추출
    const latestTime = new Map<string, string>();
    for (const log of logs) {
      if (log.routine_id && !latestTime.has(log.routine_id)) {
        latestTime.set(log.routine_id, log.ended_at ?? "");
      }
    }

    const sorted = uniqueRoutineIds
      .filter((id) => routineMap.has(id))
      .map((id) => ({ id, title: routineMap.get(id)! }))
      .sort((a, b) => {
        const timeA = latestTime.get(a.id) ?? "";
        const timeB = latestTime.get(b.id) ?? "";
        // 시간 내림차순 정렬, 동일하면 이름순
        if (timeA !== timeB) return timeB.localeCompare(timeA);
        return a.title.localeCompare(b.title, "ko");
      });

    return { data: sorted, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "getRecentlyUsedRoutines failed";
    return { data: [], error: message };
  }
}

export type CreateLogPayload = {
  routine_id: string;
  status: "completed" | "aborted";
  rpe?: number;
  abort_reason?: string;
  set_results_json?: any;
  user_weight_kg?: number;
  started_at: string; // ISO DateTime
  ended_at: string; // ISO DateTime
};

export async function createTrainingLog(payload: CreateLogPayload): Promise<{ error: string | null }> {
  try {
    const { userId } = await auth();
    if (!userId) return { error: "로그인이 필요합니다." };

    const supabase = getServiceRoleClient();

    // Get user UUID and current weight
    const { data: userRow } = await supabase
      .from("users")
      .select("id, weight_kg")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (!userRow?.id) return { error: "사용자 정보를 찾을 수 없습니다." };

    const userUuid = userRow.id;
    const finalUserWeight = payload.user_weight_kg ?? userRow.weight_kg ?? null;

    const { error } = await supabase
      .from("training_logs")
      .insert({
        user_id: userUuid,
        routine_id: payload.routine_id,
        status: payload.status,
        rpe: payload.rpe,
        abort_reason: payload.abort_reason,
        set_results_json: payload.set_results_json || [],
        user_weight_kg: finalUserWeight,
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

export type RoutineAnalyticsPoint = {
  date: string;
  volume: number;
  /** 총 중량 = userWeight + addedWeight (kg) */
  maxLoad: number;
  /** 세션에서 사용된 최대 부가 중량 (kg) */
  maxAddedWeight: number;
  rpe: number | null;
};

export async function getRoutineAnalytics(
  routineId: string
): Promise<{ data: RoutineAnalyticsPoint[]; userWeight: number; error: string | null }> {
  try {
    const { userId } = await auth();
    if (!userId) return { data: [], userWeight: 0, error: "Unauthorized" };

    const supabase = getServiceRoleClient();

    // 1. Get user uuid and weight
    const { data: userRow } = await supabase
      .from("users")
      .select("id, weight_kg")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (!userRow) return { data: [], userWeight: 0, error: "User not found" };

    const userWeight = userRow.weight_kg || 0;

    // 2. Fetch the current routine structure
    const { data: routineRow } = await supabase
      .from("routines")
      .select("structure_json")
      .eq("id", routineId)
      .maybeSingle();

    if (!routineRow) return { data: [], userWeight, error: "Routine not found" };

    const segments = flattenRoutine(routineRow.structure_json);
    const exerciseSegments = segments.filter(s => s.type === "exercise");

    // blockId -> WorkoutSegment[] 매핑 (같은 블록이 루프로 반복될 수 있음)
    // segmentMap은 segmentId(키: `${blockId}_s${index}`)로도 조회 가능하도록 두 가지 방식 지원
    const segmentById = new Map<string, WorkoutSegment>();
    const segmentsByBlockId = new Map<string, WorkoutSegment[]>();
    exerciseSegments.forEach(seg => {
      segmentById.set(seg.id, seg);
      const arr = segmentsByBlockId.get(seg.blockId) || [];
      arr.push(seg);
      segmentsByBlockId.set(seg.blockId, arr);
    });

    /**
     * segmentId에서 WorkoutSegment를 찾습니다.
     * 1) 정확히 segmentId가 일치하는 경우 (새 포맷: `${blockId}_s${index}`)
     * 2) segmentId에서 blockId를 추출해서 첫 번째 매칭 세그먼트 반환 (구 포맷 호환)
     */
    function findSegment(segmentId: string): WorkoutSegment | undefined {
      // 정확히 일치
      const exact = segmentById.get(segmentId);
      if (exact) return exact;

      // 구 포맷 (`${blockId}_${number}`) 또는 기타 형식에서 blockId 추출 시도
      // 새 포맷: UUID_s숫자, 구 포맷: UUID_숫자
      const match = segmentId.match(/^(.+?)(_s?\d+)$/);
      if (match) {
        const blockId = match[1];
        const arr = segmentsByBlockId.get(blockId);
        if (arr && arr.length > 0) return arr[0];
      }
      return undefined;
    }

    // 3. Fetch training logs for this routine
    const { data: logs, error } = await supabase
      .from("training_logs")
      .select("ended_at, set_results_json, rpe")
      .eq("user_id", userRow.id)
      .eq("routine_id", routineId)
      .eq("status", "completed")
      .order("ended_at", { ascending: true });

    if (error) throw error;
    if (!logs || logs.length === 0) return { data: [], userWeight, error: null };

    const grouped: Record<string, RoutineAnalyticsPoint> = {};

    logs.forEach(log => {
      if (!log.ended_at) return;

      const dateStr = new Date(log.ended_at).toISOString().split("T")[0];
      const res = log.set_results_json as Record<string, string>;

      let sessionVolume = 0;
      let sessionMaxLoad = 0;
      let sessionMaxAdded = 0;

      if (typeof res === "object" && res !== null && !Array.isArray(res)) {
        Object.entries(res).forEach(([segmentId, status]) => {
          if (status === "success" || status === "half") {
            const seg = findSegment(segmentId);
            if (seg) {
              const reps = seg.reps || 1;
              const addedWeight = seg.weight || 0;
              const unitVolume = (userWeight + addedWeight) * reps;
              const multiplier = status === "success" ? 1 : 0.5;

              sessionVolume += unitVolume * multiplier;

              const currentLoad = userWeight + addedWeight;
              if (currentLoad > sessionMaxLoad) {
                sessionMaxLoad = currentLoad;
                sessionMaxAdded = addedWeight;
              }
            }
          }
        });
      }

      const rpe = log.rpe ? Number(log.rpe) : null;

      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, volume: sessionVolume, maxLoad: sessionMaxLoad, maxAddedWeight: sessionMaxAdded, rpe };
      } else {
        // Same day: Accumulate volume, take max load, avg rpe
        grouped[dateStr].volume += sessionVolume;
        if (sessionMaxLoad > grouped[dateStr].maxLoad) {
          grouped[dateStr].maxLoad = sessionMaxLoad;
          grouped[dateStr].maxAddedWeight = sessionMaxAdded;
        }
        if (rpe !== null) {
          if (grouped[dateStr].rpe === null) {
            grouped[dateStr].rpe = rpe;
          } else {
            grouped[dateStr].rpe = Math.round((grouped[dateStr].rpe! + rpe) / 2);
          }
        }
      }
    });

    const data = Object.values(grouped);
    return { data, userWeight, error: null };
  } catch (e: any) {
    return { data: [], userWeight: 0, error: e.message || "Failed to fetch routine analytics" };
  }
}
