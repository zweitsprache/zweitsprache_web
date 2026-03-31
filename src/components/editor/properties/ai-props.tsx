"use client";

import React from "react";
import { useEditor } from "@/store/editor-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiPromptBlock, AiToolBlock } from "@/types/worksheet";
import { ChInput } from "./shared";

// ─── AI Prompt (UI only — backend skipped) ──────────────────
export function AiPromptProps({ block }: { block: AiPromptBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<AiPromptBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Beschreibung
        </Label>
        <ChInput
          blockId={block.id}
          fieldPath="description"
          baseValue={block.description}
          onBaseChange={(v) => update({ description: v })}
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Variablenname
        </Label>
        <Input
          value={block.variableName}
          onChange={(e) => update({ variableName: e.target.value })}
          placeholder="z.B. mein_prompt"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Anweisungen
        </Label>
        <textarea
          value={block.instructions}
          onChange={(e) => update({ instructions: e.target.value })}
          placeholder="Anweisungen für den KI-Prompt…"
          className="w-full min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          rows={4}
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Prompt-Template
        </Label>
        <textarea
          value={block.prompt}
          onChange={(e) => update({ prompt: e.target.value })}
          placeholder="Der eigentliche Prompt…"
          className="w-full min-h-[80px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          rows={4}
        />
      </div>
      <p className="text-xs text-muted-foreground italic">
        KI-Backend wird später angebunden.
      </p>
    </div>
  );
}

// ─── AI Tool (UI only — backend skipped) ────────────────────
export function AiToolProps({ block }: { block: AiToolBlock }) {
  const { dispatch } = useEditor();
  const update = (updates: Partial<AiToolBlock>) =>
    dispatch({ type: "UPDATE_BLOCK", payload: { id: block.id, updates } });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Tool-Titel
        </Label>
        <Input
          value={block.toolTitle}
          onChange={(e) => update({ toolTitle: e.target.value })}
          placeholder="Tool-Name"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Tool-Beschreibung
        </Label>
        <Input
          value={block.toolDescription}
          onChange={(e) => update({ toolDescription: e.target.value })}
          placeholder="Kurze Beschreibung"
        />
      </div>
      <div>
        <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider px-2 py-1.5 bg-slate-100 rounded-md block mb-2">
          Tool-ID
        </Label>
        <Input
          value={block.toolId}
          onChange={(e) => update({ toolId: e.target.value })}
          disabled
          className="bg-slate-50"
        />
      </div>
      <p className="text-xs text-muted-foreground italic">
        KI-Backend wird später angebunden.
      </p>
    </div>
  );
}
