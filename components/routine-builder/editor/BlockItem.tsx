"use client";

import { cn } from "@/lib/utils";
import { RoutineBlock } from "@/types/routine";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Repeat, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useRoutineEditor } from "./RoutineEditorContext";

const EXERCISE_COLORS = ["#ff0909ff", "#ff0095ff", "#ff9800", "#ffeb3b"];
const REST_COLORS = ["#4caf50", "#03a9f4"];
const LOOP_COLORS = ["#673ab7", "#3f51b5"];

function PresetColorPicker({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (color: string) => void;
  presets: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-4 h-4 rounded-full border border-white/30 shadow-sm"
        style={{ backgroundColor: value }}
      />
      {isOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-[#2a3636] border border-white/10 rounded-xl p-3 shadow-2xl flex gap-3">
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange(color);
                setIsOpen(false);
              }}
              className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BlockItemProps {
  block: RoutineBlock;
  parentId?: string;
  children?: React.ReactNode;
}

export function BlockItem({ block, parentId, children }: BlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: block.id,
    data: { parentId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const { dispatch } = useRoutineEditor();

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: "REMOVE_BLOCK", payload: { id: block.id } });
  };

  if (block.type === "exercise") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative bg-[#1d2626] rounded-xl border border-white/5 flex items-stretch min-h-[64px] shadow-md hover:border-gray-600 transition-colors mb-3",
          isDragging && "border-primary/50 shadow-neon-box"
        )}
      >
        <div
          className="touch-none w-10 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-100 border-r border-white/5"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </div>
        <div
          className="w-1.5 h-full flex-shrink-0"
          style={{ backgroundColor: block.color || "#ff0909ff", boxShadow: `0 0 10px ${block.color || "#ff0909ff"}80` }}
        />
        <div className="flex-1 flex items-center justify-between px-4 pl-3 gap-3">
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                value={block.title}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_BLOCK",
                    payload: { id: block.id, updates: { title: e.target.value } },
                  })
                }
                className="font-bold text-gray-100 text-base bg-transparent border-none outline-none focus:ring-0 w-full p-0"
                placeholder="운동 이름"
              />
              <PresetColorPicker
                value={block.color || EXERCISE_COLORS[0]}
                onChange={(color) =>
                  dispatch({
                    type: "UPDATE_BLOCK",
                    payload: { id: block.id, updates: { color } },
                  })
                }
                presets={EXERCISE_COLORS}
              />
            </div>
            <span
              className="text-[10px] font-mono tracking-wider"
              style={{ color: block.color || "#ff0909ff" }}
            >
              EXERCISE
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 세부 파라미터 영역 */}
            <div className="flex gap-2 mr-2">
              {block.requiredFields?.includes("edgeSize") && (
                <div className="flex flex-col items-center justify-center max-w-[130px] pr-2 mr-2 border-r border-white/10">
                  {block.allowedEdges && block.allowedEdges.length > 0 ? (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar snap-x py-1 pl-1 w-full mask-edges">
                      {block.allowedEdges.map((size) => {
                        const isSelected = block.edgeSize === size;
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { edgeSize: size } } });
                            }}
                            className={cn(
                              "shrink-0 snap-center px-3 py-1.5 rounded-[10px] text-[12px] font-mono font-bold transition-all",
                              isSelected
                                ? "bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.4),0_0_10px_rgba(255,255,255,0.15)]"
                                : "bg-black/30 text-gray-500 hover:bg-white/10 hover:text-gray-300"
                            )}
                          >
                            {size}
                            <span className="text-[9px] ml-0.5 opacity-60">mm</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <input
                        type="number"
                        min={1} max={99}
                        value={block.edgeSize ?? ""}
                        placeholder="엣지"
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { edgeSize: Number.isNaN(v) ? undefined : v } } });
                        }}
                        className="w-10 bg-black/20 px-1 text-center py-1 rounded-md border border-white/5 text-gray-200 text-[11px] font-mono font-bold appearance-none m-0 focus:ring-1 focus:ring-white/20 outline-none"
                        style={{ MozAppearance: "textfield" }}
                      />
                      <span className="text-[9px] text-gray-500 mt-0.5">mm</span>
                    </div>
                  )}
                </div>
              )}
              {block.requiredFields?.includes("weight") && (
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min={-99} max={999}
                    value={block.weight ?? ""}
                    placeholder="+0"
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { weight: Number.isNaN(v) ? undefined : v } } });
                    }}
                    className="w-12 bg-black/20 px-1 text-center py-1 rounded-md border border-[#06e0ce]/30 text-[#06e0ce] text-[12px] font-mono font-bold appearance-none m-0 focus:ring-1 focus:ring-[#06e0ce]/50 outline-none"
                    style={{ MozAppearance: "textfield" }}
                  />
                  <span className="text-[9px] text-[#06e0ce]/70 mt-0.5 font-bold">추가(kg)</span>
                </div>
              )}
              {block.requiredFields?.includes("reps") && (
                <div className="flex flex-col items-center">
                  <input
                    type="number"
                    min={1} max={999}
                    value={block.reps ?? ""}
                    placeholder="횟수"
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { reps: Number.isNaN(v) ? undefined : Math.max(1, v) } } });
                    }}
                    className="w-10 bg-black/20 px-1 text-center py-1 rounded-md border border-white/5 text-[#f97316] text-[11px] font-mono font-bold appearance-none m-0 focus:ring-1 focus:ring-[#f97316]/30 outline-none"
                    style={{ MozAppearance: "textfield" }}
                  />
                  <span className="text-[9px] text-gray-500 mt-0.5">회</span>
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-white/10 mx-px" />

            <div className="flex flex-col items-center">
              <input
                type="number"
                min={1} max={999}
                value={block.duration}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v) && v >= 1)
                    dispatch({
                      type: "UPDATE_BLOCK",
                      payload: { id: block.id, updates: { duration: v } },
                    });
                }}
                className="w-12 bg-black/20 px-1 text-center py-1 rounded-md border border-white/5 text-gray-200 text-sm font-mono font-bold appearance-none m-0 focus:ring-1 focus:ring-white/20 outline-none"
                style={{ MozAppearance: "textfield" }}
              />
              <span className="text-[9px] text-gray-300 mt-0.5">초</span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "rest") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group relative bg-[#1d2626] rounded-xl border border-white/5 flex items-stretch min-h-[64px] shadow-md hover:border-gray-600 transition-colors mb-3",
          isDragging && "border-accent-green/50 shadow-[0_0_10px_rgba(0,230,118,0.3)]"
        )}
      >
        <div
          className="touch-none w-10 shrink-0 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-100 border-r border-white/5"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </div>
        <div
          className="w-1.5 h-full flex-shrink-0"
          style={{ backgroundColor: block.color || "#4caf50", boxShadow: `0 0 10px ${block.color || "#4caf50"}80` }}
        />
        <div className="flex-1 flex items-center justify-between px-4 pl-3 gap-3">
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <input
                value={block.title || "휴식"}
                onChange={(e) =>
                  dispatch({
                    type: "UPDATE_BLOCK",
                    payload: { id: block.id, updates: { title: e.target.value } },
                  })
                }
                className="font-bold text-gray-100 text-base bg-transparent border-none outline-none focus:ring-0 w-full p-0"
                placeholder="휴식"
              />
              <PresetColorPicker
                value={block.color || REST_COLORS[0]}
                onChange={(color) =>
                  dispatch({
                    type: "UPDATE_BLOCK",
                    payload: { id: block.id, updates: { color } },
                  })
                }
                presets={REST_COLORS}
              />
            </div>
            <span
              className="text-[10px] font-mono tracking-wider"
              style={{ color: block.color || "#4caf50" }}
            >
              RECOVERY
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              type="number"
              min={1}
              max={999}
              value={block.duration}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v) && v >= 1)
                  dispatch({
                    type: "UPDATE_BLOCK",
                    payload: { id: block.id, updates: { duration: v } },
                  });
              }}
              className="w-14 bg-black/20 px-2 py-1 rounded-md border border-white/5 text-gray-200 text-sm font-mono font-bold text-right"
            />
            <span className="text-[10px] text-gray-300">초</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded hover:bg-white/5"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (block.type === "loop") {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, borderColor: block.color || "#673ab7" }}
        className={cn(
          "border rounded-xl bg-[#1d2626]/40 shadow-neon-box relative mb-3",
          isDragging && "opacity-50"
        )}
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none z-0">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <Repeat style={{ color: block.color || "#673ab7" }} className="w-16 h-16" />
          </div>
        </div>
        <div className="bg-[#1d2626]/80 border-b border-white/10 px-4 py-3 flex items-center justify-between backdrop-blur-sm relative z-10 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div
              className="touch-none cursor-grab active:cursor-grabbing p-1 rounded"
              style={{ color: block.color || "#673ab7" }}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={18} />
            </div>
            <Repeat style={{ color: block.color || "#673ab7" }} className="w-5 h-5 flex-shrink-0" />
            <input
              value={block.title || "세트 그룹"}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_BLOCK",
                  payload: { id: block.id, updates: { title: e.target.value } },
                })
              }
              className="text-sm font-bold bg-transparent border-none outline-none focus:ring-0 p-0 w-24"
              style={{ color: block.color || "#673ab7" }}
              placeholder="세트 그룹"
            />
            <div className="flex items-center gap-1 bg-black/30 rounded-md px-1 py-0.5 border border-white/10 shrink-0">
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "UPDATE_BLOCK",
                    payload: { id: block.id, updates: { repeat: Math.max(1, block.repeat - 1) } },
                  })
                }
                className="text-gray-400 hover:text-white px-1"
              >
                -
              </button>
              <span className="text-sm font-bold text-gray-200 w-4 text-center">
                {block.repeat}
              </span>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: "UPDATE_BLOCK",
                    payload: { id: block.id, updates: { repeat: block.repeat + 1 } },
                  })
                }
                className="text-gray-400 hover:text-white px-1"
              >
                +
              </button>
            </div>
            <span className="text-[12px] font-bold text-gray-400 shrink-0">회 반복</span>
            <PresetColorPicker
              value={block.color || LOOP_COLORS[0]}
              onChange={(color) =>
                dispatch({
                  type: "UPDATE_BLOCK",
                  payload: { id: block.id, updates: { color } },
                })
              }
              presets={LOOP_COLORS}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-gray-300 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-3 loop-children-container">
          {children}
        </div>
      </div>
    );
  }

  return null;
}
