"use client";

import React from "react";
import { useEditor } from "@/store/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SpacerBlock,
  DividerBlock,
  WritingLinesBlock,
  WritingRowsBlock,
  ColumnsBlock,
  PageBreakBlock,
  LogoDividerBlock,
} from "@/types/worksheet";

// ─── Spacer ─────────────────────────────────────────────────
export function SpacerProps({ block }: { block: SpacerBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Höhe</Label>
          <span className="text-xs text-muted-foreground">{block.height}px</span>
        </div>
        <Slider
          value={[block.height]}
          min={4}
          max={200}
          step={4}
          onValueChange={(v) =>
            dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates: { height: Array.isArray(v) ? v[0] : v } } })
          }
        />
      </div>
    </div>
  );
}

// ─── Divider ────────────────────────────────────────────────
export function DividerProps({ block }: { block: DividerBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Stil
        </Label>
        <Select
          value={block.style}
          onValueChange={(v) =>
            dispatch({
              type: "UPDATE_BLOCK",
              payload: { id: block.id, updates: { style: v as "solid" | "dashed" | "dotted" } },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Durchgezogen</SelectItem>
            <SelectItem value="dashed">Gestrichelt</SelectItem>
            <SelectItem value="dotted">Gepunktet</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Writing Lines ──────────────────────────────────────────
export function WritingLinesProps({ block }: { block: WritingLinesBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Anzahl Linien
        </Label>
        <Input
          type="number"
          min={1}
          max={30}
          value={block.lineCount}
          onChange={(e) =>
            dispatch({
              type: "UPDATE_BLOCK",
              payload: { id: block.id, updates: { lineCount: Number(e.target.value) } },
            })
          }
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm">Zeilenabstand</Label>
          <span className="text-xs text-muted-foreground">{block.lineSpacing}px</span>
        </div>
        <Slider
          value={[block.lineSpacing]}
          min={16}
          max={48}
          step={2}
          onValueChange={(v) =>
            dispatch({
              type: "UPDATE_BLOCK",
              payload: { id: block.id, updates: { lineSpacing: Array.isArray(v) ? v[0] : v } },
            })
          }
        />
      </div>
    </div>
  );
}

// ─── Writing Rows ───────────────────────────────────────────
export function WritingRowsProps({ block }: { block: WritingRowsBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Anzahl Zeilen
        </Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={block.rowCount}
          onChange={(e) =>
            dispatch({
              type: "UPDATE_BLOCK",
              payload: { id: block.id, updates: { rowCount: Number(e.target.value) } },
            })
          }
        />
      </div>
    </div>
  );
}

// ─── Columns ────────────────────────────────────────────────
export function ColumnsProps({ block }: { block: ColumnsBlock }) {
  const { dispatch } = useEditor();
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Spaltenanzahl
        </Label>
        <Select
          value={String(block.columns)}
          onValueChange={(v) => {
            const newCols = Number(v);
            const currentChildren = block.children || [];
            // Adjust children array to match column count
            const newChildren = Array.from({ length: newCols }, (_, i) => currentChildren[i] || []);
            dispatch({
              type: "UPDATE_BLOCK",
              payload: { id: block.id, updates: { columns: newCols, children: newChildren } },
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Spalte</SelectItem>
            <SelectItem value="2">2 Spalten</SelectItem>
            <SelectItem value="3">3 Spalten</SelectItem>
            <SelectItem value="4">4 Spalten</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        Ziehe Blöcke in die Spalten auf dem Canvas, um sie zu füllen.
      </p>
    </div>
  );
}

// ─── Page Break ─────────────────────────────────────────────
export function PageBreakProps({ block: _block }: { block: PageBreakBlock }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Seitenumbruch — keine weiteren Einstellungen.
      </p>
    </div>
  );
}

// ─── Logo Divider ───────────────────────────────────────────
export function LogoDividerProps({ block: _block }: { block: LogoDividerBlock }) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Logo-Trennlinie — keine weiteren Einstellungen.
      </p>
    </div>
  );
}
