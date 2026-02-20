"use server";

import { auth } from "@clerk/nextjs/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import {
  generateRoutineContent,
  buildRoutinePrompt,
  type RoutinePromptContext,
} from "@/lib/ai/gemini";
import type { RoutineBlock } from "@/types/database";

export type AIResponse = {
  message: string;
  routine?: RoutineBlock[];
  error?: string;
};

/**
 * Gemini API를 호출하여 루틴을 생성합니다.
 * 사용자 컨텍스트(티어, 체중, 최근 기록)를 자동으로 주입합니다.
 */
export async function generateRoutineAction(
  userMessage: string
): Promise<AIResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { message: "", error: "로그인이 필요합니다." };
    }

    const supabase = getServiceRoleClient();

    // 1. 사용자 컨텍스트 조회 (티어, 체중)
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("current_tier, weight_kg")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (userError) {
      console.error("Error fetching user context:", userError);
      return { message: "", error: "사용자 정보를 불러오는데 실패했습니다." };
    }

    // 2. 최근 훈련 기록 조회 (MVP: Placeholder)
    // 추후 training_logs 테이블에서 최근 3개 세션 요약 등을 가져올 수 있음
    const recentSummary = "No recent training logs available.";

    // 3. 프롬프트 구성
    const context: RoutinePromptContext = {
      tier: userRow?.current_tier ?? undefined,
      weightKg: userRow?.weight_kg ?? undefined,
      recentSummary: `${recentSummary}\nUser Request: ${userMessage}`,
    };

    const prompt = buildRoutinePrompt(context);

    // 4. Gemini API 호출
    const routineBlocks = await generateRoutineContent(prompt);

    // 5. 응답 메시지 생성 (간단한 안내)
    // 실제로는 Gemini가 메시지와 JSON을 분리해서 주면 좋겠지만,
    // 현재 구조는 JSON만 받으므로 고정 메시지 또는 간단한 로직으로 메시지 생성
    const message = `요청하신 내용("${userMessage}")을 바탕으로 루틴을 생성했습니다.`;

    return {
      message,
      routine: routineBlocks,
    };
  } catch (e) {
    console.error("generateRoutineAction error:", e);
    const errorMessage =
      e instanceof Error ? e.message : "AI 루틴 생성 중 오류가 발생했습니다.";
    return { message: "", error: errorMessage };
  }
}
