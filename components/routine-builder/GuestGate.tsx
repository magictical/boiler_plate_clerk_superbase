"use client";

/**
 * @file components/routine-builder/GuestGate.tsx
 * @description Guest 사용자가 루틴 빌더 접근 시 표시하는 차단 컴포넌트.
 * GatePopup을 띄우고, 닫히면(취소 시) 이전 페이지로 이동합니다.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GatePopup } from "@/components/common/GatePopup";

export function GuestGate() {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 팝업이 닫히면(취소/배경클릭) 이전 페이지로 이동
    if (!open) {
      router.back();
    }
  }, [open, router]);

  return <GatePopup open={open} onOpenChange={setOpen} />;
}
