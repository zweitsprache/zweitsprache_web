"use client";

import React from "react";
import { useEditor } from "@/store/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HeadingBlock,
  TextBlock,
  ImageBlock,
  ImageCardsBlock,
  TextCardsBlock,
  GlossaryBlock,
  ChartBlock,
  ChartDataPoint,
  NumberedLabelBlock,
  NumberedItemsBlock,
  DialogueBlock,
  DialogueItem,
  DialogueSpeakerIcon,
  EmailSkeletonBlock,
  EmailSkeletonStyle,
  EmailAttachment,
  JobApplicationBlock,
  JobApplicationStyle,
  DosAndDontsBlock,
  TextComparisonBlock,
  AccordionBlock,
  AudioBlock,
  TableBlock,
  TableStyle,
  TextBlockStyle,
  ImageBlockStyle,
} from "@/types/worksheet";
import { ChInput } from "./shared";
import {
  Trash2,
  Plus,
  ArrowUpDown,
  Bold,
  Italic,
  ChevronUp,
  ChevronDown,
  Check,
  X,
} from "lucide-react";

// ─── Heading ────────────────────────────────────────────────
export function HeadingProps({ block }: { block: HeadingBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Inhalt</Label>
        <ChInput
          blockId={block.id}
          fieldPath="content"
          baseValue={block.content}
          onBaseChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { content: v } } })}
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Stufe</Label>
        <Select
          value={String(block.level)}
          onValueChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { level: Number(v) as 1 | 2 | 3 } } })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Überschrift 1</SelectItem>
            <SelectItem value="2">Überschrift 2</SelectItem>
            <SelectItem value="3">Überschrift 3</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Text ───────────────────────────────────────────────────
export function TextProps({ block }: { block: TextBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Inhalt</Label>
        <p className="text-xs text-muted-foreground">Text direkt auf dem Canvas bearbeiten</p>
      </div>
      <Separator />
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Stil</Label>
        <select
          value={block.textStyle || "standard"}
          onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { textStyle: e.target.value as TextBlockStyle } } })}
          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="standard">Standard</option>
          <option value="example">Beispiel</option>
          <option value="example-standard">Beispiel (Standard)</option>
          <option value="example-improved">Beispiel (Verbessert)</option>
          <option value="hinweis">Hinweis</option>
          <option value="hinweis-wichtig">Hinweis (Wichtig)</option>
          <option value="hinweis-alarm">Hinweis (Alarm)</option>
          <option value="lernziel">Lernziel</option>
          <option value="rows">Zeilen</option>
        </select>
      </div>
      {(block.textStyle === "example" || block.textStyle === "example-standard" || block.textStyle === "example-improved") && (
        <>
          <Separator />
          <div>
            <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Kommentar</Label>
            <textarea
              value={block.comment || ""}
              onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { comment: e.target.value } } })}
              placeholder="Kommentar eingeben…"
              className="w-full min-h-[60px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              rows={3}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Image ──────────────────────────────────────────────────
export function ImageProps({ block }: { block: ImageBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Bild-URL</Label>
        {block.src ? (
          <div className="space-y-2">
            <div className="relative group/img rounded overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.src} alt={block.alt || ""} className="w-full" />
              <button
                type="button"
                onClick={() => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { src: "" } } })}
                className="absolute top-1 right-1 opacity-0 group-hover/img:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Input
              value={block.src}
              placeholder="https://..."
              onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { src: e.target.value } } })}
            />
          </div>
        )}
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Alt-Text</Label>
        <Input value={block.alt} onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { alt: e.target.value } } })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Breite (px)</Label>
        <Input type="number" value={block.width || ""} placeholder="Auto" onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { width: e.target.value ? Number(e.target.value) : undefined } } })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Höhe (px)</Label>
        <Input type="number" value={block.height || ""} placeholder="Auto" onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { height: e.target.value ? Number(e.target.value) : undefined } } })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Bildunterschrift</Label>
        <Input value={block.caption || ""} onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { caption: e.target.value } } })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Bildstil</Label>
        <select
          value={block.imageStyle || "standard"}
          onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { imageStyle: e.target.value as ImageBlockStyle } } })}
          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="standard">Standard</option>
          <option value="rounded">Abgerundet</option>
          <option value="shadow">Schatten</option>
          <option value="bordered">Umrahmt</option>
        </select>
      </div>
    </div>
  );
}

// ─── Image Cards ────────────────────────────────────────────
export function ImageCardsProps({ block }: { block: ImageCardsBlock }) {
  const { dispatch } = useEditor();

  const updateItem = (index: number, updates: Partial<{ text: string; src: string; alt: string }>) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], ...updates };
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
  };

  const removeItem = (index: number) => {
    const newItems = block.items.filter((_, i) => i !== index);
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
  };

  const addItem = () => {
    const newItems = [...block.items, { id: crypto.randomUUID(), imageUrl: "", text: "" }];
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Spalten</Label>
        <Select value={String(block.columns)} onValueChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { columns: Number(v) as 2 | 3 | 4 } } })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 Spalten</SelectItem>
            <SelectItem value="3">3 Spalten</SelectItem>
            <SelectItem value="4">4 Spalten</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Karten</Label>
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
            <Input value={item.text} onChange={(e) => updateItem(i, { text: e.target.value })} placeholder="Text" className="flex-1 h-8 text-xs" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(i)} disabled={block.items.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" /> Karte hinzufügen
        </Button>
      </div>
      <Separator />
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Seitenverhältnis</Label>
        <div className="flex gap-1">
          {(["16:9", "4:3", "1:1", "3:4", "9:16"] as const).map((ratio) => (
            <Button key={ratio} variant={(block.imageAspectRatio ?? "1:1") === ratio ? "default" : "outline"} size="sm" className="flex-1 text-xs px-1"
              onClick={() => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { imageAspectRatio: ratio } } })}
            >{ratio}</Button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Bildskalierung</Label>
          <span className="text-xs text-muted-foreground">{block.imageScale ?? 100}%</span>
        </div>
        <Slider value={[block.imageScale ?? 100]} min={10} max={100} step={5}
          onValueChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { imageScale: Array.isArray(v) ? v[0] : v } } })}
        />
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <Label className="text-sm">Schreiblinien anzeigen</Label>
        <Switch checked={block.showWritingLines ?? false}
          onCheckedChange={(checked) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { showWritingLines: checked } } })}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Wortbank anzeigen</Label>
        <Switch checked={block.showWordBank ?? false}
          onCheckedChange={(checked) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { showWordBank: checked } } })}
        />
      </div>
    </div>
  );
}

// ─── Text Cards ─────────────────────────────────────────────
export function TextCardsProps({ block }: { block: TextCardsBlock }) {
  const { dispatch } = useEditor();

  const updateItem = (index: number, updates: Partial<{ text: string; caption: string }>) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], ...updates };
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
  };

  const removeItem = (index: number) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.filter((_, i) => i !== index) } } });
  };

  const addItem = () => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: [...block.items, { id: crypto.randomUUID(), text: "", caption: "" }] } } });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Spalten</Label>
        <Select value={String(block.columns)} onValueChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { columns: Number(v) as 2 | 3 | 4 } } })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Karten</Label>
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground w-4 shrink-0 text-right">{i + 1}.</span>
            <Input value={item.text} onChange={(e) => updateItem(i, { text: e.target.value })} placeholder="Text" className="flex-1 h-8 text-xs" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(i)} disabled={block.items.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1" /> Karte hinzufügen
        </Button>
      </div>
      <Separator />
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Textgrösse</Label>
        <div className="flex gap-1">
          {(["xs", "sm", "base", "lg", "xl", "2xl"] as const).map((size) => (
            <Button key={size} variant={(block.textSize ?? "base") === size ? "default" : "outline"} size="sm" className="flex-1 text-xs px-1"
              onClick={() => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { textSize: size } } })}
            >{size}</Button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Rahmen anzeigen</Label>
        <Switch checked={block.showBorder ?? true} onCheckedChange={(checked) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { showBorder: checked } } })} />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Wortbank anzeigen</Label>
        <Switch checked={block.showWordBank ?? false} onCheckedChange={(checked) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { showWordBank: checked } } })} />
      </div>
    </div>
  );
}

// ─── Glossary ───────────────────────────────────────────────
export function GlossaryProps({ block }: { block: GlossaryBlock }) {
  const { dispatch } = useEditor();

  const updatePair = (index: number, updates: Partial<{ term: string; definition: string }>) => {
    const newPairs = [...block.pairs];
    newPairs[index] = { ...newPairs[index], ...updates };
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { pairs: newPairs } } });
  };

  const addPair = () => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { pairs: [...block.pairs, { id: crypto.randomUUID(), term: "Begriff", definition: "Definition" }] } } });
  };

  const removePair = (index: number) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { pairs: block.pairs.filter((_, i) => i !== index) } } });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { instruction: v } } })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Einträge</Label>
        {block.pairs.map((pair, i) => (
          <div key={pair.id} className="flex items-center gap-1">
            <div className="flex-1">
              <ChInput blockId={block.id} fieldPath={`pairs.${i}.term`} baseValue={pair.term} onBaseChange={(v) => updatePair(i, { term: v })} className="h-8 text-xs" placeholder="Begriff" />
            </div>
            <span className="text-xs text-muted-foreground">→</span>
            <div className="flex-1">
              <ChInput blockId={block.id} fieldPath={`pairs.${i}.definition`} baseValue={pair.definition} onBaseChange={(v) => updatePair(i, { definition: v })} className="h-8 text-xs" placeholder="Definition" />
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePair(i)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addPair} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" /> Eintrag hinzufügen</Button>
      </div>
    </div>
  );
}

// ─── Chart ──────────────────────────────────────────────────
const CHART_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#7c3aed", "#4f46e5", "#6d28d9"];

export function ChartProps({ block }: { block: ChartBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<ChartBlock>) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  const updateDataPoint = (index: number, field: keyof ChartDataPoint, value: string | number) => {
    const newData = [...block.data];
    newData[index] = { ...newData[index], [field]: value };
    update({ data: newData });
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md mb-2">Diagrammtyp</div>
        <Select value={block.chartType} onValueChange={(v) => update({ chartType: v as ChartBlock["chartType"] })}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Balken</SelectItem>
            <SelectItem value="pie">Kreis</SelectItem>
            <SelectItem value="line">Linie</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Legende anzeigen</Label>
          <Switch checked={block.showLegend} onCheckedChange={(v) => update({ showLegend: v })} />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Werte anzeigen</Label>
          <Switch checked={block.showValues} onCheckedChange={(v) => update({ showValues: v })} />
        </div>
      </div>
      <Separator />
      <div>
        <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md mb-2">Daten ({block.data.length})</div>
        <div className="space-y-2">
          {block.data.map((dp, i) => (
            <div key={dp.id} className="flex items-center gap-1.5">
              <input type="color" value={dp.color || CHART_COLORS[i % CHART_COLORS.length]} onChange={(e) => updateDataPoint(i, "color", e.target.value)} className="w-6 h-6 rounded border-0 cursor-pointer p-0" />
              <Input value={dp.label} onChange={(e) => updateDataPoint(i, "label", e.target.value)} className="text-xs flex-1 min-w-0" placeholder="Label" />
              <Input type="number" value={dp.value} onChange={(e) => updateDataPoint(i, "value", Number(e.target.value))} className="text-xs w-16" />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => update({ data: block.data.filter((_, idx) => idx !== i) })} disabled={block.data.length <= 1}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={() => update({ data: [...block.data, { id: crypto.randomUUID(), label: `Wert ${block.data.length + 1}`, value: 0, color: CHART_COLORS[block.data.length % CHART_COLORS.length] }] })}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Datenpunkt hinzufügen
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Numbered Label ─────────────────────────────────────────
export function NumberedLabelProps({ block }: { block: NumberedLabelBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Startnummer</Label>
        <Input type="number" min={0} value={block.startNumber} onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { startNumber: Number(e.target.value) } } })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Präfix</Label>
        <Input value={block.prefix} placeholder="z.B. Aufgabe" onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { prefix: e.target.value } } })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Suffix</Label>
        <Input value={block.suffix} placeholder="z.B. :" onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { suffix: e.target.value } } })} />
      </div>
    </div>
  );
}

// ─── Numbered Items ─────────────────────────────────────────
export function NumberedItemsProps({ block }: { block: NumberedItemsBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<NumberedItemsBlock>) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Startnummer</Label>
        <Input type="number" min={0} value={block.startNumber} onChange={(e) => update({ startNumber: Number(e.target.value) })} />
      </div>
      <Separator />
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Hintergrundfarbe</Label>
        <Input value={block.bgColor || ""} placeholder="#6366f1" onChange={(e) => update({ bgColor: e.target.value || undefined })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Eckenradius</Label>
        <Slider min={0} max={24} step={1} value={[block.borderRadius ?? 8]} onValueChange={(v) => update({ borderRadius: Array.isArray(v) ? v[0] : v })} />
        <span className="text-xs text-muted-foreground">{block.borderRadius ?? 8}px</span>
      </div>
    </div>
  );
}

// ─── Dialogue ───────────────────────────────────────────────
export function DialogueProps({ block }: { block: DialogueBlock }) {
  const { dispatch } = useEditor();

  const updateItem = (index: number, updates: Partial<DialogueItem>) => {
    const newItems = [...block.items];
    newItems[index] = { ...newItems[index], ...updates };
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } } });
  };

  const addItem = () => {
    const newItems: DialogueItem[] = [...block.items, { id: crypto.randomUUID(), speaker: "", icon: "circle" as DialogueSpeakerIcon, text: "" }];
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: newItems } as Partial<DialogueBlock> } });
  };

  const removeItem = (index: number) => {
    if (block.items.length <= 1) return;
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { items: block.items.filter((_, i) => i !== index) } } });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Anweisung</Label>
        <ChInput blockId={block.id} fieldPath="instruction" baseValue={block.instruction} onBaseChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { instruction: v } } })} />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Dialogzeilen</Label>
        {block.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-1.5">
            <Select value={item.icon} onValueChange={(v) => updateItem(i, { icon: v as DialogueSpeakerIcon })}>
              <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="circle">●</SelectItem>
                <SelectItem value="triangle">▲</SelectItem>
                <SelectItem value="square">■</SelectItem>
                <SelectItem value="diamond">◆</SelectItem>
              </SelectContent>
            </Select>
            <ChInput blockId={block.id} fieldPath={`items.${i}.text`} baseValue={item.text} onBaseChange={(v) => updateItem(i, { text: v })} className="h-8 text-xs flex-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(i)} disabled={block.items.length <= 1}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" /> Zeile hinzufügen</Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between">
        <Label className="text-sm">Wortbank anzeigen</Label>
        <Switch checked={block.showWordBank ?? false} onCheckedChange={(checked) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { showWordBank: checked } } })} />
      </div>
    </div>
  );
}

// ─── Accordion ──────────────────────────────────────────────
export function AccordionProps({ block }: { block: AccordionBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<AccordionBlock>) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Nummern anzeigen</Label>
        <Switch checked={block.showNumbers ?? false} onCheckedChange={(checked) => update({ showNumbers: checked })} />
      </div>
    </div>
  );
}

// ─── Audio ──────────────────────────────────────────────────
export function AudioProps({ block }: { block: AudioBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Audio-URL</Label>
        <Input value={block.src || ""} placeholder="https://..." onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { src: e.target.value } } })} />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Titel</Label>
        <Input value={block.title || ""} placeholder="Audio-Titel" onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { title: e.target.value } } })} />
      </div>
    </div>
  );
}

// ─── Table ──────────────────────────────────────────────────
export function TableProps({ block }: { block: TableBlock }) {
  const { dispatch } = useEditor();
  const tableStyles: { value: TableStyle; label: string }[] = [
    { value: "default", label: "Standard" },
    { value: "striped", label: "Gestreift" },
    { value: "bordered", label: "Umrahmt" },
    { value: "minimal", label: "Minimal" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Tabellenstil</Label>
        <Select value={block.tableStyle ?? "default"} onValueChange={(val) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { tableStyle: val as TableStyle } } })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {tableStyles.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Bildunterschrift</Label>
        <Input value={block.caption ?? ""} placeholder="Tabellentitel" onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { caption: e.target.value } } })} />
      </div>
    </div>
  );
}

// ─── Dos and Don'ts ─────────────────────────────────────────
export function DosAndDontsProps({ block }: { block: DosAndDontsBlock }) {
  const { dispatch } = useEditor();

  const updateList = (list: "dos" | "donts", items: DosAndDontsBlock["dos"]) => {
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { [list]: items } } });
  };

  const addItem = (list: "dos" | "donts") => {
    updateList(list, [...block[list], { id: crypto.randomUUID(), text: "" }]);
  };

  const removeItem = (list: "dos" | "donts", index: number) => {
    if (block[list].length <= 1) return;
    updateList(list, block[list].filter((_, i) => i !== index));
  };

  const renderSection = (list: "dos" | "donts", titleKey: "dosTitle" | "dontsTitle", icon: React.ReactNode) => (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <Input value={block[titleKey]} onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { [titleKey]: e.target.value } } })} className="h-8 text-xs font-semibold flex-1" />
      </div>
      {block[list].map((item, i) => (
        <div key={item.id} className="flex items-center gap-1">
          <ChInput blockId={block.id} fieldPath={`${list}.${i}.text`} baseValue={item.text} onBaseChange={(v) => { const items = [...block[list]]; items[i] = { ...items[i], text: v }; updateList(list, items); }} className="h-8 text-xs flex-1" />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(list, i)} disabled={block[list].length <= 1}><Trash2 className="h-3 w-3" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => addItem(list)} className="w-full"><Plus className="h-3.5 w-3.5 mr-1" /> Hinzufügen</Button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Layout</Label>
        <Select value={block.layout ?? "horizontal"} onValueChange={(v) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { layout: v as "horizontal" | "vertical" } } })}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="horizontal">Horizontal</SelectItem>
            <SelectItem value="vertical">Vertikal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-sm">Titel anzeigen</Label>
        <Switch checked={block.showTitles !== false} onCheckedChange={(checked) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { showTitles: checked } } })} />
      </div>
      <Separator />
      {renderSection("dos", "dosTitle", <Check className="h-3.5 w-3.5 text-emerald-600" />)}
      <Separator />
      {renderSection("donts", "dontsTitle", <X className="h-3.5 w-3.5 text-red-500" />)}
    </div>
  );
}

// ─── Text Comparison ────────────────────────────────────────
export function TextComparisonProps({ block }: { block: TextComparisonBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Kommentar</Label>
        <textarea
          value={block.comment || ""}
          onChange={(e) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { comment: e.target.value } } })}
          placeholder="Kommentar eingeben…"
          className="w-full min-h-[60px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Email Skeleton ─────────────────────────────────────────
export function EmailSkeletonProps({ block }: { block: EmailSkeletonBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<EmailSkeletonBlock>) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">E-Mail-Stil</Label>
        <Select value={block.emailStyle ?? "none"} onValueChange={(v) => update({ emailStyle: v as EmailSkeletonStyle })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Kein</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="teal">Teal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Kommentar</Label>
        <textarea value={block.comment || ""} onChange={(e) => update({ comment: e.target.value })} placeholder="…" className="w-full min-h-[60px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm resize-y" rows={2} />
      </div>
    </div>
  );
}

// ─── Job Application ────────────────────────────────────────
export function JobApplicationProps({ block }: { block: JobApplicationBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<JobApplicationBlock>) => dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Bewerbungsstil</Label>
        <Select value={block.applicationStyle ?? "none"} onValueChange={(v) => update({ applicationStyle: v as JobApplicationStyle })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Kein</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="teal">Teal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">Kommentar</Label>
        <textarea value={block.comment || ""} onChange={(e) => update({ comment: e.target.value })} placeholder="…" className="w-full min-h-[60px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm resize-y" rows={2} />
      </div>
    </div>
  );
}
