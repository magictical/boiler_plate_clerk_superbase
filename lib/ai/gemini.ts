/**
 * @file lib/ai/gemini.ts
 * @description Gemini API 클라이언트 (루틴 생성용, 서버 전용)
 *
 * - API 키 검증 및 fetch 기반 generateContent
 * - 프롬프트 템플릿 (티어, 체중, 최근 훈련 요약)
 * - 응답 JSON을 zod로 검증 후 RoutineBlock[] 반환
 *
 * @see docs/implementation-plans/1.4-common-utils.md, docs/TODO.md 4.2 RB-02
 */

import { z } from "zod";
import type { RoutineBlock } from "@/types/database";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-2.5-flash";

/** 루틴 생성 컨텍스트 */
export interface RoutinePromptContext {
  tier?: number;
  weightKg?: number;
  recentSummary?: string;
}

/**
 * GEMINI_API_KEY 반환. 없으면 throw (서버 전용).
 */
function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env file for AI routine generation.",
    );
  }
  return key.trim();
}

/**
 * 루틴 생성용 프롬프트 문자열 생성
 */
export function buildRoutinePrompt(context: RoutinePromptContext): string {
  const { tier, weightKg, recentSummary } = context;
  const parts: string[] = [
    "You are a climbing training coach. Generate a single routine as a JSON array of blocks.",
    "Each block must have: type (string), and optionally: durationSeconds (number), repeatCount (number), children (nested blocks).",
    "Use block types like: 'exercise', 'rest', 'set', 'warmup', 'cooldown'.",
  ];
  if (tier != null) {
    parts.push(`User tier (1-6): ${tier}.`);
  }
  if (weightKg != null) {
    parts.push(`User weight (kg): ${weightKg}.`);
  }
  if (recentSummary && recentSummary.trim()) {
    parts.push(`Recent training summary: ${recentSummary.trim()}`);
  }
  parts.push(
    "Reply with ONLY a valid JSON array, no markdown or explanation. Example: [{\"type\":\"warmup\",\"durationSeconds\":300},{\"type\":\"set\",\"repeatCount\":3,\"children\":[{\"type\":\"exercise\",\"durationSeconds\":40}]}]",
  );
  return parts.join("\n");
}

/** 재귀적 루틴 블록 스키마 (zod) */
const routineBlockSchema = z.lazy(() =>
  z
    .object({
      type: z.string(),
      children: z.array(routineBlockSchema).optional(),
      durationSeconds: z.number().optional(),
      duration_seconds: z.number().optional(),
      repeatCount: z.number().optional(),
      repeat_count: z.number().optional(),
      reps: z.number().optional(),
    })
    .passthrough(),
) as z.ZodType<RoutineBlock>;

const routineResponseSchema = z.array(routineBlockSchema);

/**
 * Gemini 응답 텍스트에서 JSON 배열 파싱 후 검증
 */
export function parseRoutineResponse(text: string): RoutineBlock[] {
  let raw = text.trim();
  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    raw = codeBlockMatch[1].trim();
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "Gemini response is not valid JSON. Raw preview: " + raw.slice(0, 200),
    );
  }
  const result = routineResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "Gemini routine JSON failed validation: " + result.error.message,
    );
  }
  return result.data;
}

/**
 * Gemini API 호출 (generateContent). 서버 전용.
 * @returns 파싱·검증된 RoutineBlock[] (실패 시 throw)
 */
export async function generateRoutineContent(
  prompt: string,
  model: string = DEFAULT_MODEL,
): Promise<RoutineBlock[]> {
  const apiKey = getApiKey();
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Gemini API error (${res.status}): ${body.slice(0, 500)}`,
    );
  }
  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    (() => {
      throw new Error("Gemini response has no text content.");
    })();
  return parseRoutineResponse(text);
}
