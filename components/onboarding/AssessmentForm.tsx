"use client";

/**
 * @file components/onboarding/AssessmentForm.tsx
 * @description 온보딩 Step 3: 수행 능력 및 신체 스펙 측정. Phase 0 신체 스펙 → Phase 1 문답 → Phase 2 장비 선택 → Phase 3 입력/저장.
 * @see docs/implementation-plans/2.5-on-04-assessment.md
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Dumbbell, Grip, HelpCircle, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const KG_RANGE = { min: 0.1, max: 500 };
const CM_RANGE = { min: 50, max: 300 };

export type AssessmentPayload = {
  weight_kg?: number | null;
  height_cm?: number | null;
  reach_cm?: number | null;
  max_hang_1rm?: number | null;
  no_hang_lift_1rm?: number | null;
};

// Phase 0 Validation
const metricsSchema = z.object({
  weight_kg: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(KG_RANGE.min).max(KG_RANGE.max).optional()
  ),
  height_cm: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(CM_RANGE.min).max(CM_RANGE.max).optional()
  ),
  reach_cm: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z.number().min(CM_RANGE.min).max(CM_RANGE.max).optional()
  ),
});

type MetricsFormValues = z.infer<typeof metricsSchema>;

// Phase 3 Validation (Direct)
const directInputSchema = z
  .object({
    max_hang_1rm: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : Number(v)),
      z.number().min(KG_RANGE.min).max(KG_RANGE.max).optional()
    ),
    no_hang_lift_1rm: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : Number(v)),
      z.number().min(KG_RANGE.min).max(KG_RANGE.max).optional()
    ),
  })
  .refine(
    (data) =>
      (data.max_hang_1rm != null && data.max_hang_1rm >= KG_RANGE.min) ||
      (data.no_hang_lift_1rm != null && data.no_hang_lift_1rm >= KG_RANGE.min),
    { message: "Max Hang 또는 No Hang Lift 중 하나 이상 입력하세요." }
  );

type DirectInputValues = z.infer<typeof directInputSchema>;

// Phase 3 Validation (Single)
const singleValueSchema = z.object({
  value: z
    .number({ required_error: "값을 입력하세요" })
    .min(KG_RANGE.min, `${KG_RANGE.min}~${KG_RANGE.max} kg`)
    .max(KG_RANGE.max, `${KG_RANGE.min}~${KG_RANGE.max} kg`),
});

type SingleValueForm = z.infer<typeof singleValueSchema>;

type View =
  | "phase0_metrics"
  | "phase1"
  | "phase2"
  | "phase3_direct"
  | "phase3_hang"
  | "phase3_lift";

export type AssessmentFormProps = {
  onComplete: (payload: AssessmentPayload) => Promise<void>;
  isSubmitting?: boolean;
};

export function AssessmentForm({ onComplete, isSubmitting = false }: AssessmentFormProps) {
  const [view, setView] = useState<View>("phase0_metrics");
  const [metricsData, setMetricsData] = useState<MetricsFormValues>({});

  const metricsForm = useForm<MetricsFormValues>({
    resolver: zodResolver(metricsSchema) as import("react-hook-form").Resolver<MetricsFormValues, any>,
    defaultValues: { weight_kg: undefined, height_cm: undefined, reach_cm: undefined },
  });

  const directForm = useForm<DirectInputValues>({
    resolver: zodResolver(directInputSchema) as import("react-hook-form").Resolver<DirectInputValues, any>,
    defaultValues: { max_hang_1rm: undefined, no_hang_lift_1rm: undefined },
  });

  const hangForm = useForm<SingleValueForm>({
    resolver: zodResolver(singleValueSchema),
    defaultValues: { value: undefined },
  });

  const liftForm = useForm<SingleValueForm>({
    resolver: zodResolver(singleValueSchema),
    defaultValues: { value: undefined },
  });

  const handleMetricsNext = (values: MetricsFormValues) => {
    setMetricsData(values);
    setView("phase1");
  };

  const handlePhase1Yes = () => setView("phase3_direct");
  const handlePhase1No = () => setView("phase2");

  const handlePhase2Select = async (choice: "hangboard" | "loading_pin" | "none") => {
    if (choice === "hangboard") setView("phase3_hang");
    else if (choice === "loading_pin") setView("phase3_lift");
    else {
      // "없음" 선택 시 바로 진행
      await onComplete({
        ...metricsData,
        max_hang_1rm: null,
        no_hang_lift_1rm: null,
      });
    }
  };

  async function handleDirectSubmit(values: DirectInputValues) {
    await onComplete({
      ...metricsData,
      max_hang_1rm: values.max_hang_1rm ?? null,
      no_hang_lift_1rm: values.no_hang_lift_1rm ?? null,
    });
  }

  async function handleSingleHangSubmit(values: SingleValueForm) {
    await onComplete({
      ...metricsData,
      max_hang_1rm: values.value,
      no_hang_lift_1rm: null,
    });
  }

  async function handleSingleLiftSubmit(values: SingleValueForm) {
    await onComplete({
      ...metricsData,
      no_hang_lift_1rm: values.value,
      max_hang_1rm: null,
    });
  }

  const directValues = directForm.watch();
  const canSubmitDirect =
    (directValues.max_hang_1rm != null && directValues.max_hang_1rm >= KG_RANGE.min) ||
    (directValues.no_hang_lift_1rm != null && directValues.no_hang_lift_1rm >= KG_RANGE.min);

  return (
    <div className="flex flex-col gap-6">
      {/* Phase 0: 신체 스펙 (Metrics) */}
      {view === "phase0_metrics" && (
        <Form {...metricsForm}>
          <form
            onSubmit={metricsForm.handleSubmit(handleMetricsNext)}
            className="flex flex-col gap-4"
          >
            <div className="px-1 mb-2">
              <h2 className="text-lg font-semibold text-white mb-1">
                신체 스펙을 입력해주세요 (선택)
              </h2>
              <div className="flex items-start gap-2 mt-2 bg-[#1b2727] p-3 rounded-lg border border-[#1fe7f9]/20">
                <Info className="h-4 w-4 text-[#1fe7f9] mt-0.5 shrink-0" />
                <p className="text-xs text-gray-300">
                  체중을 입력하면 올바른 훈련 볼륨과 1RM 성장을 측정할 수 있습니다.
                  당장 입력하지 않아도 메인 화면이나 훈련 시작 직전에 추가할 수 있습니다.
                </p>
              </div>
            </div>

            <FormField
              control={metricsForm.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">체중 (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.1}
                      min={KG_RANGE.min}
                      max={KG_RANGE.max}
                      placeholder="예: 70"
                      className="bg-[#1b2727] border-[#2a4043] text-white placeholder:text-gray-500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={metricsForm.control}
              name="height_cm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">신장 (cm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.1}
                      min={CM_RANGE.min}
                      max={CM_RANGE.max}
                      placeholder="예: 175"
                      className="bg-[#1b2727] border-[#2a4043] text-white placeholder:text-gray-500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={metricsForm.control}
              name="reach_cm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">리치/윙스팬 (cm)</FormLabel>
                  <FormDescription className="text-xs text-gray-400">
                    양팔을 수평으로 벌렸을 때 손끝 간의 거리
                  </FormDescription>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.1}
                      min={CM_RANGE.min}
                      max={CM_RANGE.max}
                      placeholder="예: 180"
                      className="bg-[#1b2727] border-[#2a4043] text-white placeholder:text-gray-500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12 mt-4 rounded-xl bg-[#1fe7f9] text-[#0f2123] font-bold hover:bg-[#1fe7f9]/90"
            >
              다음으로
            </Button>
          </form>
        </Form>
      )}

      {/* Phase 1 */}
      {view === "phase1" && (
        <>
          <div className="px-1">
            <h2 className="text-lg font-semibold text-white mb-1">
              1RM 수치를 이미 알고 있나요?
            </h2>
            <p className="text-sm text-gray-400">
              Max Hang 또는 No Hang Lift 값을 알고 있다면 직접 입력할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={handlePhase1Yes}
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#1b2727] border-2 border-[#2a4043] text-white hover:border-[#1fe7f9] hover:bg-[#243434]"
            >
              네, 입력할게요
            </Button>
            <Button
              type="button"
              onClick={handlePhase1No}
              disabled={isSubmitting}
              variant="outline"
              className="w-full h-12 rounded-xl border-2 border-[#2a4043] text-gray-300 hover:border-[#1fe7f9] hover:bg-[#243434]"
            >
              아니요
            </Button>
          </div>
        </>
      )}

      {/* Phase 2: 장비 선택 */}
      {view === "phase2" && (
        <>
          <div className="px-1">
            <h2 className="text-lg font-semibold text-white mb-1">
              보유 장비를 선택해주세요
            </h2>
            <p className="text-sm text-gray-400">
              행보드(Max Hang), 로딩핀/블럭(Lift) 또는 없음 중 선택하세요.
            </p>
          </div>
          <div className="flex flex-col gap-3" role="group" aria-label="장비 선택">
            <button
              type="button"
              onClick={() => handlePhase2Select("hangboard")}
              disabled={isSubmitting}
              className="flex items-center gap-4 rounded-xl border-2 border-[#2a4043] bg-[#1b2727] p-4 text-left transition-all hover:border-[#1fe7f9] hover:bg-[#243434] disabled:opacity-50"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1fe7f9]/10 border border-[#1fe7f9]/30">
                <Grip className="h-6 w-6 text-[#1fe7f9]" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">행보드</p>
                <p className="text-gray-400 text-xs">Max Hang 측정</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handlePhase2Select("loading_pin")}
              disabled={isSubmitting}
              className="flex items-center gap-4 rounded-xl border-2 border-[#2a4043] bg-[#1b2727] p-4 text-left transition-all hover:border-[#1fe7f9] hover:bg-[#243434] disabled:opacity-50"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1fe7f9]/10 border border-[#1fe7f9]/30">
                <Dumbbell className="h-6 w-6 text-[#1fe7f9]" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">로딩핀 / 블럭</p>
                <p className="text-gray-400 text-xs">No Hang Lift 측정</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => handlePhase2Select("none")}
              disabled={isSubmitting}
              className="flex items-center gap-4 rounded-xl border-2 border-[#2a4043] bg-[#1b2727] p-4 text-left transition-all hover:border-[#1fe7f9] hover:bg-[#243434] disabled:opacity-50"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gray-500/10 border border-gray-500/30">
                <HelpCircle className="h-6 w-6 text-gray-400" aria-hidden />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold">없음 / 모름</p>
                <p className="text-gray-400 text-xs">선택하지 않고 완료하기</p>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Phase 3: 직접 입력 (Max Hang + No Hang Lift) */}
      {view === "phase3_direct" && (
        <Form {...directForm}>
          <form
            onSubmit={directForm.handleSubmit(handleDirectSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="px-1">
              <h2 className="text-lg font-semibold text-white mb-1">1RM 직접 입력</h2>
              <p className="text-sm text-gray-400">
                알고 있는 값만 입력해도 됩니다. (0.1~500 kg)
              </p>
            </div>
            <FormField
              control={directForm.control}
              name="max_hang_1rm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Max Hang (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.1}
                      min={KG_RANGE.min}
                      max={KG_RANGE.max}
                      placeholder="예: 45.5"
                      className="bg-[#1b2727] border-[#2a4043] text-white placeholder:text-gray-500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <FormField
              control={directForm.control}
              name="no_hang_lift_1rm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">No Hang Lift (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.1}
                      min={KG_RANGE.min}
                      max={KG_RANGE.max}
                      placeholder="예: 60"
                      className="bg-[#1b2727] border-[#2a4043] text-white placeholder:text-gray-500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            {directForm.formState.errors.root?.message && (
              <p className="text-sm text-red-400" role="alert">
                {directForm.formState.errors.root.message}
              </p>
            )}
            <Button
              type="submit"
              disabled={!canSubmitDirect || isSubmitting}
              className="w-full h-12 rounded-xl bg-[#1fe7f9] text-[#0f2123] font-bold hover:bg-[#1fe7f9]/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                "저장하고 시작하기"
              )}
            </Button>
          </form>
        </Form>
      )}

      {/* Phase 3: 행보드 선택 → Max Hang 입력 (MVP: 측정 대신 입력) */}
      {view === "phase3_hang" && (
        <Form {...hangForm}>
          <form
            onSubmit={hangForm.handleSubmit(handleSingleHangSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="px-1">
              <h2 className="text-lg font-semibold text-white mb-1">Max Hang (kg)</h2>
              <p className="text-sm text-gray-400">
                행보드 Max Hang 1RM 값을 입력하세요. (0.1~500 kg)
              </p>
            </div>
            <FormField
              control={hangForm.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Max Hang 1RM (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.1}
                      min={KG_RANGE.min}
                      max={KG_RANGE.max}
                      placeholder="예: 45.5"
                      className="bg-[#1b2727] border-[#2a4043] text-white placeholder:text-gray-500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : e.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#1fe7f9] text-[#0f2123] font-bold hover:bg-[#1fe7f9]/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                "저장하고 시작하기"
              )}
            </Button>
          </form>
        </Form>
      )}

      {/* Phase 3: 로딩핀 선택 → No Hang Lift 입력 */}
      {view === "phase3_lift" && (
        <Form {...liftForm}>
          <form
            onSubmit={liftForm.handleSubmit(handleSingleLiftSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="px-1">
              <h2 className="text-lg font-semibold text-white mb-1">No Hang Lift (kg)</h2>
              <p className="text-sm text-gray-400">
                로딩핀/블럭 No Hang Lift 1RM 값을 입력하세요. (0.1~500 kg)
              </p>
            </div>
            <FormField
              control={liftForm.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">No Hang Lift 1RM (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step={0.1}
                      min={KG_RANGE.min}
                      max={KG_RANGE.max}
                      placeholder="예: 60"
                      className="bg-[#1b2727] border-[#2a4043] text-white placeholder:text-gray-500"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : e.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#1fe7f9] text-[#0f2123] font-bold hover:bg-[#1fe7f9]/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : (
                "저장하고 시작하기"
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
