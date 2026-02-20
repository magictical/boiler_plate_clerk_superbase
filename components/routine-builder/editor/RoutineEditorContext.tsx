"use client";

import { calculateRoutineStats } from "@/lib/utils/routine-calc";
import type { LoopBlock, RoutineBlock, RoutineStats } from "@/types/routine";
import { arrayMove } from "@dnd-kit/sortable";
import React, { createContext, ReactNode, useContext, useReducer } from "react";

interface RoutineEditorState {
  blocks: RoutineBlock[];
  stats: RoutineStats;
}

type Action =
  | { type: "ADD_BLOCK"; payload: { block: RoutineBlock; parentId?: string } }
  | { type: "UPDATE_BLOCK"; payload: { id: string; updates: Partial<RoutineBlock> } }
  | { type: "REMOVE_BLOCK"; payload: { id: string } }
  | { type: "MOVE_BLOCK"; payload: { activeId: string; overId: string } }
  | { type: "SET_BLOCKS"; payload: { blocks: RoutineBlock[] } }
  | {
      type: "MOVE_BLOCK_TO_CONTAINER";
      payload: {
        blockId: string;
        fromParentId: string | undefined;
        toParentId: string | undefined;
        toIndex: number;
      };
    };

const initialState: RoutineEditorState = {
  blocks: [],
  stats: {
    totalDuration: 0,
    totalSets: 0,
    tut: 0,
    totalExercises: 0,
  },
};

// Helper: 재귀적으로 블록 찾기 및 업데이트
function updateBlockRecursive(
  blocks: RoutineBlock[],
  id: string,
  updates: Partial<RoutineBlock>
): RoutineBlock[] {
  return blocks.map((block) => {
    if (block.id === id) {
      return { ...block, ...updates } as RoutineBlock;
    }
    if (block.type === "loop" && block.children) {
      return {
        ...block,
        children: updateBlockRecursive(block.children, id, updates),
      };
    }
    return block;
  });
}

// Helper: 재귀적으로 블록 삭제
function removeBlockRecursive(blocks: RoutineBlock[], id: string): RoutineBlock[] {
  return blocks
    .filter((block) => block.id !== id)
    .map((block) => {
      if (block.type === "loop" && block.children) {
        return {
          ...block,
          children: removeBlockRecursive(block.children, id),
        };
      }
      return block;
    });
}

// Helper: 재귀적으로 블록 추가 (parentId가 없으면 최상위에 추가)
function addBlockRecursive(
  blocks: RoutineBlock[],
  parentId: string | undefined,
  newBlock: RoutineBlock
): RoutineBlock[] {
  if (!parentId) {
    return [...blocks, newBlock];
  }
  return blocks.map((block) => {
    if (block.id === parentId && block.type === "loop") {
      return {
        ...block,
        children: [...(block.children || []), newBlock],
      };
    }
    if (block.type === "loop" && block.children) {
      return {
        ...block,
        children: addBlockRecursive(block.children, parentId, newBlock),
      };
    }
    return block;
  });
}

// Helper: 1차원 배열에서의 이동 (같은 레벨)
function moveBlockInList(
  blocks: RoutineBlock[],
  activeId: string,
  overId: string
): RoutineBlock[] {
  const activeIndex = blocks.findIndex((b) => b.id === activeId);
  const overIndex = blocks.findIndex((b) => b.id === overId);
  if (activeIndex === -1 || overIndex === -1) return blocks;
  return arrayMove(blocks, activeIndex, overIndex);
}

// Helper: 블록 한 개 찾기 (root 또는 loop children)
function findBlockById(
  blocks: RoutineBlock[],
  id: string,
  parentId?: string
): { block: RoutineBlock; parentId: string | undefined; index: number } | null {
  const idx = blocks.findIndex((b) => b.id === id);
  if (idx !== -1) return { block: blocks[idx], parentId, index: idx };
  for (const b of blocks) {
    if (b.type === "loop" && b.children?.length) {
      const found = findBlockById(b.children, id, b.id);
      if (found) return found;
    }
  }
  return null;
}

// Helper: 블록 제거 후 새 트리 반환
function removeBlockFromTree(
  blocks: RoutineBlock[],
  blockId: string,
  parentId: string | undefined
): RoutineBlock[] {
  if (parentId == null) {
    return blocks.filter((b) => b.id !== blockId).map((b) => {
      if (b.type === "loop" && b.children?.length)
        return { ...b, children: removeBlockFromTree(b.children, blockId, undefined) };
      return b;
    });
  }
  return blocks.map((b) => {
    if (b.type === "loop" && b.id === parentId)
      return { ...b, children: b.children.filter((c) => c.id !== blockId) };
    if (b.type === "loop" && b.children?.length)
      return { ...b, children: removeBlockFromTree(b.children, blockId, parentId) };
    return b;
  });
}

// Helper: 블록을 특정 위치에 삽입
function insertBlockAt(
  blocks: RoutineBlock[],
  block: RoutineBlock,
  parentId: string | undefined,
  atIndex: number
): RoutineBlock[] {
  if (parentId == null) {
    const next = [...blocks];
    next.splice(atIndex, 0, block);
    return next;
  }
  return blocks.map((b) => {
    if (b.type === "loop" && b.id === parentId) {
      const children = [...(b.children || [])];
      children.splice(atIndex, 0, block);
      return { ...b, children };
    }
    if (b.type === "loop" && b.children?.length)
      return { ...b, children: insertBlockAt(b.children, block, parentId, atIndex) };
    return b;
  });
}

function reducer(state: RoutineEditorState, action: Action): RoutineEditorState {
  let newBlocks: RoutineBlock[];

  switch (action.type) {
    case "ADD_BLOCK":
      newBlocks = addBlockRecursive(state.blocks, action.payload.parentId, action.payload.block);
      break;
    case "UPDATE_BLOCK":
      newBlocks = updateBlockRecursive(state.blocks, action.payload.id, action.payload.updates);
      break;
    case "REMOVE_BLOCK":
      newBlocks = removeBlockRecursive(state.blocks, action.payload.id);
      break;
    case "MOVE_BLOCK": {
      const { activeId, overId } = action.payload;
      const fromInfo = findBlockById(state.blocks, activeId, undefined);
      const overInfo = overId && typeof overId === "string" ? findBlockById(state.blocks, overId, undefined) : null;
      if (!fromInfo || !overInfo) {
        newBlocks = state.blocks;
        break;
      }
      if (fromInfo.parentId !== overInfo.parentId) {
        newBlocks = state.blocks;
        break;
      }
      const list = fromInfo.parentId == null ? state.blocks : (state.blocks.find((b) => b.type === "loop" && b.id === fromInfo.parentId) as LoopBlock | undefined)?.children ?? [];
      const reordered = moveBlockInList([...list], activeId, overId as string);
      if (fromInfo.parentId == null) newBlocks = reordered;
      else
        newBlocks = state.blocks.map((b) =>
          b.type === "loop" && b.id === fromInfo.parentId ? { ...b, children: reordered } : b
        );
      break;
    }
    case "MOVE_BLOCK_TO_CONTAINER": {
      const { blockId, fromParentId, toParentId, toIndex } = action.payload;
      const fromInfo = findBlockById(state.blocks, blockId, undefined);
      if (!fromInfo) {
        newBlocks = state.blocks;
        break;
      }
      const block = fromInfo.block;
      const next = removeBlockFromTree(state.blocks, blockId, fromParentId);
      newBlocks = insertBlockAt(next, block, toParentId, toIndex);
      break;
    }
    case "SET_BLOCKS":
      newBlocks = action.payload.blocks;
      break;
    default:
      return state;
  }

  return {
    blocks: newBlocks,
    stats: calculateRoutineStats(newBlocks),
  };
}

const RoutineEditorContext = createContext<{
  state: RoutineEditorState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function RoutineEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <RoutineEditorContext.Provider value={{ state, dispatch }}>
      {children}
    </RoutineEditorContext.Provider>
  );
}

export function useRoutineEditor() {
  const context = useContext(RoutineEditorContext);
  if (!context) {
    throw new Error("useRoutineEditor must be used within a RoutineEditorProvider");
  }
  return context;
}
