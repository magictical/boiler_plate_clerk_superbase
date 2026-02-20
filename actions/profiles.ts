"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { LOGIN_REQUIRED_MESSAGE } from "@/constants/auth";
import type { TierLevel } from "@/lib/utils/tier";

/**
 * 현재 로그인 사용자의 홈짐을 설정합니다.
 * Clerk users 테이블의 home_gym_id를 업데이트합니다.
 * 비로그인 시 호출하면 오류 반환.
 */
export async function setHomeGym(gymId: string | null): Promise<{ error: string | null }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: LOGIN_REQUIRED_MESSAGE };
    }

    const supabase = getServiceRoleClient();

    const { error } = await supabase
      .from("users")
      .update({ home_gym_id: gymId })
      .eq("clerk_id", userId);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "setHomeGym failed";
    return { error: message };
  }
}

/**
 * 현재 로그인 사용자의 홈짐 ID를 반환합니다.
 * 티어 배정 페이지에서 scales 조회 전 홈짐 존재 여부 확인용.
 */
export async function getCurrentUserHomeGym(): Promise<{
  home_gym_id: string | null;
  error: string | null;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { home_gym_id: null, error: LOGIN_REQUIRED_MESSAGE };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("users")
      .select("home_gym_id")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (error) {
      return { home_gym_id: null, error: error.message };
    }
    return { home_gym_id: data?.home_gym_id ?? null, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "getCurrentUserHomeGym failed";
    return { home_gym_id: null, error: message };
  }
}

/**
 * 현재 로그인 사용자의 티어(1~6)를 설정합니다.
 * Clerk users 테이블의 current_tier를 업데이트합니다.
 */
export async function setCurrentTier(tier: TierLevel): Promise<{ error: string | null }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: LOGIN_REQUIRED_MESSAGE };
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from("users")
      .update({ current_tier: tier })
      .eq("clerk_id", userId);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "setCurrentTier failed";
    return { error: message };
  }
}

/**
 * 홈 화면용: 현재 사용자의 home_gym_id, current_tier를 한 번에 조회합니다.
 * Guest 판별: isGuest = home_gym_id === null || current_tier === null
 */
export async function getProfileForHome(): Promise<{
  home_gym_id: string | null;
  current_tier: number | null;
  isGuest: boolean;
  error: string | null;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        home_gym_id: null,
        current_tier: null,
        isGuest: true,
        error: null,
      };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("users")
      .select("home_gym_id, current_tier")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (error) {
      return {
        home_gym_id: null,
        current_tier: null,
        isGuest: true,
        error: error.message,
      };
    }

    const home_gym_id = data?.home_gym_id ?? null;
    const rawTier = data?.current_tier ?? null;
    const current_tier =
      rawTier != null && rawTier >= 1 && rawTier <= 6 ? rawTier : null;
    const isGuest = home_gym_id === null || current_tier === null;

    return {
      home_gym_id,
      current_tier,
      isGuest,
      error: null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "getProfileForHome failed";
    return {
      home_gym_id: null,
      current_tier: null,
      isGuest: true,
      error: message,
    };
  }
}

/**
 * 현재 로그인 사용자의 티어를 반환합니다.
 * assessment 페이지 진입 시 티어 배정 완료 여부 확인용.
 */
export async function getCurrentUserTier(): Promise<{
  current_tier: number | null;
  error: string | null;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { current_tier: null, error: LOGIN_REQUIRED_MESSAGE };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("users")
      .select("current_tier")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (error) {
      return { current_tier: null, error: error.message };
    }
    const tier = data?.current_tier ?? null;
    return { current_tier: tier != null && tier >= 1 && tier <= 6 ? tier : null, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "getCurrentUserTier failed";
    return { current_tier: null, error: message };
  }
}

/** Assessment 저장 payload (ON-04 수행 능력 측정) */
export type AssessmentUpdatePayload = {
  weight_kg?: number | null;
  max_hang_1rm?: number | null;
  no_hang_lift_1rm?: number | null;
};

/**
 * 현재 로그인 사용자의 수행 능력 측정값을 저장합니다.
 * users 테이블의 weight_kg, max_hang_1rm, no_hang_lift_1rm 업데이트.
 */
export async function updateAssessment(
  data: AssessmentUpdatePayload
): Promise<{ error: string | null }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: LOGIN_REQUIRED_MESSAGE };
    }

    const payload: Record<string, number | null> = {};
    if (data.weight_kg !== undefined) payload.weight_kg = data.weight_kg ?? null;
    if (data.max_hang_1rm !== undefined) payload.max_hang_1rm = data.max_hang_1rm ?? null;
    if (data.no_hang_lift_1rm !== undefined) payload.no_hang_lift_1rm = data.no_hang_lift_1rm ?? null;
    if (Object.keys(payload).length === 0) {
      return { error: null };
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from("users")
      .update(payload)
      .eq("clerk_id", userId);

    if (error) {
      return { error: error.message };
    }
    return { error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "updateAssessment failed";
    return { error: message };
  }
}
