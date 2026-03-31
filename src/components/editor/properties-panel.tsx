"use client";

import React from "react";
import { useEditor } from "@/store/editor-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorksheetBlock, BlockVisibility } from "@/types/worksheet";
import { BLOCK_LIBRARY } from "@/types/worksheet-constants";

// Content blocks
import {
  HeadingProps,
  TextProps,
  ImageProps,
  ImageCardsProps,
  TextCardsProps,
  GlossaryProps,
  ChartProps,
  NumberedLabelProps,
  NumberedItemsProps,
  DialogueProps,
  AccordionProps,
  AudioProps,
  TableProps,
  DosAndDontsProps,
  TextComparisonProps,
  EmailSkeletonProps,
  JobApplicationProps,
} from "./properties/content-props";

// Layout blocks
import {
  SpacerProps,
  DividerProps,
  WritingLinesProps,
  WritingRowsProps,
  ColumnsProps,
  PageBreakProps,
  LogoDividerProps,
} from "./properties/layout-props";

// Interactive blocks
import {
  MultipleChoiceProps,
  OpenResponseProps,
  FillInBlankProps,
  FillInBlankItemsProps,
  MatchingProps,
  TwoColumnFillProps,
  WordBankProps,
  TrueFalseMatrixProps,
  ArticleTrainingProps,
  OrderItemsProps,
  InlineChoicesProps,
  WordSearchProps,
  SortingCategoriesProps,
  UnscrambleWordsProps,
  FixSentencesProps,
  CompleteSentencesProps,
  VerbTableProps,
} from "./properties/interactive-props";

// AI blocks
import { AiPromptProps, AiToolProps } from "./properties/ai-props";

// ─── Block-specific property editor router ──────────────────
function BlockPropertyEditor({ block }: { block: WorksheetBlock }) {
  switch (block.type) {
    // Content
    case "heading":
      return <HeadingProps block={block} />;
    case "text":
      return <TextProps block={block} />;
    case "image":
      return <ImageProps block={block} />;
    case "image-cards":
      return <ImageCardsProps block={block} />;
    case "text-cards":
      return <TextCardsProps block={block} />;
    case "glossary":
      return <GlossaryProps block={block} />;
    case "chart":
      return <ChartProps block={block} />;
    case "numbered-label":
      return <NumberedLabelProps block={block} />;
    case "numbered-items":
      return <NumberedItemsProps block={block} />;
    case "dialogue":
      return <DialogueProps block={block} />;
    case "accordion":
      return <AccordionProps block={block} />;
    case "audio":
      return <AudioProps block={block} />;
    case "table":
      return <TableProps block={block} />;
    case "dos-and-donts":
      return <DosAndDontsProps block={block} />;
    case "text-comparison":
      return <TextComparisonProps block={block} />;
    case "email-skeleton":
      return <EmailSkeletonProps block={block} />;
    case "job-application":
      return <JobApplicationProps block={block} />;

    // Layout
    case "spacer":
      return <SpacerProps block={block} />;
    case "divider":
      return <DividerProps block={block} />;
    case "writing-lines":
      return <WritingLinesProps block={block} />;
    case "writing-rows":
      return <WritingRowsProps block={block} />;
    case "columns":
      return <ColumnsProps block={block} />;
    case "page-break":
      return <PageBreakProps block={block} />;
    case "logo-divider":
      return <LogoDividerProps block={block} />;

    // Interactive
    case "multiple-choice":
      return <MultipleChoiceProps block={block} />;
    case "open-response":
      return <OpenResponseProps block={block} />;
    case "fill-in-blank":
      return <FillInBlankProps block={block} />;
    case "fill-in-blank-items":
      return <FillInBlankItemsProps block={block} />;
    case "matching":
      return <MatchingProps block={block} />;
    case "two-column-fill":
      return <TwoColumnFillProps block={block} />;
    case "word-bank":
      return <WordBankProps block={block} />;
    case "true-false-matrix":
      return <TrueFalseMatrixProps block={block} />;
    case "article-training":
      return <ArticleTrainingProps block={block} />;
    case "order-items":
      return <OrderItemsProps block={block} />;
    case "inline-choices":
      return <InlineChoicesProps block={block} />;
    case "word-search":
      return <WordSearchProps block={block} />;
    case "sorting-categories":
      return <SortingCategoriesProps block={block} />;
    case "unscramble-words":
      return <UnscrambleWordsProps block={block} />;
    case "fix-sentences":
      return <FixSentencesProps block={block} />;
    case "complete-sentences":
      return <CompleteSentencesProps block={block} />;
    case "verb-table":
      return <VerbTableProps block={block} />;

    // AI
    case "ai-prompt":
      return <AiPromptProps block={block} />;
    case "ai-tool":
      return <AiToolProps block={block} />;

    // Fallback for blocks without additional properties
    default:
      return (
        <p className="text-xs text-muted-foreground">
          Keine weiteren Einstellungen für diesen Block.
        </p>
      );
  }
}

// ─── Main Properties Panel ──────────────────────────────────
export function PropertiesPanel() {
  const { state, dispatch } = useEditor();
  const { selectedBlockId, blocks } = state;

  // Find selected block (could be nested in columns/accordion)
  const findBlock = (id: string, list: WorksheetBlock[]): WorksheetBlock | undefined => {
    for (const block of list) {
      if (block.id === id) return block;
      if (block.type === "columns") {
        for (const col of block.children) {
          const found = findBlock(id, col);
          if (found) return found;
        }
      }
      if (block.type === "accordion") {
        for (const item of block.items) {
          const found = findBlock(id, item.children);
          if (found) return found;
        }
      }
    }
    return undefined;
  };

  const selectedBlock = selectedBlockId ? findBlock(selectedBlockId, blocks) : undefined;

  if (!selectedBlock) {
    return (
      <div className="w-72 border-l bg-white flex-shrink-0">
        <div className="p-4 text-center text-sm text-muted-foreground mt-8">
          Wähle einen Block aus, um dessen Eigenschaften zu bearbeiten.
        </div>
      </div>
    );
  }

  const blockDef = BLOCK_LIBRARY.find((b) => b.type === selectedBlock.type);

  return (
    <div className="w-72 border-l bg-white flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="text-lg">{blockDef?.icon ?? "📦"}</span>
          <div>
            <h3 className="text-sm font-semibold leading-tight">
              {blockDef?.label ?? selectedBlock.type}
            </h3>
            <p className="text-[10px] text-muted-foreground leading-tight">
              {blockDef?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Visibility control */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
              Sichtbarkeit
            </Label>
            <Select
              value={selectedBlock.visibility}
              onValueChange={(v) =>
                dispatch({
                  type: "UPDATE_BLOCK",
                  payload: {
                    id: selectedBlock.id,
                    updates: { visibility: v as BlockVisibility },
                  },
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Print & Online</SelectItem>
                <SelectItem value="print">Nur Print</SelectItem>
                <SelectItem value="online">Nur Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Block-specific properties */}
          <BlockPropertyEditor block={selectedBlock} />
        </div>
      </ScrollArea>
    </div>
  );
}
