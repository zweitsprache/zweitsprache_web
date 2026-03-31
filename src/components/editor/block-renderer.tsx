"use client";

import React from "react";
import {
  WorksheetBlock,
  HeadingBlock,
  TextBlock,
  ImageBlock,
  ImageCardsBlock,
  TextCardsBlock,
  SpacerBlock,
  DividerBlock,
  MultipleChoiceBlock,
  FillInBlankBlock,
  FillInBlankItemsBlock,
  MatchingBlock,
  TwoColumnFillBlock,
  GlossaryBlock,
  OpenResponseBlock,
  WordBankBlock,
  NumberLineBlock,
  ColumnsBlock,
  TrueFalseMatrixBlock,
  OrderItemsBlock,
  InlineChoicesBlock,
  WordSearchBlock,
  SortingCategoriesBlock,
  UnscrambleWordsBlock,
  FixSentencesBlock,
  CompleteSentencesBlock,
  VerbTableBlock,
  VerbTableRow,
  ArticleTrainingBlock,
  ArticleAnswer,
  ChartBlock,
  NumberedLabelBlock,
  DialogueBlock,
  PageBreakBlock,
  WritingLinesBlock,
  WritingRowsBlock,
  LinkedBlocksBlock,
  TextSnippetBlock,
  EmailSkeletonBlock,
  JobApplicationBlock,
  DosAndDontsBlock,
  TextComparisonBlock,
  NumberedItemsBlock,
  AccordionBlock,
  LogoDividerBlock,
  AiPromptBlock,
  AiToolBlock,
  AudioBlock,
  TableBlock,
  ViewMode,
  BlockVisibility,
} from "@/types/worksheet";
import { migrateInlineChoicesBlock } from "@/types/worksheet-constants";
import { useEditor } from "@/store/editor-store";
import { replaceEszett } from "@/lib/locale-utils";
import { setByPath, getByPath } from "@/lib/locale-utils";
import { RichTextEditor } from "./rich-text-editor";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import {
  Plus, Minus, X, Check, GripVertical, Trash2, Copy, Eye, EyeOff, Printer, Monitor,
  Sparkles, ArrowUpDown, Upload, ChevronUp, ChevronDown, ChevronsDown, ChevronsUp,
  Link2, ExternalLink, Mail, Paperclip, FormInput, BadgeAlert, Siren, Goal, Bot,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ─── Handwriting helper ──────────────────────────────────────
function hasHandwriting(text: string): boolean {
  return /\+\+.+?\+\+/.test(text);
}

function renderHandwriting(text: string): React.ReactNode {
  const parts = text.split(/(\+\+.*?\+\+)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => {
    if (part.startsWith("++") && part.endsWith("++")) {
      return (
        <span key={i} className="text-blue-500" style={{ fontFamily: "var(--font-handwriting)", fontSize: "1.15em" }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

/** Render text that may contain <sup>...</sup> tags as React elements. */
function renderTextWithSup(text: string): React.ReactNode[] {
  const parts = text.split(/(<sup>[^<]*<\/sup>)/g);
  return parts.map((p, i) => {
    const m = p.match(/^<sup>([^<]*)<\/sup>$/);
    if (m) {
      return (
        <span key={i} className="text-muted-foreground" style={{ fontSize: "0.6em", position: "relative", top: "-0.5em", marginLeft: 2, lineHeight: 0 }}>
          {m[1]}
        </span>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

// ─── Locale-aware inline editing ────────────────────────────
function useLocaleAwareEdit() {
  const { state, dispatch } = useEditor();
  const isChMode = state.localeMode === "CH";

  const localeUpdate = React.useCallback(
    (blockId: string, fieldPath: string, value: string, deUpdate: () => void) => {
      if (!isChMode) {
        deUpdate();
        return;
      }
      let rawBlock: WorksheetBlock | null = null;
      for (const b of state.blocks) {
        if (b.id === blockId) { rawBlock = b; break; }
        if (b.type === "columns") {
          for (const col of b.children) {
            for (const c of col) { if (c.id === blockId) { rawBlock = c; break; } }
            if (rawBlock) break;
          }
          if (rawBlock) break;
        }
        if (b.type === "accordion") {
          for (const item of b.items) {
            for (const c of item.children) { if (c.id === blockId) { rawBlock = c; break; } }
            if (rawBlock) break;
          }
          if (rawBlock) break;
        }
      }
      const baseValue = rawBlock ? String(getByPath(rawBlock, fieldPath) ?? "") : "";
      const autoReplaced = replaceEszett(baseValue);
      if (value === autoReplaced) {
        dispatch({ type: "CLEAR_CH_OVERRIDE", payload: { blockId, fieldPath } });
      } else {
        dispatch({ type: "SET_CH_OVERRIDE", payload: { blockId, fieldPath, value } });
      }
    },
    [isChMode, state.blocks, dispatch],
  );

  return { isChMode, localeUpdate };
}

// ─── Heading ─────────────────────────────────────────────────
function collectNumberedLabelBlocks(blocks: WorksheetBlock[]): { id: string; startNumber: number }[] {
  const result: { id: string; startNumber: number }[] = [];
  for (const b of blocks) {
    if (b.type === "numbered-label") result.push({ id: b.id, startNumber: b.startNumber });
    if (b.type === "columns") {
      for (const col of b.children) {
        for (const child of col) {
          if (child.type === "numbered-label") result.push({ id: child.id, startNumber: child.startNumber });
        }
      }
    }
    if (b.type === "accordion") {
      for (const item of b.items) {
        for (const child of item.children) {
          if (child.type === "numbered-label") result.push({ id: child.id, startNumber: child.startNumber });
        }
      }
    }
  }
  return result;
}

function HeadingRenderer({ block }: { block: HeadingBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();
  const Tag = `h${block.level}` as keyof React.JSX.IntrinsicElements;
  const sizes = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl" };

  return (
    <Tag
      className={`${sizes[block.level]} font-bold outline-none`}
      style={block.level === 3 ? { fontWeight: 800 } : undefined}
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const value = e.currentTarget.textContent || "";
        localeUpdate(block.id, "content", value, () =>
          dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { content: value } } })
        );
      }}
    >
      {block.content}
    </Tag>
  );
}

// ─── Text ────────────────────────────────────────────────────
function TextRenderer({ block }: { block: TextBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const isHinweis = block.textStyle === "hinweis";
  const isHinweisWichtig = block.textStyle === "hinweis-wichtig";
  const isHinweisAlarm = block.textStyle === "hinweis-alarm";
  const isLernziel = block.textStyle === "lernziel";
  const hasHinweisBox = isHinweis || isHinweisWichtig || isHinweisAlarm || isLernziel;
  const isRows = block.textStyle === "rows";

  const hinweisConfig = isHinweisAlarm
    ? { color: "#990033", bg: "#99003308", border: "#990033", icon: <Siren className="h-5 w-5" style={{ color: "#990033" }} /> }
    : isHinweisWichtig
    ? { color: "#0369a1", bg: "#0369a108", border: "#0369a1", icon: <BadgeAlert className="h-5 w-5" style={{ color: "#0369a1" }} /> }
    : isLernziel
    ? { color: "#166534", bg: "transparent", border: "#166534", icon: <Goal className="h-5 w-5" style={{ color: "#166534" }} /> }
    : { color: "#475569", bg: "#47556908", border: "#475569", icon: <ArrowRight className="h-5 w-5" style={{ color: "#475569" }} /> };

  const imageEl = block.imageSrc ? (
    <div
      style={{
        float: block.imageAlign === "right" ? "right" : "left",
        width: `${block.imageScale ?? 30}%`,
        margin: block.imageAlign === "right" ? "4px 0 8px 12px" : "4px 12px 8px 0",
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={block.imageSrc} alt="" className="w-full rounded" />
    </div>
  ) : null;

  const richTextEl = (
    <RichTextEditor
      content={block.content}
      onChange={(html) =>
        localeUpdate(block.id, "content", html, () =>
          dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { content: html } } })
        )
      }
      placeholder="Text eingeben…"
      floatingElement={imageEl}
    />
  );

  if (isLernziel) {
    return (
      <div className="relative group/text flex gap-0 border-2 rounded-sm overflow-hidden" style={{ borderColor: "#4A3D55", backgroundColor: "#4A3D5510", color: "#4A3D55" }}>
        <div className="shrink-0 w-10 flex items-center justify-center" style={{ backgroundColor: "#4A3D55" }}>
          <Goal className="h-5 w-5" style={{ color: "#ffffff" }} />
        </div>
        <div className="flex-1 min-w-0 px-3 py-2">{richTextEl}</div>
      </div>
    );
  }

  return (
    <div
      className={`relative group/text ${hasHinweisBox ? "flex gap-0 border-2 rounded-sm" : ""} ${isRows ? "tiptap-rows" : ""}`}
      style={hasHinweisBox ? { borderColor: hinweisConfig.border, backgroundColor: hinweisConfig.bg, color: hinweisConfig.color } : undefined}
    >
      {hasHinweisBox && (
        <div className="shrink-0 w-10 flex items-center justify-center rounded-l-sm">
          {hinweisConfig.icon}
        </div>
      )}
      <div className={hasHinweisBox ? "flex-1 min-w-0 px-3 py-2" : undefined}>
        {richTextEl}
      </div>
    </div>
  );
}

// ─── Text Snippet ────────────────────────────────────────────
function TextSnippetRenderer({ block }: { block: TextSnippetBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  return (
    <div className="relative group/text-snippet">
      <div className="border border-dashed border-amber-300 rounded-sm p-3 bg-amber-50/30">
        <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-600 font-medium">
          <Copy className="h-3.5 w-3.5" />
          Textbaustein
        </div>
        <RichTextEditor
          content={block.content}
          onChange={(html) =>
            localeUpdate(block.id, "content", html, () =>
              dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { content: html } } })
            )
          }
          placeholder="Text eingeben…"
        />
      </div>
    </div>
  );
}

// ─── Email Skeleton ──────────────────────────────────────────
function EmailSkeletonRenderer({ block }: { block: EmailSkeletonBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const attachments = block.attachments ?? [];
  const style = block.emailStyle ?? "none";
  const isStyled = style === "standard" || style === "teal";
  const color = style === "teal" ? "#3A4F40" : style === "standard" ? "#990033" : undefined;
  const pillLabel = style === "teal" ? "Besser" : style === "standard" ? "Standard" : "";

  return (
    <div>
      {isStyled && (
        <div className="flex">
          <div className="py-0.5 text-xs font-semibold text-white rounded-t-sm text-center uppercase" style={{ backgroundColor: color, width: 110, paddingLeft: 12, paddingRight: 12 }}>
            {pillLabel}
          </div>
        </div>
      )}
      <div
        className={`border border-dashed overflow-hidden bg-white shadow-sm ${isStyled ? "rounded-sm rounded-tl-none" : "rounded-sm"}`}
        style={isStyled ? { borderColor: color } : undefined}
      >
        <div className={`flex items-center gap-2 px-4 py-2 border-b ${isStyled ? "" : "bg-slate-50 border-slate-200"}`} style={isStyled ? { backgroundColor: `${color}0D`, borderColor: `${color}4D` } : undefined}>
          <Mail className="h-4 w-4" style={isStyled ? { color } : undefined} />
        </div>
        <div className="px-4 pt-3 pb-2 space-y-1.5 border-b border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-400 w-16 shrink-0">Von</span>
            <span className="text-slate-700">{block.from}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-slate-400 w-16 shrink-0">An</span>
            <span className="text-slate-700">{block.to}</span>
          </div>
          <div className="flex items-baseline gap-2 pt-1 border-t border-slate-100">
            <span className="font-semibold text-slate-400 w-16 shrink-0">Betreff</span>
            <span className="font-semibold" style={isStyled ? { color } : undefined}>{block.subject}</span>
          </div>
        </div>
        <div className="px-4 py-3">
          <RichTextEditor
            content={block.body}
            onChange={(html) =>
              localeUpdate(block.id, "body", html, () =>
                dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { body: html } } })
              )
            }
            placeholder="Text eingeben…"
          />
        </div>
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div key={att.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 bg-white text-xs text-slate-600">
                <Paperclip className="h-3 w-3" />
                {att.name}
              </div>
            ))}
          </div>
        )}
      </div>
      {isStyled && block.comment && (
        <p style={{ color, marginTop: "0.75rem", backgroundColor: "#f8f8f8", padding: "0.5rem 1.25rem", borderRadius: "0.375rem" }}>{block.comment}</p>
      )}
    </div>
  );
}

// ─── Job Application ─────────────────────────────────────────
function JobApplicationRenderer({ block }: { block: JobApplicationBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const style = block.applicationStyle ?? "none";
  const isStyled = style === "standard" || style === "teal";
  const color = style === "teal" ? "#3A4F40" : style === "standard" ? "#990033" : undefined;
  const pillLabel = style === "teal" ? "Besser" : style === "standard" ? "Standard" : "";

  return (
    <div>
      {isStyled && (
        <div className="flex">
          <div className="py-0.5 text-xs font-semibold text-white rounded-t-sm text-center uppercase" style={{ backgroundColor: color, width: 110, paddingLeft: 12, paddingRight: 12 }}>
            {pillLabel}
          </div>
        </div>
      )}
      <div className={`border border-dashed overflow-hidden bg-white shadow-sm ${isStyled ? "rounded-sm rounded-tl-none" : "rounded-sm"}`} style={{ borderColor: isStyled ? color : "#475569" }}>
        <div className="flex items-center gap-2 px-4 py-2 border-b" style={isStyled ? { backgroundColor: `${color}0D`, borderColor: `${color}4D` } : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
          <FormInput className="h-4 w-4" style={{ color: isStyled ? color : "#475569" }} />
        </div>
        <div className="px-4 pt-3 pb-4 space-y-1.5">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-400 w-24 shrink-0 text-sm">Stelle</span>
            <div className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{block.position}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-400 w-24 shrink-0 text-sm">Vorname</span>
            <div className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{block.firstName}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-400 w-24 shrink-0 text-sm">Nachname</span>
            <div className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{block.applicantName}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-400 w-24 shrink-0 text-sm">E-Mail</span>
            <div className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{block.email}</div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-400 w-24 shrink-0 text-sm">Telefon</span>
            <div className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{block.phone}</div>
          </div>
          <div className="flex items-start gap-4">
            <span className="font-semibold text-slate-400 w-24 shrink-0 text-sm pt-1.5">Nachricht</span>
            <div className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5">
              <RichTextEditor
                content={block.message}
                onChange={(html) =>
                  localeUpdate(block.id, "message", html, () =>
                    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { message: html } } })
                  )
                }
                placeholder="Text eingeben…"
              />
            </div>
          </div>
        </div>
      </div>
      {isStyled && block.comment && (
        <p style={{ color, marginTop: "0.75rem", backgroundColor: "#f8f8f8", padding: "0.5rem 1.25rem", borderRadius: "0.375rem" }}>{block.comment}</p>
      )}
    </div>
  );
}

// ─── Image ───────────────────────────────────────────────────
function ImageRenderer({ block }: { block: ImageBlock }) {
  if (!block.src) {
    return (
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-sm p-8 text-center text-muted-foreground text-sm">
        <p>Klicke um ein Bild hinzuzufügen</p>
      </div>
    );
  }
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={block.src}
        alt={block.alt}
        className="max-w-full rounded mx-auto block"
        style={{ ...(block.width ? { width: block.width } : {}), ...(block.height ? { height: block.height, objectFit: "contain" as const } : {}) }}
      />
      {block.caption && <figcaption className="text-sm text-muted-foreground mt-1 text-center">{block.caption}</figcaption>}
    </figure>
  );
}

// ─── Image Cards ─────────────────────────────────────────────
function ImageCardsRenderer({ block }: { block: ImageCardsBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const updateItemText = (index: number, text: string) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], text };
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
  };

  const addCard = () => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: [...block.items, { id: crypto.randomUUID(), src: "", alt: "", text: `Karte ${block.items.length + 1}` }] } } });
  };

  const removeCard = (index: number) => {
    if (block.items.length <= 1) return;
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.filter((_, i) => i !== index) } } });
  };

  return (
    <div className="space-y-3">
      {block.showWordBank && block.items.some(item => item.text) && (
        <div className="rounded p-3 border border-dashed border-muted-foreground/30">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Wortbank</div>
          <div className="flex flex-wrap gap-2">
            {block.items.filter(item => item.text).sort(() => Math.random() - 0.5).map((item) => (
              <span key={item.id} className="px-2 py-0.5 bg-background rounded border text-xs">{item.text}</span>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.columns}, 1fr)` }}>
        {block.items.map((item, index) => {
          const [arW, arH] = (block.imageAspectRatio ?? "1:1").split(":").map(Number);
          return (
            <div key={item.id} className="relative group/card">
              <div className="border rounded overflow-hidden bg-card transition-all">
                {item.src ? (
                  <div className="relative overflow-hidden mx-auto" style={{ width: `${block.imageScale ?? 100}%`, aspectRatio: `${arW} / ${arH}` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.src} alt={item.alt} className="absolute inset-0 w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-square flex flex-col items-center justify-center bg-muted/30">
                    <Upload className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <span className="text-xs text-muted-foreground">Bild hochladen</span>
                  </div>
                )}
                <div className="p-2">
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => updateItemText(index, e.target.value)}
                    className="w-full text-center text-sm bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1"
                    placeholder="Beschriftung"
                  />
                </div>
              </div>
              {block.items.length > 1 && (
                <button type="button" onClick={() => removeCard(index)} className="absolute -top-2 -right-2 opacity-0 group-hover/card:opacity-100 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1 shadow transition-opacity">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={addCard} className="w-full py-2 border-2 border-dashed border-muted-foreground/25 rounded-sm text-muted-foreground text-sm hover:border-muted-foreground/50 hover:text-foreground transition-colors flex items-center justify-center gap-2">
        <Plus className="h-4 w-4" /> Karte hinzufügen
      </button>
    </div>
  );
}

// ─── Text Cards ──────────────────────────────────────────────
function TextCardsRenderer({ block }: { block: TextCardsBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const updateItemText = (index: number, text: string) => {
    localeUpdate(block.id, `items.${index}.text`, text, () => {
      const newItems = [...block.items];
      newItems[index] = { ...newItems[index], text };
      dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
    });
  };

  const addCard = () => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: [...block.items, { id: crypto.randomUUID(), text: `Text ${block.items.length + 1}`, caption: "" }] } } });
  };

  const removeCard = (index: number) => {
    if (block.items.length <= 1) return;
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.filter((_, i) => i !== index) } } });
  };

  const sizeClasses: Record<string, string> = { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl" };

  return (
    <div className="space-y-3">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.columns}, 1fr)` }}>
        {block.items.map((item, index) => (
          <div key={item.id} className="relative group/card">
            <div className={`${block.showBorder ? "border rounded" : ""} overflow-hidden bg-card transition-all`}>
              <div className={`p-3 ${sizeClasses[block.textSize ?? "base"]} text-center`}>
                <input type="text" value={item.text} onChange={(e) => updateItemText(index, e.target.value)} className="w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-1 text-center" placeholder="Text" />
              </div>
            </div>
            {block.items.length > 1 && (
              <button type="button" onClick={() => removeCard(index)} className="absolute -top-2 -right-2 opacity-0 group-hover/card:opacity-100 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full p-1 shadow transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={addCard} className="w-full py-2 border-2 border-dashed border-muted-foreground/25 rounded-sm text-muted-foreground text-sm hover:border-muted-foreground/50 hover:text-foreground transition-colors flex items-center justify-center gap-2">
        <Plus className="h-4 w-4" /> Karte hinzufügen
      </button>
    </div>
  );
}

// ─── Spacer ──────────────────────────────────────────────────
function SpacerRenderer({ block }: { block: SpacerBlock }) {
  return (
    <div className="relative bg-muted/30 border border-dashed border-muted-foreground/20 rounded" style={{ height: block.height }}>
      <span className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">{block.height}px</span>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────
function DividerRenderer({ block }: { block: DividerBlock }) {
  return <hr className="my-2" style={{ borderStyle: block.style }} />;
}

// ─── Logo Divider ────────────────────────────────────────────
function LogoDividerRenderer({ block: _block }: { block: LogoDividerBlock }) {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="w-6 h-0.5 bg-muted-foreground/20 rounded" />
    </div>
  );
}

// ─── Page Break ──────────────────────────────────────────────
function PageBreakRenderer({ block: _block }: { block: PageBreakBlock }) {
  return (
    <div className="relative flex items-center justify-center py-2">
      <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-blue-300" />
      <span className="relative z-10 bg-white px-3 py-0.5 text-xs font-medium text-blue-500 border border-blue-200 rounded-full">Seitenumbruch</span>
    </div>
  );
}

// ─── Writing Lines ───────────────────────────────────────────
function WritingLinesRenderer({ block }: { block: WritingLinesBlock }) {
  return (
    <div>
      {Array.from({ length: block.lineCount }).map((_, i) => (
        <div key={i} style={{ height: block.lineSpacing, borderBottom: "1px dashed var(--color-muted-foreground)", opacity: 1.0 }} />
      ))}
    </div>
  );
}

// ─── Writing Rows ────────────────────────────────────────────
function WritingRowsRenderer({ block }: { block: WritingRowsBlock }) {
  return (
    <div>
      {Array.from({ length: block.rowCount }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b last:border-b-0 py-2">
          <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
          <div className="flex-1" style={{ height: 24, borderBottom: "1px dashed var(--color-muted-foreground)", opacity: 1.0 }} />
        </div>
      ))}
    </div>
  );
}

// ─── Multiple Choice ─────────────────────────────────────────
function MultipleChoiceRenderer({ block, interactive }: { block: MultipleChoiceBlock; interactive: boolean }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const updateOptions = (newOptions: typeof block.options) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { options: newOptions } } });
  };

  const addOption = () => updateOptions([...block.options, { id: crypto.randomUUID(), text: `Option ${block.options.length + 1}`, isCorrect: false }]);
  const removeOption = (index: number) => { if (block.options.length <= 2) return; updateOptions(block.options.filter((_, i) => i !== index)); };
  const toggleCorrect = (index: number) => {
    updateOptions(block.options.map((opt, i) => block.allowMultiple ? (i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt) : { ...opt, isCorrect: i === index }));
  };

  return (
    <div className="space-y-3">
      <p className="font-medium outline-none border-b border-transparent focus:border-muted-foreground/30 transition-colors" contentEditable={!interactive} suppressContentEditableWarning onBlur={(e) => { if (interactive) return; const value = e.currentTarget.textContent || ""; localeUpdate(block.id, "question", value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { question: value } } })); }}>
        {block.question}
      </p>
      <div className="space-y-2">
        {block.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-3 p-3 rounded-sm border border-border group">
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            {!interactive && (
              <button type="button" onClick={() => toggleCorrect(i)} className={`flex items-center justify-center h-5 w-5 rounded-full border-2 transition-colors shrink-0 ${opt.isCorrect ? "border-green-500 bg-green-500 text-white" : "border-gray-300 hover:border-green-400"}`}>
                {opt.isCorrect && <Check className="h-3 w-3" />}
              </button>
            )}
            <span contentEditable={!interactive} suppressContentEditableWarning className="text-base outline-none flex-1 border-b border-transparent focus:border-muted-foreground/30 transition-colors" onBlur={(e) => { const value = e.currentTarget.textContent || ""; localeUpdate(block.id, `options.${i}.text`, value, () => { const no = [...block.options]; no[i] = { ...opt, text: value }; updateOptions(no); }); }}>
              {opt.text}
            </span>
            {!interactive && (
              <button type="button" onClick={() => removeOption(i)} className={`h-5 w-5 flex items-center justify-center rounded text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 ${block.options.length <= 2 ? "invisible" : "opacity-0 group-hover:opacity-100"}`}>
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      {!interactive && (
        <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Plus className="h-3.5 w-3.5" /> Option hinzufügen
        </button>
      )}
    </div>
  );
}

// ─── Fill in the Blank ───────────────────────────────────────
function FillInBlankRenderer({ block, interactive }: { block: FillInBlankBlock; interactive: boolean }) {
  const parts = block.content.split(/(\{\{blank:[^}]+\}\})/g);
  return (
    <div className="leading-relaxed flex flex-wrap items-baseline">
      {parts.map((part, i) => {
        const match = part.match(/\{\{blank:(.+)\}\}/);
        if (match) {
          const raw = match[1];
          const commaIdx = raw.lastIndexOf(",");
          let answer: string, widthMultiplier = 1;
          if (commaIdx !== -1) { answer = raw.substring(0, commaIdx).trim(); const parsed = Number(raw.substring(commaIdx + 1).trim()); if (!isNaN(parsed)) widthMultiplier = parsed; } else { answer = raw.trim(); }
          const widthStyle = widthMultiplier === 0 ? { flex: 1 } as React.CSSProperties : { minWidth: `${80 * widthMultiplier}px` } as React.CSSProperties;
          return interactive ? (
            <input key={i} type="text" placeholder="…" className="border-b border-dashed border-muted-foreground/30 bg-transparent px-2 py-0.5 text-center mx-1 focus:outline-none focus:border-primary inline" style={widthMultiplier === 0 ? { flex: 1 } : { width: `${112 * widthMultiplier}px` }} />
          ) : (
            <span key={i} className="inline-block bg-gray-100 rounded px-2 py-0.5 text-center mx-1 text-muted-foreground text-xs" style={widthStyle}>{answer}</span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
}

// ─── Fill-in-blank Items ─────────────────────────────────────
function FillInBlankItemsRenderer({ block, interactive }: { block: FillInBlankItemsBlock; interactive: boolean }) {
  const { state, dispatch } = useEditor();
  const activeIdx = state.activeItemIndex;
  const rawBlock = state.blocks.find((b) => b.id === block.id) as FillInBlankItemsBlock | undefined;
  const rawItems = rawBlock ? rawBlock.items : block.items;

  const updateItemContent = React.useCallback((index: number, newContent: string) => {
    const newItems = [...rawItems]; newItems[index] = { ...newItems[index], content: newContent };
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
  }, [rawItems, dispatch, block.id]);

  const moveItem = React.useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rawItems.length) return;
    const newItems = [...rawItems]; [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
    if (activeIdx === index) dispatch({ type: "SET_ACTIVE_ITEM", payload: newIndex });
  }, [rawItems, dispatch, block.id, activeIdx]);

  const wordBankAnswers = React.useMemo(() => {
    if (!block.showWordBank) return [];
    const answers: string[] = [];
    for (const item of block.items) { const matches = item.content.matchAll(/\{\{blank:([^,}]+)/g); for (const m of matches) answers.push(m[1].trim()); }
    return answers;
  }, [block.items, block.showWordBank]);

  return (
    <div>
      {block.showWordBank && wordBankAnswers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/40 rounded-sm">
          {wordBankAnswers.map((word, i) => <span key={i} className="px-2 py-0.5 bg-background border border-border rounded text-sm">{word}</span>)}
        </div>
      )}
      {block.items.map((item, idx) => {
        const parts = item.content.split(/(\{\{blank:[^}]+\}\})/g);
        return (
          <div key={item.id || idx} className={`flex items-center gap-3 border-b last:border-b-0 py-2 cursor-pointer rounded-sm transition-colors ${!interactive && activeIdx === idx ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-muted/30"}`} onClick={() => !interactive && dispatch({ type: "SET_ACTIVE_ITEM", payload: idx })}>
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(idx + 1).padStart(2, "0")}</span>
            <span className="flex-1 leading-relaxed flex flex-wrap items-baseline">
              {parts.map((part, i) => {
                const match = part.match(/\{\{blank:(.+)\}\}/);
                if (match) {
                  const raw = match[1]; const commaIdx = raw.lastIndexOf(",");
                  let answer: string, widthMultiplier = 1;
                  if (commaIdx !== -1) { answer = raw.substring(0, commaIdx).trim(); const parsed = Number(raw.substring(commaIdx + 1).trim()); if (!isNaN(parsed)) widthMultiplier = parsed; } else { answer = raw.trim(); }
                  const widthStyle = widthMultiplier === 0 ? { flex: 1 } as React.CSSProperties : { minWidth: `${80 * widthMultiplier}px` } as React.CSSProperties;
                  return interactive ? (
                    <input key={i} type="text" placeholder="…" className="border-b border-dashed border-muted-foreground/30 bg-transparent px-2 py-0.5 text-center mx-1 focus:outline-none focus:border-primary inline" style={widthMultiplier === 0 ? { flex: 1 } : { width: `${112 * widthMultiplier}px` }} />
                  ) : (
                    <span key={i} className="inline-block border-b border-dashed border-muted-foreground/30 px-2 py-0.5 text-center mx-1 text-muted-foreground text-xs" style={widthStyle}>{answer}</span>
                  );
                }
                return <span key={i}>{renderTextWithSup(part)}</span>;
              })}
            </span>
            {!interactive && (
              <div className="flex flex-col shrink-0" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="h-3.5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveItem(idx, -1)} disabled={idx === 0}><ChevronUp className="h-3 w-3" /></button>
                <button type="button" className="h-3.5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveItem(idx, 1)} disabled={idx === block.items.length - 1}><ChevronDown className="h-3 w-3" /></button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Matching ────────────────────────────────────────────────
function MatchingRenderer({ block }: { block: MatchingBlock }) {
  const shuffledRight = React.useMemo(() => [...block.pairs].sort(() => Math.random() - 0.5), [block.pairs]);
  return (
    <div className="space-y-3">
      <p className="text-base text-muted-foreground">{block.instruction}</p>
      <div className="grid grid-cols-2" style={{ gap: "0 24px" }}>
        <div className="space-y-0">
          {block.pairs.map((pair, i) => (
            <div key={pair.id} className={`flex items-center gap-3 py-2 border-b ${i === 0 ? "border-t" : ""}`}>
              <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <span className="flex-1">{pair.left}</span>
            </div>
          ))}
        </div>
        <div className="space-y-0">
          {shuffledRight.map((pair, i) => (
            <div key={`right-${pair.id}`} className={`flex items-center gap-3 py-2 border-b ${i === 0 ? "border-t" : ""}`}>
              <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{pair.right}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Two-Column Fill ─────────────────────────────────────────
function TwoColumnFillRenderer({ block }: { block: TwoColumnFillBlock }) {
  const wordBankItems = block.items.map((item) => (block.fillSide === "left" ? item.left : item.right)).filter(Boolean);
  const gridCols = block.colRatio === "1-2" ? "1fr 2fr" : block.colRatio === "2-1" ? "2fr 1fr" : "1fr 1fr";

  return (
    <div className="space-y-3">
      <p className="text-base text-muted-foreground">{block.instruction}</p>
      {block.showWordBank && wordBankItems.length > 0 && (
        <div className="rounded p-3 border border-dashed border-muted-foreground/30">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Wortbank</div>
          <div className="flex flex-wrap gap-2">{[...wordBankItems].sort(() => Math.random() - 0.5).map((text, i) => <span key={i} className="px-2 py-0.5 bg-background rounded border text-xs">{text}</span>)}</div>
        </div>
      )}
      <div className="grid" style={{ gridTemplateColumns: gridCols, gap: "0 24px" }}>
        {block.items.map((item, i) => (
          <React.Fragment key={item.id}>
            <div className={`flex items-center gap-3 ${block.extendedRows ? "py-1" : "py-2"} border-b ${i === 0 ? "border-t" : ""}`} style={block.extendedRows ? { minHeight: "3.5rem" } : undefined}>
              {block.fillSide === "left" ? (hasHandwriting(item.left) ? <span className="flex-1">{renderHandwriting(item.left)}</span> : <span className="flex-1 border-b border-dashed border-muted-foreground/40">&nbsp;</span>) : <span className="flex-1">{item.left}</span>}
            </div>
            <div className={`flex items-center gap-3 ${block.extendedRows ? "py-1" : "py-2"} border-b ${i === 0 ? "border-t" : ""}`} style={block.extendedRows ? { minHeight: "3.5rem" } : undefined}>
              {block.fillSide === "right" ? (hasHandwriting(item.right) ? <span className="flex-1">{renderHandwriting(item.right)}</span> : <span className="flex-1 border-b border-dashed border-muted-foreground/40">&nbsp;</span>) : <span className="flex-1">{item.right}</span>}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Glossary ────────────────────────────────────────────────
function GlossaryRenderer({ block }: { block: GlossaryBlock }) {
  return (
    <div className="space-y-3">
      {block.instruction && <p className="text-base text-muted-foreground">{block.instruction}</p>}
      <div className="space-y-0 border-t">
        {block.pairs.map((pair) => (
          <div key={pair.id} className="flex items-start gap-4 py-2 border-b">
            <span className="text-base font-semibold" style={{ width: "25%", minWidth: "25%", flexShrink: 0 }}>{pair.term}</span>
            <span className="text-base flex-1">{pair.definition}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Open Response ───────────────────────────────────────────
function OpenResponseRenderer({ block, interactive }: { block: OpenResponseBlock; interactive: boolean }) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{block.question}</p>
      {interactive ? (
        <textarea className="w-full border rounded-sm p-2 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary" rows={block.lines} placeholder="Antwort hier schreiben…" />
      ) : (
        <div className="space-y-0">{Array.from({ length: block.lines }).map((_, i) => <div key={i} className="border-b border-gray-300 h-8" />)}</div>
      )}
    </div>
  );
}

// ─── Word Bank ───────────────────────────────────────────────
function WordBankRenderer({ block }: { block: WordBankBlock }) {
  return (
    <div className="border-2 border-dashed border-muted-foreground/30 rounded-sm p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Wortbank</p>
      <div className="flex flex-wrap gap-2">{block.words.map((word, i) => <span key={i} className="px-3 py-1 bg-muted rounded-full text-base font-medium">{word}</span>)}</div>
    </div>
  );
}

// ─── Number Line ─────────────────────────────────────────────
function NumberLineRenderer({ block }: { block: NumberLineBlock }) {
  const ticks: number[] = [];
  for (let v = block.min; v <= block.max; v += block.step) ticks.push(v);
  return (
    <div className="py-4">
      <div className="relative mx-6">
        <div className="h-0.5 bg-foreground w-full" />
        <div className="flex justify-between -mt-2">
          {ticks.map((v) => (
            <div key={v} className="flex flex-col items-center">
              <div className="h-3 w-0.5 bg-foreground" />
              <span className="text-xs mt-1 text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>
        {block.markers.map((m, i) => {
          const pct = ((m - block.min) / (block.max - block.min)) * 100;
          return <div key={i} className="absolute -top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" style={{ left: `${pct}%`, transform: "translateX(-50%)" }} title={`${m}`} />;
        })}
      </div>
    </div>
  );
}

// ─── True/False Matrix ───────────────────────────────────────
function TrueFalseMatrixRenderer({ block, interactive }: { block: TrueFalseMatrixBlock; interactive: boolean }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const updateStatement = (id: string, updates: Partial<{ text: string; correctAnswer: boolean }>) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { statements: block.statements.map((s) => s.id === id ? { ...s, ...updates } : s) } } });
  };

  const addStatement = () => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { statements: [...block.statements, { id: crypto.randomUUID(), text: "Neue Aussage", correctAnswer: true }] } } });
  };

  const removeStatement = (id: string) => {
    if (block.statements.length <= 1) return;
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { statements: block.statements.filter((s) => s.id !== id) } } });
  };

  const orderedStatements = block.statementOrder
    ? block.statementOrder.map((id) => block.statements.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s).concat(block.statements.filter((s) => !block.statementOrder!.includes(s.id)))
    : block.statements;

  return (
    <div className="space-y-2">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 pr-2 border-b font-bold text-foreground">
              <span className="outline-none block" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; localeUpdate(block.id, "statementColumnHeader", value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { statementColumnHeader: value } } })); }}>
                {block.statementColumnHeader || ""}
              </span>
            </th>
            <th className="w-16 p-2 border-b text-center font-medium text-muted-foreground">{block.trueLabel || "Richtig"}</th>
            <th className="w-16 p-2 border-b text-center font-medium text-muted-foreground">{block.falseLabel || "Falsch"}</th>
            <th className="w-8 p-2 border-b"></th>
          </tr>
        </thead>
        <tbody>
          {orderedStatements.map((stmt, stmtIndex) => (
            <tr key={stmt.id} className="group/row border-b last:border-b-0">
              <td className="py-2 pr-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(stmtIndex + 1).padStart(2, "0")}</span>
                  <span className="outline-none block flex-1" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; const idx = block.statements.findIndex((s) => s.id === stmt.id); localeUpdate(block.id, `statements.${idx}.text`, value, () => updateStatement(stmt.id, { text: value })); }}>
                    {stmt.text}
                  </span>
                </div>
              </td>
              <td className="p-2 text-center align-middle">
                <button className={`w-5 h-5 rounded-full border-2 inline-flex items-center justify-center transition-colors ${stmt.correctAnswer ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 hover:border-green-400"}`} onClick={(e) => { e.stopPropagation(); updateStatement(stmt.id, { correctAnswer: true }); }}>
                  {stmt.correctAnswer && <Check className="h-3 w-3" />}
                </button>
              </td>
              <td className="p-2 text-center align-middle">
                <button className={`w-5 h-5 rounded-full border-2 inline-flex items-center justify-center transition-colors ${!stmt.correctAnswer ? "bg-red-500 border-red-500 text-white" : "border-muted-foreground/30 hover:border-red-400"}`} onClick={(e) => { e.stopPropagation(); updateStatement(stmt.id, { correctAnswer: false }); }}>
                  {!stmt.correctAnswer && <X className="h-3 w-3" />}
                </button>
              </td>
              <td className="p-2 text-center align-middle">
                <button className="opacity-0 group-hover/row:opacity-100 p-0.5 hover:bg-destructive/10 rounded transition-opacity" onClick={(e) => { e.stopPropagation(); removeStatement(stmt.id); }}>
                  <X className="h-3 w-3 text-destructive" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={(e) => { e.stopPropagation(); addStatement(); }}>
        <Plus className="h-3 w-3" /> Aussage hinzufügen
      </button>
    </div>
  );
}

// ─── Article Training ────────────────────────────────────────
function ArticleTrainingRenderer({ block, interactive }: { block: ArticleTrainingBlock; interactive: boolean }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();
  const articles: ArticleAnswer[] = ["der", "das", "die"];

  const updateItem = (id: string, updates: Partial<{ text: string; correctArticle: ArticleAnswer }>) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.map((item) => item.id === id ? { ...item, ...updates } : item) } } });
  };

  const addItem = () => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: [...block.items, { id: crypto.randomUUID(), text: "Nomen", correctArticle: "der" as ArticleAnswer }] } } });
  };

  const removeItem = (id: string) => {
    if (block.items.length <= 1) return;
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.filter((item) => item.id !== id) } } });
  };

  return (
    <div className="space-y-2">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-8 p-2 border-b"></th>
            {articles.map((a) => <th key={a} className="w-14 p-2 border-b text-center font-medium text-muted-foreground">{a}</th>)}
            <th className="text-left py-2 px-2 border-b font-bold text-foreground">Nomen</th>
            {block.showWritingLine && <th className="text-left py-2 px-2 border-b font-bold text-muted-foreground">Schreiblinie</th>}
            <th className="w-8 p-2 border-b"></th>
          </tr>
        </thead>
        <tbody>
          {block.items.map((item, idx) => (
            <tr key={item.id} className="group/row border-b last:border-b-0">
              <td className="p-2 text-center"><span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(idx + 1).padStart(2, "0")}</span></td>
              {articles.map((a) => (
                <td key={a} className="p-2 text-center">
                  <button className={`w-5 h-5 rounded-full border-2 inline-flex items-center justify-center transition-colors ${item.correctArticle === a ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 hover:border-green-400"}`} onClick={(e) => { e.stopPropagation(); updateItem(item.id, { correctArticle: a }); }}>
                    {item.correctArticle === a && <Check className="h-3 w-3" />}
                  </button>
                </td>
              ))}
              <td className="py-2 px-2">
                <span className="outline-none block flex-1" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; const arrIdx = block.items.findIndex((it) => it.id === item.id); localeUpdate(block.id, `items.${arrIdx}.text`, value, () => updateItem(item.id, { text: value })); }}>
                  {item.text}
                </span>
              </td>
              {block.showWritingLine && <td className="py-2 px-2"><div className="border-b border-muted-foreground/30 h-6 min-w-[100px]" /></td>}
              <td className="p-2 text-center"><button className="opacity-0 group-hover/row:opacity-100 p-0.5 hover:bg-destructive/10 rounded transition-opacity" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}><X className="h-3 w-3 text-destructive" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={(e) => { e.stopPropagation(); addItem(); }}>
        <Plus className="h-3 w-3" /> Nomen hinzufügen
      </button>
    </div>
  );
}

// ─── Order Items ─────────────────────────────────────────────
function OrderItemsRenderer({ block, interactive }: { block: OrderItemsBlock; interactive: boolean }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();
  const sortedItems = [...block.items].sort((a, b) => a.correctPosition - b.correctPosition);

  return (
    <div className="space-y-2">
      <div className="font-medium outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; localeUpdate(block.id, "instruction", value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { instruction: value } } })); }}>
        {block.instruction}
      </div>
      <div className="space-y-2">
        {sortedItems.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 group/item p-3 rounded-sm border border-border">
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span contentEditable={!interactive} suppressContentEditableWarning className="text-base outline-none flex-1 border-b border-transparent focus:border-muted-foreground/30 transition-colors" onBlur={(e) => { const value = e.currentTarget.textContent || ""; const arrIdx = block.items.findIndex((it) => it.id === item.id); localeUpdate(block.id, `items.${arrIdx}.text`, value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.map((it) => it.id === item.id ? { ...it, text: value } : it) } } })); }}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Inline Choices ──────────────────────────────────────────
function parseInlineChoiceSegments(content: string) {
  const parts = content.split(/(\{\{(?:choice:)?[^}]+\}\})/g);
  const segments: Array<{ type: "text"; value: string } | { type: "choice"; options: string[] }> = [];
  parts.forEach((part) => {
    const match = part.match(/\{\{(?:choice:)?(.+)\}\}/);
    if (match) {
      const rawOptions = match[1].split("|");
      const starIdx = rawOptions.findIndex((o) => o.startsWith("*"));
      const options = starIdx >= 0 ? [rawOptions[starIdx].slice(1), ...rawOptions.filter((_, idx) => idx !== starIdx).map((o) => o.startsWith("*") ? o.slice(1) : o)] : rawOptions;
      segments.push({ type: "choice", options });
    } else {
      segments.push({ type: "text", value: part });
    }
  });
  return segments;
}

function renderInlineChoiceLine(content: string): React.ReactNode[] {
  const segments = parseInlineChoiceSegments(content);
  let hasTextBefore = false;
  return segments.map((seg, i) => {
    if (seg.type === "choice") {
      const atStart = !hasTextBefore;
      return (
        <span key={i} className="inline-flex items-center gap-1 mx-0.5">
          {seg.options.map((opt, oi) => {
            const isCorrect = oi === 0;
            const label = atStart ? opt.charAt(0).toUpperCase() + opt.slice(1) : opt;
            return (
              <span key={oi} className="inline-flex items-center">
                {oi > 0 && <span className="mx-0.5 text-muted-foreground">/</span>}
                <span className={`inline-flex items-center gap-0.5 font-semibold ${isCorrect ? "font-semibold text-green-700 bg-green-50 px-1 rounded" : ""}`}>
                  <span className={`inline-block w-3 h-3 rounded-full border-[1.5px] shrink-0 ${isCorrect ? "border-green-500 bg-green-500" : "border-muted-foreground/40"}`} style={{ position: "relative", top: 2 }} />
                  <span>{label}</span>
                </span>
              </span>
            );
          })}
        </span>
      );
    }
    if (seg.value.trim().length > 0) hasTextBefore = true;
    return <span key={i}>{renderTextWithSup(seg.value)}</span>;
  });
}

function InlineChoicesRenderer({ block, interactive }: { block: InlineChoicesBlock; interactive: boolean }) {
  const { state, dispatch } = useEditor();
  const items = migrateInlineChoicesBlock(block);
  const activeIdx = state.activeItemIndex;
  const rawBlock = state.blocks.find((b) => b.id === block.id) as InlineChoicesBlock | undefined;
  const rawItems = rawBlock ? migrateInlineChoicesBlock(rawBlock) : items;

  const updateItemContent = React.useCallback((index: number, newContent: string) => {
    const newItems = [...rawItems]; newItems[index] = { ...newItems[index], content: newContent };
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
  }, [rawItems, dispatch, block.id]);

  const moveItem = React.useCallback((index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rawItems.length) return;
    const newItems = [...rawItems]; [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
    if (activeIdx === index) dispatch({ type: "SET_ACTIVE_ITEM", payload: newIndex });
  }, [rawItems, dispatch, block.id, activeIdx]);

  return (
    <div>
      {items.map((item, idx) => (
        <div key={item.id || idx} className={`flex items-center gap-3 border-b last:border-b-0 py-2 cursor-pointer rounded-sm transition-colors ${!interactive && activeIdx === idx ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-muted/30"}`} onClick={() => !interactive && dispatch({ type: "SET_ACTIVE_ITEM", payload: idx })}>
          <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(idx + 1).padStart(2, "0")}</span>
          <span className="flex-1">{renderInlineChoiceLine(item.content)}</span>
          {!interactive && (
            <div className="flex flex-col shrink-0" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="h-3.5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveItem(idx, -1)} disabled={idx === 0}><ChevronUp className="h-3 w-3" /></button>
              <button type="button" className="h-3.5 w-5 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}><ChevronDown className="h-3 w-3" /></button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Word Search ─────────────────────────────────────────────
function generateWordSearchGrid(words: string[], cols: number, rows: number): string[][] {
  const grid: string[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ""));
  const directions = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [1, -1]];
  const upperWords = words.map((w) => w.toUpperCase().replace(/\s+/g, ""));

  for (const word of upperWords) {
    let placed = false, attempts = 0;
    while (!placed && attempts < 100) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const startRow = dir[0] < 0 ? Math.floor(Math.random() * (rows - word.length)) + word.length - 1 : Math.floor(Math.random() * (rows - (dir[0] > 0 ? word.length - 1 : 0)));
      const startCol = dir[1] < 0 ? Math.floor(Math.random() * (cols - word.length)) + word.length - 1 : Math.floor(Math.random() * (cols - (dir[1] > 0 ? word.length - 1 : 0)));
      let canPlace = true;
      for (let k = 0; k < word.length; k++) {
        const r = startRow + k * dir[0], c = startCol + k * dir[1];
        if (r < 0 || r >= rows || c < 0 || c >= cols || (grid[r][c] !== "" && grid[r][c] !== word[k])) { canPlace = false; break; }
      }
      if (canPlace) { for (let k = 0; k < word.length; k++) grid[startRow + k * dir[0]][startCol + k * dir[1]] = word[k]; placed = true; }
    }
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (grid[r][c] === "") grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
  return grid;
}

function WordSearchRenderer({ block }: { block: WordSearchBlock }) {
  const { dispatch } = useEditor();
  const cols = block.gridCols ?? 24, rows = block.gridRows ?? 12;

  React.useEffect(() => {
    if (block.grid.length === 0 && block.words.length > 0) {
      dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { grid: generateWordSearchGrid(block.words, cols, rows) } } });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      {block.grid.length > 0 && (
        <div className="w-full">
          <table className="w-full border-separate border-spacing-0">
            <tbody>
              {block.grid.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="text-center text-base font-mono font-semibold select-none border border-border aspect-square">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {block.showWordList && (
        <div className="flex flex-wrap gap-2">{block.words.map((word, i) => <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs font-medium uppercase tracking-wide">{word}</span>)}</div>
      )}
      <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { grid: generateWordSearchGrid(block.words, cols, rows) } } })}>
        <ArrowUpDown className="h-3 w-3" /> Gitter neu generieren
      </button>
    </div>
  );
}

// ─── Sorting Categories ──────────────────────────────────────
function SortingCategoriesRenderer({ block }: { block: SortingCategoriesBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  return (
    <div className="space-y-3">
      <div className="font-medium outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; localeUpdate(block.id, "instruction", value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { instruction: value } } })); }}>
        {block.instruction}
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${block.categories.length}, 1fr)` }}>
        {block.categories.map((cat) => {
          const catItems = block.items.filter((item) => cat.correctItems.includes(item.id));
          return (
            <div key={cat.id} className="rounded-sm border border-border overflow-hidden">
              <div className="bg-muted px-3 py-2"><span className="font-semibold">{cat.label}</span></div>
              <div className="p-2 space-y-1.5 min-h-[60px]">
                {catItems.map((item) => <div key={item.id} className="p-2 rounded border border-border bg-card text-base">{item.text}</div>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Unscramble Words ────────────────────────────────────────
function scrambleWord(word: string, keepFirst: boolean, lowercase: boolean): string {
  let letters = word.replace(/\s+/g, "").split("");
  let firstLetter = "";
  if (keepFirst && letters.length > 1) { firstLetter = letters[0]; letters = letters.slice(1); }
  for (let i = letters.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [letters[i], letters[j]] = [letters[j], letters[i]]; }
  let result = keepFirst ? firstLetter + letters.join("") : letters.join("");
  if (lowercase) result = result.toLowerCase();
  return result;
}

function UnscrambleWordsRenderer({ block }: { block: UnscrambleWordsBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const orderedWords = block.itemOrder ? block.itemOrder.map((id) => block.words.find((w) => w.id === id)).filter((w): w is NonNullable<typeof w> => !!w).concat(block.words.filter((w) => !block.itemOrder!.includes(w.id))) : block.words;

  return (
    <div className="space-y-3">
      <div className="font-medium outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; localeUpdate(block.id, "instruction", value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { instruction: value } } })); }}>
        {block.instruction}
      </div>
      <div className="space-y-2">
        {orderedWords.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 group/item p-3 rounded-sm border border-border">
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-base tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{scrambleWord(item.word, block.keepFirstLetter, block.lowercaseAll)}</span>
            <span className="text-muted-foreground text-xs">→</span>
            <span contentEditable suppressContentEditableWarning className="text-base outline-none flex-1 border-b border-transparent focus:border-muted-foreground/30 transition-colors font-medium text-green-700" onBlur={(e) => { const value = e.currentTarget.textContent || ""; const arrIdx = block.words.findIndex((w) => w.id === item.id); localeUpdate(block.id, `words.${arrIdx}.word`, value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { words: block.words.map((w) => w.id === item.id ? { ...w, word: value } : w) } } })); }}>
              {item.word}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fix Sentences ───────────────────────────────────────────
function FixSentencesRenderer({ block }: { block: FixSentencesBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  return (
    <div className="space-y-3">
      <div className="font-medium outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; localeUpdate(block.id, "instruction", value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { instruction: value } } })); }}>
        {block.instruction}
      </div>
      <div className="space-y-3">
        {block.sentences.map((item, i) => {
          const parts = item.sentence.split(" | ");
          return (
            <div key={item.id} className="group/item rounded-sm border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-muted/30">
                <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {parts.map((part, pi) => <span key={pi} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 font-medium">{part.trim()}</span>)}
                </div>
              </div>
              <div className="px-3 py-2">
                <input type="text" value={item.sentence} onChange={(e) => { const value = e.target.value; const arrIdx = block.sentences.findIndex((s) => s.id === item.id); localeUpdate(block.id, `sentences.${arrIdx}.sentence`, value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { sentences: block.sentences.map((s) => s.id === item.id ? { ...s, sentence: value } : s) } } })); }} className="w-full text-xs text-muted-foreground bg-transparent border-0 outline-none font-mono" placeholder="Teil A | Teil B | Teil C" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Complete Sentences ──────────────────────────────────────
function CompleteSentencesRenderer({ block }: { block: CompleteSentencesBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  return (
    <div className="space-y-3">
      <div className="font-medium outline-none" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; localeUpdate(block.id, "instruction", value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { instruction: value } } })); }}>
        {block.instruction}
      </div>
      <div>
        {block.sentences.map((item, i) => (
          <div key={item.id} className="group/item flex items-center gap-3 py-2 border-b last:border-b-0">
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="outline-none block flex-1" contentEditable suppressContentEditableWarning onBlur={(e) => { const value = e.currentTarget.textContent || ""; localeUpdate(block.id, `sentences.${i}.beginning`, value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { sentences: block.sentences.map((s) => s.id === item.id ? { ...s, beginning: value } : s) } } })); }}>
              {item.beginning}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Verb Table ──────────────────────────────────────────────
function VerbTableRenderer({ block }: { block: VerbTableBlock }) {
  const { dispatch } = useEditor();
  const isSplit = block.splitConjugation ?? false;
  const colCount = isSplit ? 5 : 4;

  const updateRow = (section: "singularRows" | "pluralRows", id: string, updates: Partial<VerbTableRow>) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { [section]: (block[section] as VerbTableRow[]).map((r) => r.id === id ? { ...r, ...updates } : r) } } });
  };

  const renderRows = (section: "singularRows" | "pluralRows", isLast: boolean) => (
    <>
      {block[section].map((row, rowIdx) => {
        const isLastRow = isLast && rowIdx === block[section].length - 1;
        return (
          <tr key={row.id} className="group/row">
            <td className={`border-r ${isLastRow ? "" : "border-b"} border-border px-3 py-2`}>
              <input type="text" value={row.person} onChange={(e) => updateRow(section, row.id, { person: e.target.value })} className="w-full text-muted-foreground bg-transparent border-0 outline-none uppercase" style={{ fontSize: 14 }} />
            </td>
            <td className={`border-r ${isLastRow ? "" : "border-b"} border-border px-3 py-2`}>
              <input type="text" value={row.detail || ""} onChange={(e) => updateRow(section, row.id, { detail: e.target.value || undefined })} className="w-full text-muted-foreground bg-transparent border-0 outline-none uppercase" style={{ fontSize: 14 }} placeholder="—" />
            </td>
            <td className={`border-r ${isLastRow ? "" : "border-b"} border-border px-3 py-2`}>
              <input type="text" value={row.pronoun} onChange={(e) => updateRow(section, row.id, { pronoun: e.target.value })} className="w-full font-bold bg-transparent border-0 outline-none" style={{ fontSize: 16 }} />
            </td>
            <td className={`${isLastRow ? "" : "border-b"} border-border px-3 py-2 ${isSplit ? "border-r" : ""}`}>
              <input type="text" value={row.conjugation} onChange={(e) => updateRow(section, row.id, { conjugation: e.target.value })} className="flex-1 font-bold text-red-500 bg-transparent border-0 outline-none w-full" style={{ fontSize: 16 }} />
            </td>
            {isSplit && (
              <td className={`${isLastRow ? "" : "border-b"} border-border px-3 py-2`}>
                <input type="text" value={row.conjugation2 || ""} onChange={(e) => updateRow(section, row.id, { conjugation2: e.target.value || undefined })} className="flex-1 font-bold text-red-500 bg-transparent border-0 outline-none w-full" style={{ fontSize: 16 }} />
              </td>
            )}
          </tr>
        );
      })}
    </>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-muted-foreground" style={{ fontSize: 16 }}>Verb:</span>
        <input type="text" value={block.verb} onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { verb: e.target.value } } })} className="font-bold bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 outline-none" style={{ fontSize: 18 }} />
      </div>
      <table className="w-full border-separate border-spacing-0 border-2 border-border rounded-sm overflow-hidden" style={{ fontSize: 16 }}>
        <tbody>
          <tr className="bg-muted/50"><td colSpan={colCount} className="border-b border-border px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground" style={{ fontSize: 16 }}>Singular</td></tr>
          {renderRows("singularRows", false)}
          <tr className="bg-muted/50"><td colSpan={colCount} className="border-b border-border px-3 py-2 font-bold uppercase tracking-wider text-muted-foreground" style={{ fontSize: 16 }}>Plural</td></tr>
          {renderRows("pluralRows", true)}
        </tbody>
      </table>
    </div>
  );
}

// ─── Chart ───────────────────────────────────────────────────
function ChartRenderer({ block }: { block: ChartBlock }) {
  return (
    <div className="space-y-2">
      {block.title && <p className="text-center text-lg font-semibold">{block.title}</p>}
      <div className="w-full h-[300px] bg-muted/30 rounded flex items-center justify-center text-muted-foreground text-sm">
        Diagramm ({block.chartType}) — {block.data.length} Datenpunkte
      </div>
    </div>
  );
}

// ─── Dialogue ────────────────────────────────────────────────
function DialogueRenderer({ block, interactive }: { block: DialogueBlock; interactive: boolean }) {
  const speakerIconMap: Record<string, React.ReactNode> = {
    triangle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="w-3.5 h-3.5"><polygon points="12,3 22,21 2,21" /></svg>,
    square: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
    diamond: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="w-3.5 h-3.5"><polygon points="12,2 22,12 12,22 2,12" /></svg>,
    circle: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /></svg>,
  };

  const gapAnswers: string[] = [];
  for (const item of block.items) {
    const matches = item.text.matchAll(/\{\{blank:([^}]+)\}\}/g);
    for (const m of matches) { const raw = m[1]; gapAnswers.push(raw.includes(",") ? raw.substring(0, raw.lastIndexOf(",")).trim() : raw.trim()); }
  }

  const renderDialogueText = (text: string) => {
    const parts = text.split(/(\{\{blank:[^}]+\}\})/g);
    return parts.map((part, i) => {
      const match = part.match(/\{\{blank:(.+)\}\}/);
      if (match) {
        const raw = match[1]; const commaIdx = raw.lastIndexOf(",");
        let answer: string, widthMultiplier = 1;
        if (commaIdx !== -1) { answer = raw.substring(0, commaIdx).trim(); const parsed = Number(raw.substring(commaIdx + 1).trim()); if (!isNaN(parsed)) widthMultiplier = parsed; } else answer = raw.trim();
        const widthStyle = widthMultiplier === 0 ? { flex: 1 } as React.CSSProperties : { minWidth: `${80 * widthMultiplier}px` } as React.CSSProperties;
        return interactive ? (
          <input key={i} type="text" placeholder="…" className="border-b border-dashed border-muted-foreground/30 bg-transparent px-2 py-0.5 text-center mx-1 focus:outline-none focus:border-primary inline" style={widthMultiplier === 0 ? { flex: 1 } : { width: `${112 * widthMultiplier}px` }} />
        ) : (
          <span key={i} className="inline-block border-b border-dashed border-muted-foreground/30 px-2 py-0.5 text-center mx-1 text-muted-foreground text-xs" style={widthStyle}>{answer}</span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-3">
      {block.instruction && <p className="text-base text-muted-foreground">{block.instruction}</p>}
      {block.showWordBank && gapAnswers.length > 0 && (
        <div className="rounded p-3 border border-dashed border-muted-foreground/30">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Wortbank</div>
          <div className="flex flex-wrap gap-2">{[...gapAnswers].sort(() => Math.random() - 0.5).map((text, i) => <span key={i} className="px-2 py-0.5 bg-background rounded border text-xs">{text}</span>)}</div>
        </div>
      )}
      <div className="space-y-0">
        {block.items.map((item, i) => (
          <div key={item.id} className={`flex items-center gap-3 py-2 border-b ${i === 0 ? "border-t" : ""}`}>
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-xs font-bold text-muted-foreground bg-white border border-border box-border w-6 h-6 rounded flex items-center justify-center shrink-0">{speakerIconMap[item.icon] || speakerIconMap.circle}</span>
            <div className="flex-1 flex flex-wrap items-baseline">{renderDialogueText(item.text)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Numbered Label ──────────────────────────────────────────
function NumberedLabelRenderer({ block }: { block: NumberedLabelBlock }) {
  const { state } = useEditor();
  const allNL = React.useMemo(() => collectNumberedLabelBlocks(state.blocks), [state.blocks]);
  const index = allNL.findIndex((b) => b.id === block.id);
  const displayNumber = String(block.startNumber + (index >= 0 ? index : 0)).padStart(2, "0");

  return (
    <div className="rounded bg-slate-100 px-2 py-1">
      <span className="font-semibold text-slate-800" style={{ paddingLeft: "2em", textIndent: "-2em", display: "block" }}>
        {block.prefix}{displayNumber}{block.suffix ? `\u2003${block.suffix}` : ""}
      </span>
    </div>
  );
}

// ─── Linked Blocks ───────────────────────────────────────────
function LinkedBlocksRenderer({ block }: { block: LinkedBlocksBlock }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-sm border-2 border-dashed border-primary/30 bg-primary/5">
      <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center shrink-0"><Link2 className="h-5 w-5 text-primary" /></div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{block.worksheetTitle || "Verknüpftes Arbeitsblatt"}</p>
        <p className="text-xs text-muted-foreground">/{block.worksheetSlug}</p>
      </div>
    </div>
  );
}

// ─── Dos and Don'ts ──────────────────────────────────────────
function DosAndDontsRenderer({ block }: { block: DosAndDontsBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const updateItem = (list: "dos" | "donts", index: number, text: string) => {
    localeUpdate(block.id, `${list}.${index}.text`, text, () => {
      const newItems = [...block[list]]; newItems[index] = { ...newItems[index], text };
      dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { [list]: newItems } } });
    });
  };

  const addItem = (list: "dos" | "donts") => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { [list]: [...block[list], { id: crypto.randomUUID(), text: "" }] } } });
  };

  const removeItem = (list: "dos" | "donts", index: number) => {
    if (block[list].length <= 1) return;
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { [list]: block[list].filter((_, i) => i !== index) } } });
  };

  const renderList = (list: "dos" | "donts", title: string, titleField: "dosTitle" | "dontsTitle", color: string, icon: React.ReactNode) => (
    <div className={block.layout === "vertical" ? "w-full" : "flex-1 min-w-[200px]"}>
      {block.showTitles !== false && (
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
          <input type="text" value={title} onChange={(e) => { localeUpdate(block.id, titleField, e.target.value, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { [titleField]: e.target.value } } })); }} className="font-semibold text-base bg-transparent border-none outline-none flex-1" />
        </div>
      )}
      <div className="space-y-2">
        {block[list].map((item, i) => (
          <div key={item.id} className="flex items-start gap-2 group">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${color}`}>{icon}</div>
            <input type="text" value={item.text} onChange={(e) => updateItem(list, i, e.target.value)} placeholder="…" className="flex-1 bg-transparent border-none outline-none border-b border-transparent hover:border-muted-foreground/20 focus:border-primary transition-colors" />
            <button onClick={() => removeItem(list, i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button onClick={() => addItem(list)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"><Plus className="h-3 w-3" /> Hinzufügen</button>
      </div>
    </div>
  );

  return (
    <div className={block.layout === "vertical" ? "flex flex-col gap-6" : "flex gap-6 flex-wrap"}>
      {renderList("dos", block.dosTitle, "dosTitle", "bg-emerald-100 text-emerald-600", <Check className="h-3.5 w-3.5" />)}
      {renderList("donts", block.dontsTitle, "dontsTitle", "bg-red-100 text-red-500", <X className="h-3.5 w-3.5" />)}
    </div>
  );
}

// ─── Text Comparison ─────────────────────────────────────────
function TextComparisonRenderer({ block }: { block: TextComparisonBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const renderSide = (content: string, field: "leftContent" | "rightContent", color: string, flagSrc: string) => (
    <div className="flex-1 min-w-0">
      <div className="flex">
        <div className="py-1 text-xs font-semibold rounded-t-sm text-center uppercase flex items-center justify-center border border-b-0" style={{ width: 44, borderColor: color }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagSrc} alt="" className="h-4 w-6 object-cover" />
        </div>
      </div>
      <div className="border border-dashed rounded-sm rounded-tl-none py-3 pr-3 pl-6" style={{ borderColor: color, color }}>
        <RichTextEditor content={content} onChange={(html) => localeUpdate(block.id, field, html, () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { [field]: html } } }))} placeholder="…" />
      </div>
    </div>
  );

  return (
    <div className="flex gap-4">
      {renderSide(block.leftContent, "leftContent", "#3A4F40", "/flags/ch.svg")}
      {renderSide(block.rightContent, "rightContent", "#990033", "/flags/de.svg")}
    </div>
  );
}

// ─── Numbered Items ──────────────────────────────────────────
function NumberedItemsRenderer({ block }: { block: NumberedItemsBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  const updateItem = (index: number, content: string) => {
    localeUpdate(block.id, `items.${index}.content`, content, () => {
      const newItems = [...block.items]; newItems[index] = { ...newItems[index], content };
      dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
    });
  };

  const addItem = () => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: [...block.items, { id: crypto.randomUUID(), content: "" }] } } });
  const removeItem = (index: number) => { if (block.items.length <= 1) return; dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.filter((_, i) => i !== index) } } }); };

  const MAIN_HEX = new Set(["#4a3d55", "#7a5550", "#3a4f40", "#5a4540", "#3a6570", "#990033"]);
  const hasBg = !!block.bgColor;
  const textWhite = hasBg && MAIN_HEX.has(block.bgColor!.toLowerCase());
  const radius = block.borderRadius ?? 8;

  return (
    <div className="space-y-2">
      {block.items.map((item, i) => (
        <div key={item.id} className="relative group">
          <div className="flex gap-0 font-semibold tiptap-compact" style={hasBg ? { backgroundColor: `${block.bgColor}18`, borderRadius: `${radius}px`, color: block.bgColor } : undefined}>
            <div className={`shrink-0 w-10 flex items-center justify-center text-base font-bold${!hasBg ? " bg-primary/10 text-primary" : ""}`} style={{ ...(hasBg ? { backgroundColor: block.bgColor, color: textWhite ? "#fff" : undefined } : {}), borderRadius: hasBg ? `${radius}px 0 0 ${radius}px` : `${radius}px` }}>
              {String(block.startNumber + i).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0 px-3 py-2">
              <RichTextEditor content={item.content} onChange={(html) => updateItem(i, html)} placeholder="…" editorClassName="prose prose-sm max-w-none focus:outline-none px-0 py-0" />
            </div>
          </div>
          <button onClick={() => removeItem(i)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-11"><Plus className="h-3 w-3" /> Hinzufügen</button>
    </div>
  );
}

// ─── Accordion ───────────────────────────────────────────────
function AccordionRenderer({ block, mode }: { block: AccordionBlock; mode: ViewMode }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const updateTitle = (index: number, title: string) => {
    localeUpdate(block.id, `items.${index}.title`, title, () => {
      const newItems = [...block.items]; newItems[index] = { ...newItems[index], title };
      dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
    });
  };

  const addItem = () => {
    const newItems = [...block.items, { id: crypto.randomUUID(), title: "", children: [] as WorksheetBlock[] }];
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
    setOpenIndex(newItems.length - 1);
  };

  const removeItem = (index: number) => {
    if (block.items.length <= 1) return;
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.filter((_, i) => i !== index) } } });
    if (openIndex === index) setOpenIndex(null);
    else if (openIndex !== null && openIndex > index) setOpenIndex(openIndex - 1);
  };

  return (
    <div className="space-y-1">
      {block.items.map((item, i) => (
        <div key={item.id} className="relative group border border-border rounded-sm overflow-hidden">
          <button type="button" onClick={() => setOpenIndex(openIndex === i ? null : i)} className="flex items-center gap-2 w-full px-3 py-2.5 text-left bg-muted/40 hover:bg-muted/60 transition-colors">
            {block.showNumbers && <span className="shrink-0 font-black">{String(i + 1).padStart(2, "0")}</span>}
            <input type="text" value={item.title} onChange={(e) => updateTitle(i, e.target.value)} onClick={(e) => e.stopPropagation()} placeholder="Titel…" className="flex-1 bg-transparent border-none outline-none font-medium placeholder:text-muted-foreground/50" />
            <button onClick={(e) => { e.stopPropagation(); removeItem(i); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            {openIndex === i ? <Minus className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </button>
          {openIndex === i && (
            <div className="px-3 py-3">
              <DroppableColumn blockId={block.id} colIndex={i} isEmpty={(item.children ?? []).length === 0}>
                {(item.children ?? []).map((childBlock) => (
                  <ColumnChildBlock key={childBlock.id} block={childBlock} mode={mode} parentBlockId={block.id} colIndex={i} />
                ))}
              </DroppableColumn>
            </div>
          )}
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"><Plus className="h-3 w-3" /> Hinzufügen</button>
    </div>
  );
}

// ─── Audio ───────────────────────────────────────────────────
function AudioRenderer({ block }: { block: AudioBlock }) {
  if (!block.src) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
        {block.title || "Keine Audiodatei — in Eigenschaften hochladen"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
      <audio src={block.src} controls className="flex-1 h-8" />
      {block.title && <span className="text-sm font-medium text-slate-700 shrink-0">{block.title}</span>}
    </div>
  );
}

// ─── AI Prompt (UI only) ────────────────────────────────────
function AiPromptRenderer({ block }: { block: AiPromptBlock }) {
  return (
    <div className="border border-dashed border-violet-300 rounded-sm p-4 bg-violet-50/30 space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
        <Sparkles className="h-3.5 w-3.5" />
        {block.description || "KI-Prompt"}
      </div>
      {block.instructions && <p className="text-sm text-slate-600">{block.instructions}</p>}
      <textarea value={block.userInput} readOnly placeholder="Benutzereingabe…" className="w-full min-h-[100px] p-3 rounded-sm border border-slate-200 bg-white text-sm resize-y" />
      <p className="text-xs text-muted-foreground italic">KI-Backend wird später angebunden.</p>
    </div>
  );
}

// ─── AI Tool (UI only) ──────────────────────────────────────
function AiToolRenderer({ block }: { block: AiToolBlock }) {
  return (
    <div className="border border-dashed border-violet-300 rounded-sm p-4 bg-violet-50/30 space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
        <Bot className="h-3.5 w-3.5" /> KI-Tool
      </div>
      {block.toolId ? (
        <div className="space-y-2">
          <span className="text-sm font-medium text-slate-700">{block.toolTitle || "Unbenanntes Tool"}</span>
          {block.toolDescription && <p className="text-xs text-muted-foreground">{block.toolDescription}</p>}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic">Tool in Eigenschaften auswählen</div>
      )}
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────
function TableBlockRenderer({ block }: { block: TableBlock }) {
  const { dispatch } = useEditor();
  const { localeUpdate } = useLocaleAwareEdit();

  return (
    <div className={`table-block table-style-${block.tableStyle ?? "default"}`}>
      <RichTextEditor
        content={block.content}
        onChange={(html) =>
          localeUpdate(block.id, "content", html, () =>
            dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { content: html } } })
          )
        }
        placeholder="Tabelle bearbeiten…"
      />
      {block.caption && <p className="text-xs text-muted-foreground text-center mt-1 italic">{block.caption}</p>}
    </div>
  );
}

// ─── Column Child Block ──────────────────────────────────────
const colChildVisibilityIcons = { both: Eye, print: Printer, online: Monitor };
const colChildVisibilityCycle: BlockVisibility[] = ["both", "print", "online"];

function ColumnChildBlock({ block, mode, parentBlockId, colIndex }: { block: WorksheetBlock; mode: ViewMode; parentBlockId: string; colIndex: number }) {
  const { state, dispatch, duplicateBlock } = useEditor();
  const isSelected = state.selectedBlockId === block.id;
  const isVisibleInMode = block.visibility === "both" || block.visibility === mode;
  const VisIcon = colChildVisibilityIcons[block.visibility];

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `col-child-${block.id}`,
    data: { type: "column-child", blockId: block.id, parentBlockId, colIndex },
  });

  const cycleVisibility = () => {
    const currentIdx = colChildVisibilityCycle.indexOf(block.visibility);
    dispatch({ type: "SET_BLOCK_VISIBILITY", payload: { id: block.id, visibility: colChildVisibilityCycle[(currentIdx + 1) % colChildVisibilityCycle.length] } });
  };

  return (
    <div
      ref={setNodeRef}
      className={`group/child relative rounded-sm border transition-all ${isDragging ? "opacity-50 shadow-lg z-50" : ""} ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border"} ${!isVisibleInMode ? "opacity-40" : ""}`}
      onClick={(e) => { e.stopPropagation(); dispatch({ type: "SELECT_BLOCK", payload: block.id }); }}
    >
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-background border rounded-sm shadow-sm px-1 py-0.5 z-20 ${isSelected ? "opacity-100" : "opacity-0 group-hover/child:opacity-100"} transition-opacity`}>
        <button className="p-0.5 hover:bg-muted rounded cursor-grab active:cursor-grabbing" {...attributes} {...listeners}><GripVertical className="h-3 w-3 text-muted-foreground" /></button>
        <button className="p-0.5 hover:bg-muted rounded" title={`Sichtbarkeit: ${block.visibility}`} onClick={(e) => { e.stopPropagation(); cycleVisibility(); }}><VisIcon className="h-3 w-3 text-muted-foreground" /></button>
        <button className="p-0.5 hover:bg-muted rounded" onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }}><Copy className="h-3 w-3 text-muted-foreground" /></button>
        <button className="p-0.5 hover:bg-destructive/10 rounded" onClick={(e) => { e.stopPropagation(); dispatch({ type: "REMOVE_BLOCK", payload: block.id }); }}><Trash2 className="h-3 w-3 text-destructive" /></button>
      </div>
      {block.visibility !== "both" && <Badge variant="secondary" className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0 z-20">{block.visibility === "print" ? "Print" : "Online"}</Badge>}
      <div className="p-2"><BlockRenderer block={block} mode={mode} /></div>
    </div>
  );
}

// ─── Droppable Column ────────────────────────────────────────
function DroppableColumn({ blockId, colIndex, children, isEmpty }: { blockId: string; colIndex: number; children: React.ReactNode; isEmpty: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${blockId}-${colIndex}`,
    data: { type: "column-drop", blockId, colIndex },
  });

  return (
    <div ref={setNodeRef} className={`border border-dashed rounded-sm p-3 min-h-[80px] space-y-2 transition-colors ${isOver ? "border-primary bg-primary/5" : "border-border"}`}>
      {isEmpty ? (
        <p className={`text-xs text-center py-4 transition-colors ${isOver ? "text-primary opacity-70" : "text-muted-foreground opacity-50"}`}>
          {isOver ? "Hier ablegen" : `Spalte ${colIndex + 1}`}
        </p>
      ) : children}
    </div>
  );
}

// ─── Columns ─────────────────────────────────────────────────
function ColumnsRenderer({ block, mode }: { block: ColumnsBlock; mode: ViewMode }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.columns}, 1fr)` }}>
      {block.children.map((col, colIndex) => (
        <DroppableColumn key={colIndex} blockId={block.id} colIndex={colIndex} isEmpty={col.length === 0}>
          {col.map((childBlock) => <ColumnChildBlock key={childBlock.id} block={childBlock} mode={mode} parentBlockId={block.id} colIndex={colIndex} />)}
        </DroppableColumn>
      ))}
    </div>
  );
}

// ─── Main Block Renderer ─────────────────────────────────────
export function BlockRenderer({ block: rawBlock, mode }: { block: WorksheetBlock; mode: ViewMode }) {
  const { state } = useEditor();
  const interactive = mode === "online";

  // Apply CH overrides when in CH locale mode
  const block = React.useMemo(() => {
    if (state.localeMode !== "CH") return rawBlock;
    const overrides = state.settings.chOverrides?.[rawBlock.id];
    let effective = replaceEszett(rawBlock);
    if (overrides) {
      for (const [fieldPath, value] of Object.entries(overrides)) {
        effective = setByPath(effective, fieldPath, value) as WorksheetBlock;
      }
    }
    return { ...effective, id: rawBlock.id, type: rawBlock.type } as WorksheetBlock;
  }, [rawBlock, state.localeMode, state.settings.chOverrides]);

  switch (block.type) {
    case "heading": return <HeadingRenderer block={block} />;
    case "text": return <TextRenderer block={block} />;
    case "image": return <ImageRenderer block={block} />;
    case "image-cards": return <ImageCardsRenderer block={block} />;
    case "text-cards": return <TextCardsRenderer block={block} />;
    case "spacer": return <SpacerRenderer block={block} />;
    case "divider": return <DividerRenderer block={block} />;
    case "logo-divider": return <LogoDividerRenderer block={block} />;
    case "page-break": return <PageBreakRenderer block={block} />;
    case "writing-lines": return <WritingLinesRenderer block={block} />;
    case "writing-rows": return <WritingRowsRenderer block={block} />;
    case "multiple-choice": return <MultipleChoiceRenderer block={block} interactive={interactive} />;
    case "fill-in-blank": return <FillInBlankRenderer block={block} interactive={interactive} />;
    case "fill-in-blank-items": return <FillInBlankItemsRenderer block={block} interactive={interactive} />;
    case "matching": return <MatchingRenderer block={block} />;
    case "two-column-fill": return <TwoColumnFillRenderer block={block} />;
    case "glossary": return <GlossaryRenderer block={block} />;
    case "open-response": return <OpenResponseRenderer block={block} interactive={interactive} />;
    case "word-bank": return <WordBankRenderer block={block} />;
    case "number-line": return <NumberLineRenderer block={block} />;
    case "true-false-matrix": return <TrueFalseMatrixRenderer block={block} interactive={interactive} />;
    case "article-training": return <ArticleTrainingRenderer block={block} interactive={interactive} />;
    case "order-items": return <OrderItemsRenderer block={block} interactive={interactive} />;
    case "inline-choices": return <InlineChoicesRenderer block={block} interactive={interactive} />;
    case "word-search": return <WordSearchRenderer block={block} />;
    case "sorting-categories": return <SortingCategoriesRenderer block={block} />;
    case "unscramble-words": return <UnscrambleWordsRenderer block={block} />;
    case "fix-sentences": return <FixSentencesRenderer block={block} />;
    case "complete-sentences": return <CompleteSentencesRenderer block={block} />;
    case "verb-table": return <VerbTableRenderer block={block} />;
    case "chart": return <ChartRenderer block={block} />;
    case "dialogue": return <DialogueRenderer block={block} interactive={interactive} />;
    case "numbered-label": return <NumberedLabelRenderer block={block} />;
    case "columns": return <ColumnsRenderer block={block} mode={mode} />;
    case "linked-blocks": return <LinkedBlocksRenderer block={block} />;
    case "text-snippet": return <TextSnippetRenderer block={block} />;
    case "email-skeleton": return <EmailSkeletonRenderer block={block} />;
    case "job-application": return <JobApplicationRenderer block={block} />;
    case "dos-and-donts": return <DosAndDontsRenderer block={block} />;
    case "text-comparison": return <TextComparisonRenderer block={block} />;
    case "numbered-items": return <NumberedItemsRenderer block={block} />;
    case "accordion": return <AccordionRenderer block={block} mode={mode} />;
    case "ai-prompt": return <AiPromptRenderer block={block} />;
    case "ai-tool": return <AiToolRenderer block={block} />;
    case "table": return <TableBlockRenderer block={block} />;
    case "audio": return <AudioRenderer block={block} />;
    default:
      return <div className="p-4 bg-red-50 text-red-600 rounded text-sm">Unbekannter Blocktyp: {(block as WorksheetBlock).type}</div>;
  }
}
