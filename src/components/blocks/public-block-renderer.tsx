"use client";

import React, { useState, useMemo } from "react";
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
  ArticleTrainingBlock,
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
} from "@/types/worksheet";
import { migrateInlineChoicesBlock } from "@/types/worksheet-constants";
import {
  Siren,
  BadgeAlert,
  Goal,
  ArrowRight,
  Check,
  X,
  Mail,
  Paperclip,
  FormInput,
  Link2,
  Minus,
  Plus,
  Sparkles,
  Bot,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────

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

/** Sanitize and render rich text HTML content */
function RichHtml({ html, className }: { html: string; className?: string }) {
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

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

// ─── Inline choice parsing ──────────────────────────────────

function parseInlineChoiceSegments(content: string) {
  const parts = content.split(/(\{\{(?:choice:)?[^}]+\}\})/g);
  const segments: Array<{ type: "text"; value: string } | { type: "choice"; options: string[] }> = [];
  parts.forEach((part) => {
    const match = part.match(/\{\{(?:choice:)?(.+)\}\}/);
    if (match) {
      const rawOptions = match[1].split("|");
      const starIdx = rawOptions.findIndex((o) => o.startsWith("*"));
      const options = starIdx >= 0
        ? [rawOptions[starIdx].slice(1), ...rawOptions.filter((_, idx) => idx !== starIdx).map((o) => o.startsWith("*") ? o.slice(1) : o)]
        : rawOptions;
      segments.push({ type: "choice", options });
    } else {
      segments.push({ type: "text", value: part });
    }
  });
  return segments;
}

function scrambleWord(word: string, keepFirst: boolean, lowercase: boolean): string {
  let letters = word.replace(/\s+/g, "").split("");
  let firstLetter = "";
  if (keepFirst && letters.length > 1) { firstLetter = letters[0]; letters = letters.slice(1); }
  for (let i = letters.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [letters[i], letters[j]] = [letters[j], letters[i]]; }
  let result = keepFirst ? firstLetter + letters.join("") : letters.join("");
  if (lowercase) result = result.toLowerCase();
  return result;
}

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

// ─── Fill-in-blank rendering helper ─────────────────────────

function renderBlankContent(content: string, interactive: boolean): React.ReactNode[] {
  const parts = content.split(/(\{\{blank:[^}]+\}\})/g);
  return parts.map((part, i) => {
    const match = part.match(/\{\{blank:(.+)\}\}/);
    if (match) {
      const raw = match[1];
      const commaIdx = raw.lastIndexOf(",");
      let widthMultiplier = 1;
      if (commaIdx !== -1) {
        const parsed = Number(raw.substring(commaIdx + 1).trim());
        if (!isNaN(parsed)) widthMultiplier = parsed;
      }
      return interactive ? (
        <input key={i} type="text" placeholder="…" className="border-b border-dashed border-muted-foreground/30 bg-transparent px-2 py-0.5 text-center mx-1 focus:outline-none focus:border-primary inline" style={widthMultiplier === 0 ? { flex: 1 } : { width: `${112 * widthMultiplier}px` }} />
      ) : (
        <span key={i} className="inline-block border-b border-dashed border-muted-foreground/30 px-2 py-0.5 text-center mx-1" style={widthMultiplier === 0 ? { flex: 1 } : { minWidth: `${80 * widthMultiplier}px` }}>&nbsp;</span>
      );
    }
    return <span key={i}>{renderTextWithSup(part)}</span>;
  });
}

// ─── Block Renderers ────────────────────────────────────────

function HeadingRenderer({ block }: { block: HeadingBlock }) {
  const Tag = `h${block.level}` as keyof React.JSX.IntrinsicElements;
  const sizes = { 1: "text-3xl", 2: "text-2xl", 3: "text-xl" };
  return <Tag className={`${sizes[block.level]} font-bold`} style={block.level === 3 ? { fontWeight: 800 } : undefined}>{block.content}</Tag>;
}

function TextRenderer({ block }: { block: TextBlock }) {
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

  const contentEl = (
    <div className={isRows ? "tiptap-rows" : undefined}>
      {imageEl}
      <RichHtml html={block.content} className="prose prose-sm max-w-none" />
      {imageEl && <div style={{ clear: "both" }} />}
    </div>
  );

  if (isLernziel) {
    return (
      <div className="flex gap-0 border-2 rounded-sm overflow-hidden" style={{ borderColor: "#4A3D55", backgroundColor: "#4A3D5510", color: "#4A3D55" }}>
        <div className="shrink-0 w-10 flex items-center justify-center" style={{ backgroundColor: "#4A3D55" }}>
          <Goal className="h-5 w-5" style={{ color: "#ffffff" }} />
        </div>
        <div className="flex-1 min-w-0 px-3 py-2">{contentEl}</div>
      </div>
    );
  }

  if (hasHinweisBox) {
    return (
      <div className="flex gap-0 border-2 rounded-sm" style={{ borderColor: hinweisConfig.border, backgroundColor: hinweisConfig.bg, color: hinweisConfig.color }}>
        <div className="shrink-0 w-10 flex items-center justify-center rounded-l-sm">
          {hinweisConfig.icon}
        </div>
        <div className="flex-1 min-w-0 px-3 py-2">{contentEl}</div>
      </div>
    );
  }

  return contentEl;
}

function TextSnippetRenderer({ block }: { block: TextSnippetBlock }) {
  return <RichHtml html={block.content} className="prose prose-sm max-w-none" />;
}

function EmailSkeletonRenderer({ block }: { block: EmailSkeletonBlock }) {
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
      <div className={`border overflow-hidden bg-white shadow-sm ${isStyled ? "rounded-sm rounded-tl-none" : "rounded-sm"}`} style={isStyled ? { borderColor: color } : undefined}>
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
          <RichHtml html={block.body} className="prose prose-sm max-w-none" />
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

function JobApplicationRenderer({ block }: { block: JobApplicationBlock }) {
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
      <div className={`border overflow-hidden bg-white shadow-sm ${isStyled ? "rounded-sm rounded-tl-none" : "rounded-sm"}`} style={{ borderColor: isStyled ? color : "#475569" }}>
        <div className="flex items-center gap-2 px-4 py-2 border-b" style={isStyled ? { backgroundColor: `${color}0D`, borderColor: `${color}4D` } : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
          <FormInput className="h-4 w-4" style={{ color: isStyled ? color : "#475569" }} />
        </div>
        <div className="px-4 pt-3 pb-4 space-y-1.5">
          {[
            ["Stelle", block.position],
            ["Vorname", block.firstName],
            ["Nachname", block.applicantName],
            ["E-Mail", block.email],
            ["Telefon", block.phone],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center gap-4">
              <span className="font-semibold text-slate-400 w-24 shrink-0 text-sm">{label}</span>
              <div className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">{value}</div>
            </div>
          ))}
          <div className="flex items-start gap-4">
            <span className="font-semibold text-slate-400 w-24 shrink-0 text-sm pt-1.5">Nachricht</span>
            <div className="flex-1 rounded-sm border border-slate-200 bg-slate-50 px-3 py-1.5">
              <RichHtml html={block.message} className="prose prose-sm max-w-none" />
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

function ImageRenderer({ block }: { block: ImageBlock }) {
  if (!block.src) return null;
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

function ImageCardsRenderer({ block }: { block: ImageCardsBlock }) {
  return (
    <div className="space-y-3">
      {block.showWordBank && block.items.some(item => item.text) && (
        <div className="rounded p-3 border border-dashed border-muted-foreground/30">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Wortbank</div>
          <div className="flex flex-wrap gap-2">
            {block.items.filter(item => item.text).map((item) => (
              <span key={item.id} className="px-2 py-0.5 bg-background rounded border text-xs">{item.text}</span>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.columns}, 1fr)` }}>
        {block.items.map((item) => {
          const [arW, arH] = (block.imageAspectRatio ?? "1:1").split(":").map(Number);
          return (
            <div key={item.id} className="border rounded overflow-hidden bg-card">
              {item.src && (
                <div className="relative overflow-hidden mx-auto" style={{ width: `${block.imageScale ?? 100}%`, aspectRatio: `${arW} / ${arH}` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.src} alt={item.alt} className="absolute inset-0 w-full h-full object-cover" />
                </div>
              )}
              {item.text && <div className="p-2 text-center text-sm">{item.text}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TextCardsRenderer({ block }: { block: TextCardsBlock }) {
  const sizeClasses: Record<string, string> = { xs: "text-xs", sm: "text-sm", base: "text-base", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl" };
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.columns}, 1fr)` }}>
      {block.items.map((item) => (
        <div key={item.id} className={`${block.showBorder ? "border rounded" : ""} overflow-hidden bg-card`}>
          <div className={`p-3 ${sizeClasses[block.textSize ?? "base"]} text-center`}>{item.text}</div>
        </div>
      ))}
    </div>
  );
}

function SpacerRenderer({ block }: { block: SpacerBlock }) {
  return <div style={{ height: block.height }} />;
}

function DividerRenderer({ block }: { block: DividerBlock }) {
  return <hr className="my-2" style={{ borderStyle: block.style }} />;
}

function LogoDividerRenderer({ block: _block }: { block: LogoDividerBlock }) {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="w-6 h-0.5 bg-muted-foreground/20 rounded" />
    </div>
  );
}

function PageBreakRenderer({ block: _block }: { block: PageBreakBlock }) {
  return null;
}

function WritingLinesRenderer({ block }: { block: WritingLinesBlock }) {
  return (
    <div>
      {Array.from({ length: block.lineCount }).map((_, i) => (
        <div key={i} style={{ height: block.lineSpacing, borderBottom: "1px dashed var(--color-muted-foreground)", opacity: 1.0 }} />
      ))}
    </div>
  );
}

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

function MultipleChoiceRenderer({ block, interactive }: { block: MultipleChoiceBlock; interactive: boolean }) {
  return (
    <div className="space-y-3">
      <p className="font-medium">{block.question}</p>
      <div className="space-y-2">
        {block.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-3 p-3 rounded-sm border border-border">
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            {interactive && (
              <span className="flex items-center justify-center h-5 w-5 rounded-full border-2 border-gray-300 shrink-0" />
            )}
            <span className="text-base flex-1">{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FillInBlankRenderer({ block, interactive }: { block: FillInBlankBlock; interactive: boolean }) {
  return (
    <div className="leading-relaxed flex flex-wrap items-baseline">
      {renderBlankContent(block.content, interactive)}
    </div>
  );
}

function FillInBlankItemsRenderer({ block, interactive }: { block: FillInBlankItemsBlock; interactive: boolean }) {
  const wordBankAnswers = useMemo(() => {
    if (!block.showWordBank) return [];
    const answers: string[] = [];
    for (const item of block.items) {
      const matches = item.content.matchAll(/\{\{blank:([^,}]+)/g);
      for (const m of matches) answers.push(m[1].trim());
    }
    return answers;
  }, [block.items, block.showWordBank]);

  return (
    <div>
      {block.showWordBank && wordBankAnswers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-2 bg-muted/40 rounded-sm">
          {wordBankAnswers.map((word, i) => <span key={i} className="px-2 py-0.5 bg-background border border-border rounded text-sm">{word}</span>)}
        </div>
      )}
      {block.items.map((item, idx) => (
        <div key={item.id || idx} className="flex items-center gap-3 border-b last:border-b-0 py-2">
          <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(idx + 1).padStart(2, "0")}</span>
          <span className="flex-1 leading-relaxed flex flex-wrap items-baseline">
            {renderBlankContent(item.content, interactive)}
          </span>
        </div>
      ))}
    </div>
  );
}

function MatchingRenderer({ block }: { block: MatchingBlock }) {
  const shuffledRight = useMemo(() => [...block.pairs].sort(() => Math.random() - 0.5), [block.pairs]);
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

function TwoColumnFillRenderer({ block }: { block: TwoColumnFillBlock }) {
  const wordBankItems = block.items.map((item) => (block.fillSide === "left" ? item.left : item.right)).filter(Boolean);
  const gridCols = block.colRatio === "1-2" ? "1fr 2fr" : block.colRatio === "2-1" ? "2fr 1fr" : "1fr 1fr";

  return (
    <div className="space-y-3">
      <p className="text-base text-muted-foreground">{block.instruction}</p>
      {block.showWordBank && wordBankItems.length > 0 && (
        <div className="rounded p-3 border border-dashed border-muted-foreground/30">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Wortbank</div>
          <div className="flex flex-wrap gap-2">{wordBankItems.map((text, i) => <span key={i} className="px-2 py-0.5 bg-background rounded border text-xs">{text}</span>)}</div>
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

function WordBankRenderer({ block }: { block: WordBankBlock }) {
  return (
    <div className="border-2 border-dashed border-muted-foreground/30 rounded-sm p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Wortbank</p>
      <div className="flex flex-wrap gap-2">{block.words.map((word, i) => <span key={i} className="px-3 py-1 bg-muted rounded-full text-base font-medium">{word}</span>)}</div>
    </div>
  );
}

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

function TrueFalseMatrixRenderer({ block, interactive }: { block: TrueFalseMatrixBlock; interactive: boolean }) {
  const orderedStatements = block.statementOrder
    ? block.statementOrder.map((id) => block.statements.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s).concat(block.statements.filter((s) => !block.statementOrder!.includes(s.id)))
    : block.statements;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left py-2 pr-2 border-b font-bold text-foreground">{block.statementColumnHeader || ""}</th>
          <th className="w-16 p-2 border-b text-center font-medium text-muted-foreground">{block.trueLabel || "Richtig"}</th>
          <th className="w-16 p-2 border-b text-center font-medium text-muted-foreground">{block.falseLabel || "Falsch"}</th>
        </tr>
      </thead>
      <tbody>
        {orderedStatements.map((stmt, i) => (
          <tr key={stmt.id} className="border-b last:border-b-0">
            <td className="py-2 pr-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span>{stmt.text}</span>
              </div>
            </td>
            <td className="p-2 text-center align-middle">
              {interactive ? <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 inline-block" /> : null}
            </td>
            <td className="p-2 text-center align-middle">
              {interactive ? <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 inline-block" /> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ArticleTrainingRenderer({ block, interactive }: { block: ArticleTrainingBlock; interactive: boolean }) {
  const articles = ["der", "das", "die"];
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="w-8 p-2 border-b"></th>
          {articles.map((a) => <th key={a} className="w-14 p-2 border-b text-center font-medium text-muted-foreground">{a}</th>)}
          <th className="text-left py-2 px-2 border-b font-bold text-foreground">Nomen</th>
          {block.showWritingLine && <th className="text-left py-2 px-2 border-b font-bold text-muted-foreground">Schreiblinie</th>}
        </tr>
      </thead>
      <tbody>
        {block.items.map((item, idx) => (
          <tr key={item.id} className="border-b last:border-b-0">
            <td className="p-2 text-center"><span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(idx + 1).padStart(2, "0")}</span></td>
            {articles.map((a) => (
              <td key={a} className="p-2 text-center">
                {interactive ? <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 inline-block" /> : null}
              </td>
            ))}
            <td className="py-2 px-2">{item.text}</td>
            {block.showWritingLine && <td className="py-2 px-2"><div className="border-b border-muted-foreground/30 h-6 min-w-[100px]" /></td>}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OrderItemsRenderer({ block }: { block: OrderItemsBlock }) {
  return (
    <div className="space-y-2">
      <p className="font-medium">{block.instruction}</p>
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-sm border border-border">
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-base flex-1">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InlineChoicesRenderer({ block, interactive }: { block: InlineChoicesBlock; interactive: boolean }) {
  const items = migrateInlineChoicesBlock(block);

  const renderLine = (content: string): React.ReactNode[] => {
    const segments = parseInlineChoiceSegments(content);
    return segments.map((seg, i) => {
      if (seg.type === "choice") {
        return interactive ? (
          <select key={i} className="mx-1 border border-border rounded px-2 py-0.5 text-sm bg-background">
            <option value="">…</option>
            {seg.options.map((opt, oi) => <option key={oi} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <span key={i} className="inline-flex items-center gap-1 mx-0.5">
            {seg.options.map((opt, oi) => (
              <span key={oi} className="inline-flex items-center">
                {oi > 0 && <span className="mx-0.5 text-muted-foreground">/</span>}
                <span className="inline-flex items-center gap-0.5">
                  <span className="inline-block w-3 h-3 rounded-full border-[1.5px] border-muted-foreground/40 shrink-0" style={{ position: "relative", top: 2 }} />
                  <span>{opt}</span>
                </span>
              </span>
            ))}
          </span>
        );
      }
      return <span key={i}>{renderTextWithSup(seg.value)}</span>;
    });
  };

  return (
    <div>
      {items.map((item, idx) => (
        <div key={item.id || idx} className="flex items-center gap-3 border-b last:border-b-0 py-2">
          <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(idx + 1).padStart(2, "0")}</span>
          <span className="flex-1">{renderLine(item.content)}</span>
        </div>
      ))}
    </div>
  );
}

function WordSearchRenderer({ block }: { block: WordSearchBlock }) {
  const cols = block.gridCols ?? 24, rows = block.gridRows ?? 12;
  const grid = useMemo(() => {
    return block.grid.length > 0 ? block.grid : generateWordSearchGrid(block.words, cols, rows);
  }, [block.grid, block.words, cols, rows]);

  return (
    <div className="space-y-3">
      {grid.length > 0 && (
        <div className="w-full">
          <table className="w-full border-separate border-spacing-0">
            <tbody>
              {grid.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="text-center text-base font-mono font-semibold select-none border border-border aspect-square">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {block.showWordList && (
        <div className="flex flex-wrap gap-2">{block.words.map((word, i) => <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs font-medium uppercase tracking-wide">{word}</span>)}</div>
      )}
    </div>
  );
}

function SortingCategoriesRenderer({ block }: { block: SortingCategoriesBlock }) {
  return (
    <div className="space-y-3">
      <p className="font-medium">{block.instruction}</p>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${block.categories.length}, 1fr)` }}>
        {block.categories.map((cat) => (
          <div key={cat.id} className="rounded-sm border border-border overflow-hidden">
            <div className="bg-muted px-3 py-2"><span className="font-semibold">{cat.label}</span></div>
            <div className="p-2 space-y-1.5 min-h-[60px]" />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {block.items.map((item) => <span key={item.id} className="px-3 py-1 bg-muted rounded text-base">{item.text}</span>)}
      </div>
    </div>
  );
}

function UnscrambleWordsRenderer({ block }: { block: UnscrambleWordsBlock }) {
  const orderedWords = block.itemOrder
    ? block.itemOrder.map((id) => block.words.find((w) => w.id === id)).filter((w): w is NonNullable<typeof w> => !!w).concat(block.words.filter((w) => !block.itemOrder!.includes(w.id)))
    : block.words;

  return (
    <div className="space-y-3">
      <p className="font-medium">{block.instruction}</p>
      <div className="space-y-2">
        {orderedWords.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-sm border border-border">
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-base tracking-widest text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{scrambleWord(item.word, block.keepFirstLetter, block.lowercaseAll)}</span>
            <span className="text-muted-foreground text-xs">→</span>
            <span className="flex-1 border-b border-dashed border-muted-foreground/30">&nbsp;</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FixSentencesRenderer({ block }: { block: FixSentencesBlock }) {
  return (
    <div className="space-y-3">
      <p className="font-medium">{block.instruction}</p>
      <div className="space-y-3">
        {block.sentences.map((item, i) => {
          const parts = item.sentence.split(" | ");
          return (
            <div key={item.id} className="rounded-sm border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-muted/30">
                <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1 flex flex-wrap gap-1.5">
                  {parts.map((part, pi) => <span key={pi} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 font-medium">{part.trim()}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompleteSentencesRenderer({ block }: { block: CompleteSentencesBlock }) {
  return (
    <div className="space-y-3">
      <p className="font-medium">{block.instruction}</p>
      <div>
        {block.sentences.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-b-0">
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1">{item.beginning}<span className="inline-block border-b border-dashed border-muted-foreground/30 min-w-[120px] ml-1">&nbsp;</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerbTableRenderer({ block }: { block: VerbTableBlock }) {
  const isSplit = block.splitConjugation ?? false;
  const colCount = isSplit ? 5 : 4;

  const renderRows = (section: "singularRows" | "pluralRows", isLast: boolean) => (
    <>
      {block[section].map((row, rowIdx) => {
        const isLastRow = isLast && rowIdx === block[section].length - 1;
        return (
          <tr key={row.id}>
            <td className={`border-r ${isLastRow ? "" : "border-b"} border-border px-3 py-2 text-muted-foreground uppercase`} style={{ fontSize: 14 }}>{row.person}</td>
            <td className={`border-r ${isLastRow ? "" : "border-b"} border-border px-3 py-2 text-muted-foreground uppercase`} style={{ fontSize: 14 }}>{row.detail || "—"}</td>
            <td className={`border-r ${isLastRow ? "" : "border-b"} border-border px-3 py-2 font-bold`} style={{ fontSize: 16 }}>{row.pronoun}</td>
            <td className={`${isLastRow ? "" : "border-b"} border-border px-3 py-2 font-bold text-red-500 ${isSplit ? "border-r" : ""}`} style={{ fontSize: 16 }}>{row.conjugation}</td>
            {isSplit && <td className={`${isLastRow ? "" : "border-b"} border-border px-3 py-2 font-bold text-red-500`} style={{ fontSize: 16 }}>{row.conjugation2 || ""}</td>}
          </tr>
        );
      })}
    </>
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium text-muted-foreground" style={{ fontSize: 16 }}>Verb:</span>
        <span className="font-bold" style={{ fontSize: 18 }}>{block.verb}</span>
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

  return (
    <div className="space-y-3">
      {block.instruction && <p className="text-base text-muted-foreground">{block.instruction}</p>}
      {block.showWordBank && gapAnswers.length > 0 && (
        <div className="rounded p-3 border border-dashed border-muted-foreground/30">
          <div className="text-xs text-muted-foreground mb-2 font-medium">Wortbank</div>
          <div className="flex flex-wrap gap-2">{gapAnswers.map((text, i) => <span key={i} className="px-2 py-0.5 bg-background rounded border text-xs">{text}</span>)}</div>
        </div>
      )}
      <div className="space-y-0">
        {block.items.map((item, i) => (
          <div key={item.id} className={`flex items-center gap-3 py-2 border-b ${i === 0 ? "border-t" : ""}`}>
            <span className="text-xs font-bold text-muted-foreground bg-muted w-6 h-6 rounded flex items-center justify-center shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-xs font-bold text-muted-foreground bg-white border border-border box-border w-6 h-6 rounded flex items-center justify-center shrink-0">{speakerIconMap[item.icon] || speakerIconMap.circle}</span>
            <div className="flex-1 flex flex-wrap items-baseline">{renderBlankContent(item.text, interactive)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberedLabelRenderer({ block, allBlocks }: { block: NumberedLabelBlock; allBlocks: WorksheetBlock[] }) {
  const allNL = useMemo(() => collectNumberedLabelBlocks(allBlocks), [allBlocks]);
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

function DosAndDontsRenderer({ block }: { block: DosAndDontsBlock }) {
  const renderList = (items: { id: string; text: string }[], title: string, color: string, icon: React.ReactNode) => (
    <div className={block.layout === "vertical" ? "w-full" : "flex-1 min-w-[200px]"}>
      {block.showTitles !== false && (
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${color}`}>{icon}</div>
          <span className="font-semibold text-base">{title}</span>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${color}`}>{icon}</div>
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={block.layout === "vertical" ? "flex flex-col gap-6" : "flex gap-6 flex-wrap"}>
      {renderList(block.dos, block.dosTitle, "bg-emerald-100 text-emerald-600", <Check className="h-3.5 w-3.5" />)}
      {renderList(block.donts, block.dontsTitle, "bg-red-100 text-red-500", <X className="h-3.5 w-3.5" />)}
    </div>
  );
}

function TextComparisonRenderer({ block }: { block: TextComparisonBlock }) {
  const renderSide = (content: string, color: string, flagSrc: string) => (
    <div className="flex-1 min-w-0">
      <div className="flex">
        <div className="py-1 text-xs font-semibold rounded-t-sm text-center uppercase flex items-center justify-center border border-b-0" style={{ width: 44, borderColor: color }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={flagSrc} alt="" className="h-4 w-6 object-cover" />
        </div>
      </div>
      <div className="border rounded-sm rounded-tl-none py-3 pr-3 pl-6" style={{ borderColor: color, color }}>
        <RichHtml html={content} className="prose prose-sm max-w-none" />
      </div>
    </div>
  );

  return (
    <div className="flex gap-4">
      {renderSide(block.leftContent, "#3A4F40", "/flags/ch.svg")}
      {renderSide(block.rightContent, "#990033", "/flags/de.svg")}
    </div>
  );
}

function NumberedItemsRenderer({ block }: { block: NumberedItemsBlock }) {
  const MAIN_HEX = new Set(["#4a3d55", "#7a5550", "#3a4f40", "#5a4540", "#3a6570", "#990033"]);
  const hasBg = !!block.bgColor;
  const textWhite = hasBg && MAIN_HEX.has(block.bgColor!.toLowerCase());
  const radius = block.borderRadius ?? 8;

  return (
    <div className="space-y-2">
      {block.items.map((item, i) => (
        <div key={item.id} className="flex gap-0 font-semibold" style={hasBg ? { backgroundColor: `${block.bgColor}18`, borderRadius: `${radius}px`, color: block.bgColor } : undefined}>
          <div className={`shrink-0 w-10 flex items-center justify-center text-base font-bold${!hasBg ? " bg-primary/10 text-primary" : ""}`} style={{ ...(hasBg ? { backgroundColor: block.bgColor, color: textWhite ? "#fff" : undefined } : {}), borderRadius: hasBg ? `${radius}px 0 0 ${radius}px` : `${radius}px` }}>
            {String(block.startNumber + i).padStart(2, "0")}
          </div>
          <div className="flex-1 min-w-0 px-3 py-2">
            <RichHtml html={item.content} className="prose prose-sm max-w-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AccordionRenderer({ block, mode, allBlocks }: { block: AccordionBlock; mode: ViewMode; allBlocks: WorksheetBlock[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-1">
      {block.items.map((item, i) => (
        <div key={item.id} className="border border-border rounded-sm overflow-hidden">
          <button type="button" onClick={() => setOpenIndex(openIndex === i ? null : i)} className="flex items-center gap-2 w-full px-3 py-2.5 text-left bg-muted/40 hover:bg-muted/60 transition-colors">
            {block.showNumbers && <span className="shrink-0 font-black">{String(i + 1).padStart(2, "0")}</span>}
            <span className="flex-1 font-medium">{item.title}</span>
            {openIndex === i ? <Minus className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </button>
          {openIndex === i && (
            <div className="px-3 py-3 space-y-4">
              {(item.children ?? []).map((childBlock) => (
                <PublicBlock key={childBlock.id} block={childBlock} mode={mode} allBlocks={allBlocks} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AudioRenderer({ block }: { block: AudioBlock }) {
  if (!block.src) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
      <audio src={block.src} controls className="flex-1 h-8" />
      {block.title && <span className="text-sm font-medium text-slate-700 shrink-0">{block.title}</span>}
    </div>
  );
}

function AiPromptRenderer({ block }: { block: AiPromptBlock }) {
  return (
    <div className="border border-violet-200 rounded-sm p-4 bg-violet-50/30 space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
        <Sparkles className="h-3.5 w-3.5" />
        {block.description || "KI-Prompt"}
      </div>
      {block.instructions && <p className="text-sm text-slate-600">{block.instructions}</p>}
      <textarea placeholder="Eingabe…" className="w-full min-h-[100px] p-3 rounded-sm border border-slate-200 bg-white text-sm resize-y" />
    </div>
  );
}

function AiToolRenderer({ block }: { block: AiToolBlock }) {
  return (
    <div className="border border-violet-200 rounded-sm p-4 bg-violet-50/30 space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-violet-600 font-medium">
        <Bot className="h-3.5 w-3.5" /> KI-Tool
      </div>
      {block.toolTitle && <span className="text-sm font-medium text-slate-700">{block.toolTitle}</span>}
      {block.toolDescription && <p className="text-xs text-muted-foreground">{block.toolDescription}</p>}
    </div>
  );
}

function TableBlockRenderer({ block }: { block: TableBlock }) {
  return (
    <div className={`table-block table-style-${block.tableStyle ?? "default"}`}>
      <RichHtml html={block.content} />
      {block.caption && <p className="text-xs text-muted-foreground text-center mt-1 italic">{block.caption}</p>}
    </div>
  );
}

function ColumnsRenderer({ block, mode, allBlocks }: { block: ColumnsBlock; mode: ViewMode; allBlocks: WorksheetBlock[] }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.columns}, 1fr)` }}>
      {block.children.map((col, colIndex) => (
        <div key={colIndex} className="space-y-4">
          {col.map((childBlock) => (
            <PublicBlock key={childBlock.id} block={childBlock} mode={mode} allBlocks={allBlocks} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Public Block Component ─────────────────────────────────

function PublicBlock({ block, mode, allBlocks }: { block: WorksheetBlock; mode: ViewMode; allBlocks: WorksheetBlock[] }) {
  // Filter by visibility
  if (block.visibility !== "both" && block.visibility !== mode) return null;

  const interactive = mode === "online";

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
    case "order-items": return <OrderItemsRenderer block={block} />;
    case "inline-choices": return <InlineChoicesRenderer block={block} interactive={interactive} />;
    case "word-search": return <WordSearchRenderer block={block} />;
    case "sorting-categories": return <SortingCategoriesRenderer block={block} />;
    case "unscramble-words": return <UnscrambleWordsRenderer block={block} />;
    case "fix-sentences": return <FixSentencesRenderer block={block} />;
    case "complete-sentences": return <CompleteSentencesRenderer block={block} />;
    case "verb-table": return <VerbTableRenderer block={block} />;
    case "chart": return <ChartRenderer block={block} />;
    case "dialogue": return <DialogueRenderer block={block} interactive={interactive} />;
    case "numbered-label": return <NumberedLabelRenderer block={block} allBlocks={allBlocks} />;
    case "columns": return <ColumnsRenderer block={block} mode={mode} allBlocks={allBlocks} />;
    case "linked-blocks": return <LinkedBlocksRenderer block={block} />;
    case "text-snippet": return <TextSnippetRenderer block={block} />;
    case "email-skeleton": return <EmailSkeletonRenderer block={block} />;
    case "job-application": return <JobApplicationRenderer block={block} />;
    case "dos-and-donts": return <DosAndDontsRenderer block={block} />;
    case "text-comparison": return <TextComparisonRenderer block={block} />;
    case "numbered-items": return <NumberedItemsRenderer block={block} />;
    case "accordion": return <AccordionRenderer block={block} mode={mode} allBlocks={allBlocks} />;
    case "ai-prompt": return <AiPromptRenderer block={block} />;
    case "ai-tool": return <AiToolRenderer block={block} />;
    case "table": return <TableBlockRenderer block={block} />;
    case "audio": return <AudioRenderer block={block} />;
    default: return null;
  }
}

// ─── Exported Renderer ──────────────────────────────────────

interface PublicBlockRendererProps {
  blocks: WorksheetBlock[];
  mode?: ViewMode;
}

export function PublicBlockRenderer({ blocks, mode = "online" }: PublicBlockRendererProps) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <PublicBlock key={block.id} block={block} mode={mode} allBlocks={blocks} />
      ))}
    </div>
  );
}
