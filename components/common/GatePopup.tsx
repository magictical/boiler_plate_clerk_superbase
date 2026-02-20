"use client";

/**
 * @file components/common/GatePopup.tsx
 * @description Guest 사용자가 AI/루틴 기능 접근 시 표시하는 "프로필을 완성해주세요" 팝업.
 * @see docs/TODO.md 3.1 HM-01, docs/implementation-plans/3.1-hm-01-guest-home.md
 */

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ONBOARDING_GYM_SELECT_PATH = "/onboarding/gym-select";

export type GatePopupProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel?: () => void;
};

export function GatePopup({ open, onOpenChange, onCancel }: GatePopupProps) {
  const router = useRouter();

  const handleConfirm = () => {
    onOpenChange(false);
    router.push(ONBOARDING_GYM_SELECT_PATH);
  };

  const handleCancel = () => {
    onOpenChange(false);
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>프로필을 완성해주세요</DialogTitle>
          <DialogDescription>
            정확한 AI 코칭과 루틴 추천을 받으려면 홈짐 선택과 티어 설정이
            필요합니다. 지금 설정을 완료할까요?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button type="button" onClick={handleConfirm}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
