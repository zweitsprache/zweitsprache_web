"use client";

import { useEffect, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { EditorProvider, useEditor } from "@/store/editor-store";
import { EditorToolbar } from "./editor-toolbar";
import { BlockSidebar } from "./block-sidebar";
import { WorksheetCanvas } from "./worksheet-canvas";
import { PropertiesPanel } from "./properties-panel";
import { WorksheetBlock, WorksheetSettings } from "@/types/worksheet";
import { BLOCK_LIBRARY } from "@/types/worksheet-constants";

interface WorksheetEditorProps {
  lessonId: string;
  initialTitle: string;
  initialBlocks: WorksheetBlock[];
  initialSettings: WorksheetSettings;
  backUrl?: string;
}

function EditorInner({
  lessonId,
  initialTitle,
  initialBlocks,
  initialSettings,
  backUrl,
}: WorksheetEditorProps) {
  const { state, dispatch, save } = useEditor();

  // Load initial data
  useEffect(() => {
    dispatch({
      type: "LOAD_LESSON",
      payload: {
        id: lessonId,
        title: initialTitle,
        blocks: initialBlocks,
        settings: initialSettings,
      },
    });
  }, [lessonId, initialTitle, initialBlocks, initialSettings, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
      if (e.key === "Escape") {
        dispatch({ type: "SELECT_BLOCK", payload: null });
      }
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedBlockId) {
        const target = e.target as HTMLElement;
        const isEditable =
          target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.closest(".tiptap");
        if (!isEditable) {
          e.preventDefault();
          dispatch({ type: "REMOVE_BLOCK", payload: state.selectedBlockId });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedBlockId, dispatch, save]);

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  // Handle drag from sidebar (library) onto canvas
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeData = active.data.current;

      // Dragging from block library
      if (activeData?.fromLibrary) {
        const blockType = activeData.blockType;
        const def = BLOCK_LIBRARY.find((b) => b.type === blockType);
        if (!def) return;
        const block: WorksheetBlock = {
          ...def.defaultData,
          id: uuidv4(),
        } as WorksheetBlock;

        // Find insert position
        const overIdx = state.blocks.findIndex((b) => b.id === over.id);
        const insertIdx = overIdx !== -1 ? overIdx + 1 : state.blocks.length;
        dispatch({ type: "ADD_BLOCK", payload: { block, index: insertIdx } });
        return;
      }

      // Reordering existing blocks
      if (active.id !== over.id) {
        dispatch({
          type: "MOVE_BLOCK",
          payload: {
            activeId: active.id as string,
            overId: over.id as string,
          },
        });
      }
    },
    [state.blocks, dispatch]
  );

  const handleDragStart = useCallback((_event: DragStartEvent) => {
    // Could add visual feedback here
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Could add drop indicators here
  }, []);

  return (
    <div className="flex h-full flex-col bg-zinc-100 dark:bg-zinc-950">
      <EditorToolbar backUrl={backUrl} />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 overflow-hidden">
          <BlockSidebar />
          <SortableContext
            items={state.blocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <WorksheetCanvas />
          </SortableContext>
          <PropertiesPanel />
        </div>
      </DndContext>
    </div>
  );
}

export function WorksheetEditor(props: WorksheetEditorProps) {
  return (
    <EditorProvider>
      <EditorInner {...props} />
    </EditorProvider>
  );
}
