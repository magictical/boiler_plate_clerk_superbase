"use client";

/**
 * @file components/onboarding/GymCreator.tsx
 * @description 커스텀 암장 등록: 색상 추가, 드래그 앤 드롭으로 6단계 티어에 매핑
 * @see docs/design-refs/03_gym_create.html, docs/implementation-plans/2.3-on-02-create-gym.md
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { Plus, GripVertical, X, Shield, Award, Star, Gem, Trophy, Crown } from "lucide-react";
import type { TierLevel } from "@/lib/utils/tier";
import { TIER_LEVELS, TIER_NAMES, TIER_NAMES_KO, TIER_COLORS } from "@/lib/utils/tier";
import type { GymScaleInput } from "@/actions/gyms";
import { DEFAULT_GYM_COLORS } from "@/constants/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEFAULT_HEX = "#FF4B4B";

/** 기본 색상으로 ColorItem 배열 생성 (id 부여) */
function getInitialColors(): ColorItem[] {
  return DEFAULT_GYM_COLORS.map((c) => ({
    id: crypto.randomUUID(),
    color_hex: c.color_hex,
    color_name: c.color_name,
  }));
}

export interface ColorItem {
  id: string;
  color_hex: string;
  color_name?: string;
}

export interface GymCreatorProps {
  /** 부모가 저장용 scales 배열을 받음 */
  onChange?: (scales: GymScaleInput[]) => void;
}

function DraggableColorCircle({
  color,
  onRemove,
}: {
  color: ColorItem;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: color.id,
    data: { color_hex: color.color_hex, color_name: color.color_name ?? color.color_hex },
  });

  return (
    <div
      ref={setNodeRef}
      className={`relative shrink-0 w-14 h-14 rounded-full shadow-lg ring-2 ring-white/10 cursor-grab active:cursor-grabbing group ${isDragging ? "opacity-40" : ""}`}
      {...listeners}
      {...attributes}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color.color_hex }}
      />
      <button
        type="button"
        aria-label="색상 제거"
        className="absolute -top-0.5 -right-0.5 rounded-full bg-black/50 hover:bg-black p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(color.id);
        }}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

/** 티어에 할당된 색상 한 건 */
type AssignedColor = { id: string; color_hex: string };

/** 디자인 03_gym_create: 티어별 아이콘 (Material Symbols → lucide 대응) */
const TIER_ICONS: Record<TierLevel, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  1: Shield,   // verified_user
  2: Award,    // military_tech
  3: Star,     // hotel_class
  4: Gem,      // diamond
  5: Trophy,   // trophy
  6: Crown,    // workspace_premium
};

function TierDropZone({
  tier,
  assignedList,
  onUnassignOne,
  onAddClick,
}: {
  tier: TierLevel;
  assignedList: AssignedColor[];
  onUnassignOne: (colorId: string) => void;
  onAddClick: () => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `tier-${tier}`,
    data: { tier },
  });

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        ref={setNodeRef}
        className={`min-h-12 rounded-xl flex flex-wrap items-center justify-center gap-1.5 p-1.5 transition-all border-2 border-dashed flex-1 min-w-16 max-w-48 overflow-visible ${
          assignedList.length > 0
            ? "border-[#3a5555] bg-[#111818]/30 ring-1 ring-white/5"
            : "border-[#3a5555] bg-[#111818]/50"
        } ${isOver ? "border-[#1fe7f9] bg-[#1fe7f9]/10" : ""}`}
      >
        {assignedList.length === 0 ? (
          <GripVertical className="h-4 w-4 text-[#3a5555]" />
        ) : (
          assignedList.map((a) => (
            <div
              key={a.id}
              className="relative w-9 h-9 rounded-full ring-2 ring-white/10 shadow shrink-0 group"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: a.color_hex }}
              />
              <button
                type="button"
                aria-label="티어에서 제거"
                className="absolute -top-0.5 -right-0.5 rounded-full bg-black/50 hover:bg-black p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  onUnassignOne(a.id);
                }}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))
        )}
      </div>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="shrink-0 w-9 h-9 rounded-full border-[#3a5555] bg-[#111818]/50 text-[#1fe7f9] hover:bg-[#1fe7f9]/10 hover:border-[#1fe7f9]/50"
        onClick={onAddClick}
        aria-label="색상 추가"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function GymCreator({ onChange }: GymCreatorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addColorForTier, setAddColorForTier] = useState<TierLevel | null>(null);
  const [colors, setColors] = useState<ColorItem[]>(getInitialColors);
  const [tierAssignments, setTierAssignments] = useState<
    Record<TierLevel, AssignedColor[]>
  >({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });
  const [addColorHex, setAddColorHex] = useState(DEFAULT_HEX);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleAddColor = useCallback(() => {
    const hex = addColorHex.trim().startsWith("#") ? addColorHex.trim() : `#${addColorHex.trim()}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
    setColors((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        color_hex: hex,
        color_name: hex,
      },
    ]);
  }, [addColorHex]);

  const handleRemoveColor = useCallback((id: string) => {
    setColors((prev) => prev.filter((c) => c.id !== id));
    setTierAssignments((prev) => {
      const next = { ...prev };
      (TIER_LEVELS as TierLevel[]).forEach((t) => {
        next[t] = (next[t] ?? []).filter((a) => a.id !== id);
      });
      return next;
    });
  }, []);

  const handleUnassignOne = useCallback((tier: TierLevel, colorId: string) => {
    setTierAssignments((prev) => ({
      ...prev,
      [tier]: (prev[tier] ?? []).filter((a) => a.id !== colorId),
    }));
  }, []);

  const handleAddColorToTier = useCallback((tier: TierLevel, color: ColorItem) => {
    setTierAssignments((prev) => {
      const next = { ...prev };
      (TIER_LEVELS as TierLevel[]).forEach((t) => {
        next[t] = (next[t] ?? []).filter((a) => a.id !== color.id);
      });
      const list = next[tier] ?? [];
      if (!list.some((a) => a.id === color.id)) {
        next[tier] = [...list, { id: color.id, color_hex: color.color_hex }];
      }
      return next;
    });
    setAddColorForTier(null);
  }, []);
  const openAddColorDialog = useCallback((tier: TierLevel) => {
    setAddColorForTier(tier);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || typeof over.id !== "string" || !String(over.id).startsWith("tier-")) return;
    const tier = Number(over.id.replace("tier-", "")) as TierLevel;
    if (!Number.isInteger(tier) || tier < 1 || tier > 6) return;

    const colorId = String(active.id);
    const data = active.data.current as { color_hex?: string } | undefined;
    const color_hex = data?.color_hex ?? "#999999";
    const newEntry = { id: colorId, color_hex };

    setTierAssignments((prev) => {
      const next = { ...prev };
      (TIER_LEVELS as TierLevel[]).forEach((t) => {
        next[t] = (next[t] ?? []).filter((a) => a.id !== colorId);
      });
      if (!next[tier].some((a) => a.id === colorId)) {
        next[tier] = [...next[tier], newEntry];
      }
      return next;
    });
  }, []);

  // 부모에 scales 전달 (티어별 다수 색상 → sort_order 0, 1, 2...)
  useEffect(() => {
    const scales: GymScaleInput[] = [];
    (TIER_LEVELS as TierLevel[]).forEach((tier) => {
      const list = tierAssignments[tier] ?? [];
      list.forEach((assigned, index) => {
        const color = colors.find((c) => c.id === assigned.id);
        scales.push({
          color_name: color?.color_name ?? color?.color_hex ?? assigned.color_hex,
          color_hex: assigned.color_hex,
          tier_level: tier,
          sort_order: index,
        });
      });
    });
    onChange?.(scales);
  }, [tierAssignments, colors, onChange]);

  const activeColor = activeId ? colors.find((c) => c.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* 색상 생성 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-medium text-[#9bbbbb]">색상 생성</h3>
          <p className="text-xs text-[#5c7777]">드래그하여 티어에 매핑하세요</p>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2 px-1">
          <div className="flex shrink-0 items-center gap-2">
            <input
              type="color"
              value={addColorHex}
              onChange={(e) => setAddColorHex(e.target.value)}
              className="w-10 h-10 rounded-full border-0 cursor-pointer bg-transparent"
              aria-label="색상 선택"
            />
            <Input
              type="text"
              value={addColorHex}
              onChange={(e) => setAddColorHex(e.target.value)}
              placeholder="#FF4B4B"
              className="w-20 h-9 text-sm bg-[#162a2d] border-[#2a4043] text-white"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0 w-14 h-14 rounded-full border-2 border-dashed border-[#1fe7f9]/50 text-[#1fe7f9] hover:bg-[#1fe7f9]/10"
              onClick={handleAddColor}
              aria-label="색상 추가"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>
          {colors.map((color) => (
            <DraggableColorCircle
              key={color.id}
              color={color}
              onRemove={handleRemoveColor}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeColor ? (
          <div className="w-14 h-14 rounded-full shadow-xl ring-2 ring-white/20 cursor-grabbing flex items-center justify-center">
            <div
              className="w-full h-full rounded-full"
              style={{ backgroundColor: activeColor.color_hex }}
            />
          </div>
        ) : null}
      </DragOverlay>

      <div className="h-px bg-[#2A3F3F] my-4" />

      {/* 티어 매핑 리스트 (디자인 03_gym_create: 티어 아이콘 적용) */}
      <div className="flex flex-col space-y-3">
        {(TIER_LEVELS as TierLevel[]).map((tier) => {
          const TierIcon = TIER_ICONS[tier];
          const tierColor = TIER_COLORS[tier];
          const isGm = tier === 6;
          return (
            <div
              key={tier}
              className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-[#162a2d] border border-[#2A3F3F] shadow-sm hover:border-[#1fe7f9]/50 transition-all"
            >
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-[#111818] shadow-inner">
                  {isGm ? (
                    <span className="text-[28px] font-bold bg-clip-text text-transparent bg-linear-to-tr from-purple-400 to-pink-500">
                      GM
                    </span>
                  ) : (
                    <TierIcon
                      className="w-7 h-7"
                      style={{ color: tierColor }}
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={`text-base font-bold font-display ${isGm ? "bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-500" : "text-white"}`}
                  >
                    {TIER_NAMES_KO[tier]}
                  </span>
                  <span className="text-xs text-gray-400">{TIER_NAMES[tier]}</span>
                </div>
              </div>
              <TierDropZone
                tier={tier}
                assignedList={tierAssignments[tier] ?? []}
                onUnassignOne={(colorId) => handleUnassignOne(tier, colorId)}
                onAddClick={() => openAddColorDialog(tier)}
              />
            </div>
          );
        })}
      </div>

      {/* 티어에 색상 추가: 색상 리스트 선택 다이얼로그 */}
      <Dialog open={addColorForTier !== null} onOpenChange={(open) => !open && setAddColorForTier(null)}>
        <DialogContent className="bg-[#162a2d] border-[#2A3F3F] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#9bbbbb]">
              {addColorForTier != null ? `${TIER_NAMES_KO[addColorForTier]} 티어에 색상 추가` : ""}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[#5c7777] mb-3">색상을 클릭하면 이 티어에 추가됩니다.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {addColorForTier != null &&
              colors.map((color) => {
                const alreadyInTier = (tierAssignments[addColorForTier!] ?? []).some((a) => a.id === color.id);
                return (
                  <button
                    key={color.id}
                    type="button"
                    className={`w-12 h-12 rounded-full shadow-lg ring-2 transition-all ${alreadyInTier ? "ring-[#1fe7f9] opacity-80" : "ring-white/10 hover:ring-[#1fe7f9]"}`}
                    style={{ backgroundColor: color.color_hex }}
                    onClick={() => handleAddColorToTier(addColorForTier!, color)}
                    aria-label={color.color_name ?? color.color_hex}
                  />
                );
              })}
          </div>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
