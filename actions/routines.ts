"use server";

import { LOGIN_REQUIRED_MESSAGE } from "@/constants/auth";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { RoutineBlock } from "@/types/routine";
import { auth } from "@clerk/nextjs/server";

export type RoutineResult = {
  id: string;
  title: string;
  estimated_time: number;
  total_sets: number;
  structure_json: RoutineBlock[];
  energy_system: string | null;
  equipment_type: string | null;
  created_at: string;
  updated_at: string | null;
};

// Internal Helper: Get user UUID from users table using clerk_id
async function getCurrentUserUuid(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .maybeSingle();

  return data?.id || null;
}

/**
 * 루틴 목록 조회
 */
export async function getRoutines(): Promise<{ data: RoutineResult[] | null; error: string | null }> {
  try {
    const userUuid = await getCurrentUserUuid();
    if (!userUuid) return { data: null, error: LOGIN_REQUIRED_MESSAGE };

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("routines")
      .select("*")
      .eq("user_id", userUuid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data as RoutineResult[], error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to fetch routines" };
  }
}

/**
 * 단일 루틴 상세 조회
 */
export async function getRoutine(routineId: string): Promise<{ data: RoutineResult | null; error: string | null }> {
  try {
    const userUuid = await getCurrentUserUuid();
    if (!userUuid) return { data: null, error: LOGIN_REQUIRED_MESSAGE };

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("routines")
      .select("*")
      .eq("id", routineId)
      .eq("user_id", userUuid)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { data: null, error: "Routine not found" };

    return { data: data as RoutineResult, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to fetch routine" };
  }
}

export type CreateRoutinePayload = {
  title: string;
  estimated_time: number;
  total_sets: number;
  structure_json: RoutineBlock[];
  energy_system?: string | null;
  equipment_type?: string | null;
};

/**
 * 루틴 생성
 */
export async function createRoutine(payload: CreateRoutinePayload): Promise<{ data: RoutineResult | null; error: string | null }> {
  try {
    const userUuid = await getCurrentUserUuid();
    if (!userUuid) return { data: null, error: LOGIN_REQUIRED_MESSAGE };

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("routines")
      .insert({
        user_id: userUuid,
        title: payload.title,
        estimated_time: payload.estimated_time,
        total_sets: payload.total_sets,
        structure_json: payload.structure_json,
        energy_system: payload.energy_system ?? null,
        equipment_type: payload.equipment_type ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return { data: data as RoutineResult, error: null };
  } catch (e: any) {
    return { data: null, error: e?.message || "Failed to create routine" };
  }
}

/**
 * 루틴 수정
 */
export async function updateRoutine(
  routineId: string,
  payload: Partial<CreateRoutinePayload>
): Promise<{ data: RoutineResult | null; error: string | null }> {
  try {
    const userUuid = await getCurrentUserUuid();
    if (!userUuid) return { data: null, error: LOGIN_REQUIRED_MESSAGE };

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("routines")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", routineId)
      .eq("user_id", userUuid)
      .select()
      .single();

    if (error) throw error;
    return { data: data as RoutineResult, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to update routine" };
  }
}

/**
 * 루틴 삭제
 */
export async function deleteRoutine(routineId: string): Promise<{ error: string | null }> {
  try {
    const userUuid = await getCurrentUserUuid();
    if (!userUuid) return { error: LOGIN_REQUIRED_MESSAGE };

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from("routines")
      .delete()
      .eq("id", routineId)
      .eq("user_id", userUuid);

    if (error) throw error;
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete routine" };
  }
}

/**
 * 루틴 복제
 */
export async function duplicateRoutine(routineId: string): Promise<{ data: RoutineResult | null; error: string | null }> {
  try {
    const userUuid = await getCurrentUserUuid();
    if (!userUuid) return { data: null, error: LOGIN_REQUIRED_MESSAGE };

    const supabase = getServiceRoleClient();

    // 1. 원본 루틴 가져오기
    const { data: original, error: fetchError } = await supabase
      .from("routines")
      .select("*")
      .eq("id", routineId)
      .eq("user_id", userUuid)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!original) return { data: null, error: "Routine not found" };

    // 2. 복제된 루틴 생성
    const { data: duplicated, error: insertError } = await supabase
      .from("routines")
      .insert({
        user_id: userUuid,
        title: `${original.title} (복사본)`,
        estimated_time: original.estimated_time,
        total_sets: original.total_sets,
        structure_json: original.structure_json,
        energy_system: original.energy_system,
        equipment_type: original.equipment_type,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return { data: duplicated as RoutineResult, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to duplicate routine" };
  }
}

/**
 * 즐겨찾기된 루틴 ID 조회
 */
export async function getFavoriteRoutineId(): Promise<{ data: string | null; error: string | null }> {
  try {
    const userUuid = await getCurrentUserUuid();
    if (!userUuid) return { data: null, error: LOGIN_REQUIRED_MESSAGE };

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from("users")
      .select("favorite_routine_id")
      .eq("id", userUuid)
      .single();

    if (error) throw error;
    return { data: data?.favorite_routine_id ?? null, error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : "Failed to get favorite" };
  }
}

/**
 * 즐겨찾기 설정/해제 (토글). 이미 즐겨찾기된 루틴을 다시 누르면 해제됨.
 * 다른 루틴을 누르면 기존 즐겨찾기가 자동 해제되고 새 루틴이 설정됨.
 */
export async function setFavoriteRoutine(
  routineId: string | null
): Promise<{ error: string | null }> {
  try {
    const userUuid = await getCurrentUserUuid();
    if (!userUuid) return { error: LOGIN_REQUIRED_MESSAGE };

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from("users")
      .update({ favorite_routine_id: routineId })
      .eq("id", userUuid);

    if (error) throw error;
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to set favorite" };
  }
}
