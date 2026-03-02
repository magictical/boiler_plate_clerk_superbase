"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Scale } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateAssessment } from "@/actions/profiles";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const weightSchema = z.object({
  weight_kg: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : Number(v)),
    z
      .number({ required_error: "체중을 입력해주세요." })
      .min(20, "20kg 이상 입력가능합니다.")
      .max(300, "300kg 이하로 입력가능합니다.")
  ),
});

type WeightFormValues = z.infer<typeof weightSchema>;

interface MissingWeightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function MissingWeightModal({
  open,
  onOpenChange,
  onSuccess,
  title = "신체 스펙 입력이 필요합니다",
  description = "정확한 훈련 볼륨(Volume) 계산 및 성장을 분석하기 위해 체중 데이터가 필요합니다.",
}: MissingWeightModalProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<WeightFormValues>({
    resolver: zodResolver(weightSchema) as import("react-hook-form").Resolver<WeightFormValues, any>,
    defaultValues: { weight_kg: undefined },
  });

  async function onSubmit(values: WeightFormValues) {
    if (!values.weight_kg) return;

    setSubmitting(true);
    const { error } = await updateAssessment({ weight_kg: values.weight_kg });
    setSubmitting(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success("체중이 저장되었습니다.");
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md bg-[#0f2123] text-white border-[#2a4043] gap-6">
        <DialogHeader className="gap-2 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1fe7f9]/10 mb-2">
            <Scale className="h-6 w-6 text-[#1fe7f9]" aria-hidden />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        step={0.1}
                        placeholder="체중을 입력하세요"
                        className="bg-[#1b2727] border-[#2a4043] text-white placeholder:text-gray-500 h-14 pl-4 pr-12 text-lg rounded-xl"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? undefined : e.target.valueAsNumber
                          )
                        }
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                        kg
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400 pl-1" />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#1fe7f9] text-[#0f2123] font-bold hover:bg-[#1fe7f9]/90 text-base"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" aria-hidden />
                ) : (
                  "저장 후 계속하기"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => onOpenChange(false)}
                className="w-full h-12 rounded-xl border-2 border-[#2a4043] bg-transparent text-gray-300 hover:bg-[#1b2727] hover:text-white hover:border-[#2a4043]"
              >
                나중에 하기
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
