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

import type { RoutineBlock } from "@/types/database";
import { z } from "zod";

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
    `You are an expert rock climbing and hangboard training coach. Your task is to generate a JSON routine for a climbing athlete.

The routine must be a JSON array of 'blocks'. Each block must follow this EXACT schema:

1. Exercise Block (for actual exercises - hangboard hangs, pull-ups, no-hang lifts, etc.):
   {
     "id": "<unique string like ex_1>",
     "type": "exercise",
     "title": "<exercise name in Korean, e.g. 풀업, 10초 max hang, 노행 리프트>",
     "duration": <duration in SECONDS as a number>,
     "reps": <number of reps, ONLY if it is a rep-based exercise, otherwise omit>,
     "color": "<a hex color like #f44336 or #e91e63>"
   }

2. Rest Block (for rest periods only):
   {
     "id": "<unique string like rest_1>",
     "type": "rest",
     "duration": <duration in SECONDS as a number>
   }

3. Loop Block (for repeating circuits or sets):
   {
     "id": "<unique string like loop_1>",
     "type": "loop",
     "repeat": <number of times to repeat>,
     "children": [<array of exercise and rest blocks>]
   }

IMPORTANT RULES:
- ONLY use type values: "exercise", "rest", "loop". NO OTHER TYPES.
- Use Korean names for exercises. Examples: 풀업, 노행 리프트, 핑거 행, 10초 max hang, 3손가락 오픈핸드 hang, 오프셋 행, 사이드 레버
- All "duration" fields must be in SECONDS (not minutes).
- Generate realistic climbing training: warmup exercises → main sets (in a loop) → cooldown.
- Include short rest periods between exercises.
- Make the workout appropriate for the user tier (1=beginner, 6=elite).`,
  ];

  if (tier != null) {
    parts.push(`User tier level (1=beginner to 6=elite): ${tier}.`);
  }
  if (weightKg != null) {
    parts.push(`User bodyweight: ${weightKg}kg.`);
  }
  if (recentSummary && recentSummary.trim()) {
    parts.push(`Context and user request: ${recentSummary.trim()}`);
  }

  parts.push(
    `Reply with ONLY a valid JSON array. No markdown, no explanation. Example structure:
[{"id":"ex_warmup","type":"exercise","title":"가벼운 스트레칭","duration":120,"color":"#4caf50"},{"id":"loop_1","type":"loop","repeat":4,"children":[{"id":"ex_1","type":"exercise","title":"10초 max hang","duration":10,"color":"#f44336"},{"id":"rest_1","type":"rest","duration":50}]},{"id":"ex_cooldown","type":"exercise","title":"쿨다운 스트레칭","duration":180,"color":"#2196f3"}]`
  );

  return parts.join("\n");
}

/** 재귀적 루틴 블록 스키마 (zod) - 실제 RoutineBlock 타입에 맞게 업데이트 */
const routineBlockSchema = z.lazy(() =>
  z
    .object({
      id: z.string().optional(),
      type: z.enum(["exercise", "rest", "loop"]),
      title: z.string().optional(),
      duration: z.number().optional(),
      durationSeconds: z.number().optional(), // backward compat
      reps: z.number().optional(),
      repeat: z.number().optional(),
      repeatCount: z.number().optional(), // backward compat
      color: z.string().optional(),
      children: z.array(routineBlockSchema).optional(),
    })
    .passthrough(),
) as z.ZodType<RoutineBlock>;

const routineResponseSchema = z.array(routineBlockSchema);

/**
 * Gemini 응답 텍스트에서 JSON 배열 파싱 후 검증
 * 또한 AI가 id를 누락할 경우 자동으로 생성해줌
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

  // 자동으로 id 생성, durationSeconds -> duration 변환
  let counter = 0;
  function normalizeBlock(block: RoutineBlock): RoutineBlock {
    const id = (block as { id?: string }).id || `block_${++counter}_${Date.now()}`;
    const baseBlock = { ...block, id } as { id: string; type: string; duration?: number; durationSeconds?: number; repeatCount?: number; repeat?: number; children?: RoutineBlock[] };

    // durationSeconds -> duration (호환성)
    if (!baseBlock.duration && baseBlock.durationSeconds) {
      baseBlock.duration = baseBlock.durationSeconds;
    }
    // repeatCount -> repeat (호환성)
    if (!baseBlock.repeat && baseBlock.repeatCount) {
      baseBlock.repeat = baseBlock.repeatCount;
    }
    // loop 자식복 정규화
    if (baseBlock.type === "loop" && baseBlock.children) {
      return { ...baseBlock, children: baseBlock.children.map(normalizeBlock) } as RoutineBlock;
    }
    return baseBlock as RoutineBlock;
  }

  return result.data.map(normalizeBlock);
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
