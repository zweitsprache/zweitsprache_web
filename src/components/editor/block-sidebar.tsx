"use client";

import React, { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import type { BlockType } from "@/types/worksheet";
import { BLOCK_LIBRARY, type BlockDefinition } from "@/types/worksheet-constants";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Heading, Type, Image, Space, Minus, Columns2, CircleDot, TextCursorInput,
  ArrowLeftRight, PenLine, LayoutList, CheckSquare, ListOrdered, TextSelect,
  Search, Group, Shuffle, WrapText, TableProperties, LayoutGrid, BookA,
  BarChart3, Hash, BookOpen, MessageCircle, FileOutput, Rows3, Mail,
  ClipboardList, Sparkles, Bot,
} from "lucide-react";
import { useEditor } from "@/store/editor-store";
import { v4 as uuidv4 } from "uuid";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heading, Type, Image, Space, Minus, Columns2, CircleDot, TextCursorInput,
  ArrowLeftRight, PenLine, LayoutList, CheckSquare, ListOrdered, TextSelect,
  Search, Group, Shuffle, WrapText, TableProperties, LayoutGrid, BookA,
  BarChart3, Hash, BookOpen, MessageCircle, FileOutput, Rows3, Mail,
  ClipboardList, Sparkles, Bot,
};

function DraggableBlockItem({ definition }: { definition: BlockDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library-${definition.type}`,
    data: { fromLibrary: true, blockType: definition.type },
  });

  const Icon = iconMap[definition.icon];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-3 p-3 rounded-lg bg-card cursor-grab
        hover:bg-accent transition-colors
        ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
      <div className="min-w-0">
        <p className="text-sm font-medium leading-none">{definition.label}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{definition.description}</p>
      </div>
    </div>
  );
}

export function BlockSidebar() {
  const { dispatch } = useEditor();
  const [search, setSearch] = useState("");

  const handleAddBlock = (type: BlockType) => {
    const def = BLOCK_LIBRARY.find((b) => b.type === type);
    if (!def) return;
    const block = { ...def.defaultData, id: uuidv4() };
    dispatch({ type: "ADD_BLOCK", payload: { block: block as import("@/types/worksheet").WorksheetBlock } });
  };

  const categories = useMemo(() => {
    const filter = (b: BlockDefinition) =>
      !search ||
      b.label.toLowerCase().includes(search.toLowerCase()) ||
      b.description.toLowerCase().includes(search.toLowerCase());

    return {
      content: BLOCK_LIBRARY.filter((b) => b.category === "content" && filter(b)),
      layout: BLOCK_LIBRARY.filter((b) => b.category === "layout" && filter(b)),
      interactive: BLOCK_LIBRARY.filter((b) => b.category === "interactive" && filter(b)),
      aiTools: BLOCK_LIBRARY.filter((b) => b.category === "ai-tools" && filter(b)),
    };
  }, [search]);

  return (
    <div className="w-80 shrink-0 flex flex-col h-full min-h-0 pt-8 pb-8">
      <div className="flex flex-col h-full bg-slate-50 rounded-sm shadow-sm overflow-hidden">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Block suchen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm border-slate-700"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 min-h-0 overflow-hidden scrollbar-hide [&_[data-slot=scroll-area-viewport]>div]:!block">
          <div className="px-3 pb-3 space-y-3">
            {/* Content blocks */}
            {categories.content.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md mb-2">
                  Inhalt
                </div>
                <div className="space-y-1.5">
                  {categories.content.map((def) => (
                    <div key={def.type} onDoubleClick={() => handleAddBlock(def.type)}>
                      <DraggableBlockItem definition={def} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Layout blocks */}
            {categories.layout.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md mb-2">
                  Layout
                </div>
                <div className="space-y-1.5">
                  {categories.layout.map((def) => (
                    <div key={def.type} onDoubleClick={() => handleAddBlock(def.type)}>
                      <DraggableBlockItem definition={def} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive blocks */}
            {categories.interactive.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md mb-2">
                  Interaktiv
                </div>
                <div className="space-y-1.5">
                  {categories.interactive.map((def) => (
                    <div key={def.type} onDoubleClick={() => handleAddBlock(def.type)}>
                      <DraggableBlockItem definition={def} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Tools blocks */}
            {categories.aiTools.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-violet-700 uppercase tracking-wider px-2 py-1.5 bg-violet-100 rounded-md mb-2">
                  KI-Tools
                </div>
                <div className="space-y-1.5">
                  {categories.aiTools.map((def) => (
                    <div key={def.type} onDoubleClick={() => handleAddBlock(def.type)}>
                      <DraggableBlockItem definition={def} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {categories.content.length === 0 &&
              categories.layout.length === 0 &&
              categories.interactive.length === 0 &&
              categories.aiTools.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Keine Blöcke gefunden
                </p>
              )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
