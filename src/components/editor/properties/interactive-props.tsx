"use client";

import React from "react";
import { useEditor } from "@/store/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MultipleChoiceBlock,
  MultipleChoiceOption,
  OpenResponseBlock,
  FillInBlankBlock,
  FillInBlankItemsBlock,
  FillInBlankItem,
  MatchingBlock,
  MatchingPair,
  TwoColumnFillBlock,
  TwoColumnFillItem,
  WordBankBlock,
  TrueFalseMatrixBlock,
  ArticleTrainingBlock,
  ArticleAnswer,
  OrderItemsBlock,
  InlineChoicesBlock,
  InlineChoiceItem,
  WordSearchBlock,
  SortingCategoriesBlock,
  SortingCategory,
  SortingItem,
  UnscrambleWordsBlock,
  UnscrambleWordItem,
  FixSentencesBlock,
  FixSentenceItem,
  CompleteSentencesBlock,
  CompleteSentenceItem,
  VerbTableBlock,
  VerbTableRow,
} from "@/types/worksheet";
import { ChInput } from "./shared";
import { Trash2, Plus, GripVertical, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

// ─── Multiple Choice ────────────────────────────────────────
export function MultipleChoiceProps({ block }: { block: MultipleChoiceBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<MultipleChoiceBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateOption = (index: number, updates: Partial<MultipleChoiceOption>) => {
    const newOpts = [...block.options];
    newOpts[index] = { ...newOpts[index], ...updates };
    update({ options: newOpts });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Frage</Label>
        <ChInput blockId={block.id} fieldPath="question" baseValue={block.question} onBaseChange={(v) => update({ question: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Mehrfachauswahl</Label>
        <Switch checked={block.allowMultiple} onCheckedChange={(v) => update({ allowMultiple: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Optionen</Label>
        {block.options.map((opt, i) => (
          <div key={opt.id} className="flex items-center gap-1.5">
            <button
              type="button"
              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs ${opt.isCorrect ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}
              onClick={() => updateOption(i, { isCorrect: !opt.isCorrect })}
              title="Korrekte Antwort markieren"
            >
              {opt.isCorrect && "✓"}
            </button>
            <ChInput blockId={block.id} fieldPath={`options.${i}.text`} baseValue={opt.text} onBaseChange={(v) => updateOption(i, { text: v })} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ options: block.options.filter((_, idx) => idx !== i) })} disabled={block.options.length <= 2}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ options: [...block.options, { id: crypto.randomUUID(), text: "", isCorrect: false }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Option hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Open Response ──────────────────────────────────────────
export function OpenResponseProps({ block }: { block: OpenResponseBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Frage</Label>
        <ChInput blockId={block.id} fieldPath="question" baseValue={block.question} onBaseChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { question: v } } })} multiline />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Antwortzeilen</Label>
          <span className="text-xs text-muted-foreground">{block.lines}</span>
        </div>
        <Slider value={[block.lines]} min={1} max={15} step={1} onValueChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { lines: Array.isArray(v) ? v[0] : v } } })} />
      </div>
    </div>
  );
}

// ─── Fill-in-blank ──────────────────────────────────────────
export function FillInBlankProps({ block }: { block: FillInBlankBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Text mit Lücken</Label>
        <p className="text-xs text-muted-foreground mb-1">Verwende {"{{blank:Antwort}}"} für Lücken.</p>
        <ChInput blockId={block.id} fieldPath="content" baseValue={block.content} onBaseChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { content: v } } })} multiline />
      </div>
    </div>
  );
}

// ─── Fill-in-blank Items ────────────────────────────────────
export function FillInBlankItemsProps({ block }: { block: FillInBlankItemsBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<FillInBlankItemsBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateItem = (index: number, content: string) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], content };
    update({ items: newItems });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Verwende {"{{blank:Antwort}}"} für Lücken.</p>
      <div className="space-y-2">
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
            <ChInput blockId={block.id} fieldPath={`items.${i}.content`} baseValue={item.content} onBaseChange={(v) => updateItem(i, v)} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ items: block.items.filter((_, idx) => idx !== i) })} disabled={block.items.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ items: [...block.items, { id: crypto.randomUUID(), content: "" }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Satz hinzufügen
        </Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <Label className="text-sm">Wortbank anzeigen</Label>
        <Switch checked={block.showWordBank} onCheckedChange={(v) => update({ showWordBank: v })} />
      </div>
    </div>
  );
}

// ─── Matching ───────────────────────────────────────────────
export function MatchingProps({ block }: { block: MatchingBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<MatchingBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updatePair = (index: number, updates: Partial<MatchingPair>) => {
    const newPairs = [...block.pairs];
    newPairs[index] = { ...newPairs[index], ...updates };
    update({ pairs: newPairs });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Erweiterte Zeilen</Label>
        <Switch checked={block.extendedRows ?? false} onCheckedChange={(v) => update({ extendedRows: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Paare</Label>
        {block.pairs.map((pair, i) => (
          <div key={pair.id} className="flex items-center gap-1">
            <ChInput blockId={block.id} fieldPath={`pairs.${i}.left`} baseValue={pair.left} onBaseChange={(v) => updatePair(i, { left: v })} className="h-8 text-xs flex-1" placeholder="Links" />
            <span className="text-xs text-muted-foreground">↔</span>
            <ChInput blockId={block.id} fieldPath={`pairs.${i}.right`} baseValue={pair.right} onBaseChange={(v) => updatePair(i, { right: v })} className="h-8 text-xs flex-1" placeholder="Rechts" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ pairs: block.pairs.filter((_, idx) => idx !== i) })} disabled={block.pairs.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ pairs: [...block.pairs, { id: crypto.randomUUID(), left: "", right: "" }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Paar hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Two-Column Fill ────────────────────────────────────────
export function TwoColumnFillProps({ block }: { block: TwoColumnFillBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<TwoColumnFillBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateItem = (index: number, updates: Partial<TwoColumnFillItem>) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], ...updates };
    update({ items: newItems });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Ausfüllseite</Label>
        <Select value={block.fillSide} onValueChange={(v) => update({ fillSide: v as "left" | "right" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Links</SelectItem>
            <SelectItem value="right">Rechts</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Spaltenverhältnis</Label>
        <Select value={block.colRatio ?? "1-1"} onValueChange={(v) => update({ colRatio: v as "1-1" | "1-2" | "2-1" })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1-1">1:1</SelectItem>
            <SelectItem value="1-2">1:2</SelectItem>
            <SelectItem value="2-1">2:1</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Erweiterte Zeilen</Label>
        <Switch checked={block.extendedRows ?? false} onCheckedChange={(v) => update({ extendedRows: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Wortbank anzeigen</Label>
        <Switch checked={block.showWordBank ?? false} onCheckedChange={(v) => update({ showWordBank: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Einträge</Label>
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1">
            <ChInput blockId={block.id} fieldPath={`items.${i}.left`} baseValue={item.left} onBaseChange={(v) => updateItem(i, { left: v })} className="h-8 text-xs flex-1" placeholder="Links" />
            <span className="text-xs text-muted-foreground">|</span>
            <ChInput blockId={block.id} fieldPath={`items.${i}.right`} baseValue={item.right} onBaseChange={(v) => updateItem(i, { right: v })} className="h-8 text-xs flex-1" placeholder="Rechts" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ items: block.items.filter((_, idx) => idx !== i) })} disabled={block.items.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ items: [...block.items, { id: crypto.randomUUID(), left: "", right: "" }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Zeile hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Word Bank ──────────────────────────────────────────────
export function WordBankProps({ block }: { block: WordBankBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<WordBankBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Wörter</Label>
        <p className="text-xs text-muted-foreground mb-1">Ein Wort pro Zeile</p>
        <textarea
          value={block.words.join("\n")}
          onChange={(e) => update({ words: e.target.value.split("\n").filter((w) => w.trim()) })}
          className="w-full min-h-[100px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          rows={5}
        />
      </div>
    </div>
  );
}

// ─── True/False Matrix ──────────────────────────────────────
export function TrueFalseMatrixProps({ block }: { block: TrueFalseMatrixBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<TrueFalseMatrixBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateStatement = (index: number, updates: Partial<{ text: string; correctAnswer: boolean }>) => {
    const stmts = [...block.statements];
    stmts[index] = { ...stmts[index], ...updates };
    update({ statements: stmts });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Richtig-Label</Label>
          <Input value={block.trueLabel ?? "Richtig"} onChange={(e) => update({ trueLabel: e.target.value })} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-xs">Falsch-Label</Label>
          <Input value={block.falseLabel ?? "Falsch"} onChange={(e) => update({ falseLabel: e.target.value })} className="h-8 text-xs" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Pill anzeigen</Label>
        <Switch checked={block.showPill ?? false} onCheckedChange={(v) => update({ showPill: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Aussagen</Label>
        {block.statements.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <button
              type="button"
              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${s.correctAnswer ? "border-emerald-500 bg-emerald-500 text-white" : "border-red-300 bg-red-50 text-red-500"}`}
              onClick={() => updateStatement(i, { correctAnswer: !s.correctAnswer })}
              title="Korrekte Antwort umschalten"
            >{s.correctAnswer ? "R" : "F"}</button>
            <ChInput blockId={block.id} fieldPath={`statements.${i}.text`} baseValue={s.text} onBaseChange={(v) => updateStatement(i, { text: v })} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ statements: block.statements.filter((_, idx) => idx !== i) })} disabled={block.statements.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ statements: [...block.statements, { id: crypto.randomUUID(), text: "", correctAnswer: true }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Aussage hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Article Training ───────────────────────────────────────
export function ArticleTrainingProps({ block }: { block: ArticleTrainingBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<ArticleTrainingBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateItem = (index: number, updates: Partial<{ text: string; correctArticle: ArticleAnswer }>) => {
    const items = [...block.items];
    items[index] = { ...items[index], ...updates };
    update({ items });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Schreiblinie anzeigen</Label>
        <Switch checked={block.showWritingLine} onCheckedChange={(v) => update({ showWritingLine: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Wörter</Label>
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <Select value={item.correctArticle} onValueChange={(v) => updateItem(i, { correctArticle: v as ArticleAnswer })}>
              <SelectTrigger className="w-16 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="der">der</SelectItem>
                <SelectItem value="das">das</SelectItem>
                <SelectItem value="die">die</SelectItem>
              </SelectContent>
            </Select>
            <ChInput blockId={block.id} fieldPath={`items.${i}.text`} baseValue={item.text} onBaseChange={(v) => updateItem(i, { text: v })} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ items: block.items.filter((_, idx) => idx !== i) })} disabled={block.items.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ items: [...block.items, { id: crypto.randomUUID(), text: "", correctArticle: "der" as ArticleAnswer }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Wort hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Order Items ────────────────────────────────────────────
export function OrderItemsProps({ block }: { block: OrderItemsBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<OrderItemsBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateItem = (index: number, updates: Partial<{ text: string; correctPosition: number }>) => {
    const items = [...block.items];
    items[index] = { ...items[index], ...updates };
    update({ items });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Pill anzeigen</Label>
        <Switch checked={block.showPill ?? false} onCheckedChange={(v) => update({ showPill: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Elemente (in korrekter Reihenfolge)</Label>
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
            <ChInput blockId={block.id} fieldPath={`items.${i}.text`} baseValue={item.text} onBaseChange={(v) => updateItem(i, { text: v })} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ items: block.items.filter((_, idx) => idx !== i) })} disabled={block.items.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ items: [...block.items, { id: crypto.randomUUID(), text: "", correctPosition: block.items.length + 1 }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Element hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Inline Choices ─────────────────────────────────────────
export function InlineChoicesProps({ block }: { block: InlineChoicesBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<InlineChoicesBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateItem = (index: number, content: string) => {
    const items = [...(block.items || [])];
    items[index] = { ...items[index], content };
    update({ items });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Verwende {"{{Richtig|Falsch1|Falsch2}}"} für Auswahlfelder. Das erste Wort ist die richtige Antwort.
      </p>
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Sätze</Label>
        {(block.items || []).map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
            <ChInput blockId={block.id} fieldPath={`items.${i}.content`} baseValue={item.content} onBaseChange={(v) => updateItem(i, v)} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ items: (block.items || []).filter((_, idx) => idx !== i) })} disabled={(block.items || []).length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ items: [...(block.items || []), { id: crypto.randomUUID(), content: "" }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Satz hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Word Search ────────────────────────────────────────────
export function WordSearchProps({ block }: { block: WordSearchBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<WordSearchBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Wörter</Label>
        <p className="text-xs text-muted-foreground mb-1">Ein Wort pro Zeile</p>
        <textarea
          value={block.words.join("\n")}
          onChange={(e) => update({ words: e.target.value.split("\n").filter((w) => w.trim()) })}
          className="w-full min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          rows={4}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Spalten</Label>
          <Input type="number" min={5} max={20} value={block.gridCols} onChange={(e) => update({ gridCols: Number(e.target.value) })} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-xs">Zeilen</Label>
          <Input type="number" min={5} max={20} value={block.gridRows} onChange={(e) => update({ gridRows: Number(e.target.value) })} className="h-8 text-xs" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Wortliste anzeigen</Label>
        <Switch checked={block.showWordList} onCheckedChange={(v) => update({ showWordList: v })} />
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={() => {
        // Generate a simple grid - just fill with random letters for now
        const cols = block.gridCols;
        const rows = block.gridRows;
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => letters[Math.floor(Math.random() * 26)]));
        update({ grid });
      }}>
        Gitter neu generieren
      </Button>
    </div>
  );
}

// ─── Sorting Categories ─────────────────────────────────────
export function SortingCategoriesProps({ block }: { block: SortingCategoriesBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<SortingCategoriesBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateCategory = (index: number, updates: Partial<SortingCategory>) => {
    const cats = [...block.categories];
    cats[index] = { ...cats[index], ...updates };
    update({ categories: cats });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Schreiblinien</Label>
        <Switch checked={block.showWritingLines} onCheckedChange={(v) => update({ showWritingLines: v })} />
      </div>
      <Separator />
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Kategorien</Label>
        {block.categories.map((cat, i) => (
          <div key={cat.id} className="space-y-1 p-2 border rounded">
            <div className="flex items-center gap-1">
              <ChInput blockId={block.id} fieldPath={`categories.${i}.label`} baseValue={cat.label} onBaseChange={(v) => updateCategory(i, { label: v })} className="h-8 text-xs font-semibold flex-1" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ categories: block.categories.filter((_, idx) => idx !== i) })} disabled={block.categories.length <= 1}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Korrekte Elemente (ein Wort pro Zeile):</p>
            <textarea
              value={cat.correctItems.join("\n")}
              onChange={(e) => updateCategory(i, { correctItems: e.target.value.split("\n").filter((w) => w.trim()) })}
              className="w-full min-h-[40px] rounded border text-xs p-1.5 resize-y"
              rows={2}
            />
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ categories: [...block.categories, { id: crypto.randomUUID(), label: "Kategorie", correctItems: [] }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Kategorie hinzufügen
        </Button>
      </div>
      <Separator />
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Zusätzliche Elemente</Label>
        <p className="text-[10px] text-muted-foreground mb-1">Elemente, die keiner Kategorie zugeordnet sind (zum Mischen)</p>
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5 mb-1">
            <ChInput blockId={block.id} fieldPath={`items.${i}.text`} baseValue={item.text} onBaseChange={(v) => { const items = [...block.items]; items[i] = { ...items[i], text: v }; update({ items }); }} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ items: block.items.filter((_, idx) => idx !== i) })}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ items: [...block.items, { id: crypto.randomUUID(), text: "" }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Element hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Unscramble Words ───────────────────────────────────────
export function UnscrambleWordsProps({ block }: { block: UnscrambleWordsBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<UnscrambleWordsBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Ersten Buchstaben behalten</Label>
        <Switch checked={block.keepFirstLetter} onCheckedChange={(v) => update({ keepFirstLetter: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Alles kleinschreiben</Label>
        <Switch checked={block.lowercaseAll} onCheckedChange={(v) => update({ lowercaseAll: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Pill anzeigen</Label>
        <Switch checked={block.showPill ?? false} onCheckedChange={(v) => update({ showPill: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Wörter</Label>
        {block.words.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
            <ChInput blockId={block.id} fieldPath={`words.${i}.word`} baseValue={item.word} onBaseChange={(v) => { const words = [...block.words]; words[i] = { ...words[i], word: v }; update({ words }); }} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ words: block.words.filter((_, idx) => idx !== i) })} disabled={block.words.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ words: [...block.words, { id: crypto.randomUUID(), word: "" }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Wort hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Fix Sentences ──────────────────────────────────────────
export function FixSentencesProps({ block }: { block: FixSentencesBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<FixSentencesBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Sätze (mit Fehlern)</Label>
        {block.sentences.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
            <ChInput blockId={block.id} fieldPath={`sentences.${i}.sentence`} baseValue={s.sentence} onBaseChange={(v) => { const sents = [...block.sentences]; sents[i] = { ...sents[i], sentence: v }; update({ sentences: sents }); }} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ sentences: block.sentences.filter((_, idx) => idx !== i) })} disabled={block.sentences.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ sentences: [...block.sentences, { id: crypto.randomUUID(), sentence: "" }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Satz hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Complete Sentences ─────────────────────────────────────
export function CompleteSentencesProps({ block }: { block: CompleteSentencesBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<CompleteSentencesBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => update({ instruction: v })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Satzanfänge</Label>
        {block.sentences.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
            <ChInput blockId={block.id} fieldPath={`sentences.${i}.beginning`} baseValue={s.beginning} onBaseChange={(v) => { const sents = [...block.sentences]; sents[i] = { ...sents[i], beginning: v }; update({ sentences: sents }); }} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ sentences: block.sentences.filter((_, idx) => idx !== i) })} disabled={block.sentences.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full" onClick={() => update({ sentences: [...block.sentences, { id: crypto.randomUUID(), beginning: "" }] })}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Satz hinzufügen
        </Button>
      </div>
    </div>
  );
}

// ─── Verb Table ─────────────────────────────────────────────
export function VerbTableProps({ block }: { block: VerbTableBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<VerbTableBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateRow = (group: "singularRows" | "pluralRows", index: number, updates: Partial<VerbTableRow>) => {
    const rows = [...block[group]];
    rows[index] = { ...rows[index], ...updates };
    update({ [group]: rows });
  };

  const renderRowGroup = (group: "singularRows" | "pluralRows", label: string) => (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">{label}</Label>
      {block[group].map((row, i) => (
        <div key={row.id} className="grid grid-cols-[60px_1fr_1fr] gap-1 items-center">
          <span className="text-xs text-muted-foreground truncate">{row.pronoun}</span>
          <ChInput blockId={block.id} fieldPath={`${group}.${i}.conjugation`} baseValue={row.conjugation} onBaseChange={(v) => updateRow(group, i, { conjugation: v })} className="h-7 text-xs" placeholder="Konjugation" />
          {block.splitConjugation && (
            <ChInput blockId={block.id} fieldPath={`${group}.${i}.conjugation2`} baseValue={row.conjugation2 || ""} onBaseChange={(v) => updateRow(group, i, { conjugation2: v })} className="h-7 text-xs" placeholder="Konjugation 2" />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Verb</Label>
        <ChInput blockId={block.id} fieldPath="verb" baseValue={block.verb} onBaseChange={(v) => update({ verb: v })} className="font-semibold" />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Konjugationen teilen</Label>
        <Switch checked={block.splitConjugation ?? false} onCheckedChange={(v) => update({ splitConjugation: v })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Konjugationen anzeigen</Label>
        <Switch checked={block.showConjugations ?? true} onCheckedChange={(v) => update({ showConjugations: v })} />
      </div>
      <Separator />
      {renderRowGroup("singularRows", "Singular")}
      <Separator />
      {renderRowGroup("pluralRows", "Plural")}
    </div>
  );
}
