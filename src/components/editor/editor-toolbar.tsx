"use client";

import React from "react";
import { useEditor } from "@/store/editor-store";
import { getEffectiveValue, hasChOverride, countChOverrides } from "@/lib/locale-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Save,
  Printer,
  Monitor,
  ArrowLeft,
  X,
} from "lucide-react";

interface EditorToolbarProps {
  backUrl?: string;
}

export function EditorToolbar({ backUrl }: EditorToolbarProps) {
  const { state, dispatch, save } = useEditor();

  // CH-aware title
  const isChMode = state.localeMode === "CH";
  const titleHasOverride = hasChOverride("_worksheet", "title", state.settings.chOverrides);
  const displayTitle = getEffectiveValue(
    state.title,
    "_worksheet",
    "title",
    state.localeMode,
    state.settings.chOverrides
  );

  const handleTitleChange = (value: string) => {
    if (isChMode) {
      const autoConverted = state.title.replace(/ß/g, "ss");
      if (value === autoConverted) {
        dispatch({ type: "CLEAR_CH_OVERRIDE", payload: { blockId: "_worksheet", fieldPath: "title" } });
      } else {
        dispatch({ type: "SET_CH_OVERRIDE", payload: { blockId: "_worksheet", fieldPath: "title", value } });
      }
    } else {
      dispatch({ type: "SET_TITLE", payload: value });
    }
  };

  return (
    <div className="h-14 bg-background flex items-center px-4 gap-2 shrink-0 border-b">
      {/* Back */}
      {backUrl && (
        <a href={backUrl} className="mr-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </a>
      )}

      {/* Title */}
      <div className="flex items-center gap-1 max-w-[560px]">
        <Input
          value={displayTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={`h-8 font-medium flex-1 ${
            isChMode && titleHasOverride ? "bg-amber-50/50 border-l-2 border-l-amber-400" : ""
          }`}
          placeholder="Titel eingeben…"
        />
        {isChMode && titleHasOverride && (
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "CLEAR_CH_OVERRIDE", payload: { blockId: "_worksheet", fieldPath: "title" } })
            }
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-50 text-amber-500 hover:text-red-500 shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {state.isDirty && (
        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
          Ungespeichert
        </Badge>
      )}

      <div className="flex-1" />

      {/* DE / CH locale toggle */}
      <div className="flex items-center bg-muted rounded-lg p-0.5">
        <Button
          variant={state.localeMode === "DE" ? "default" : "ghost"}
          size="sm"
          className={`h-7 px-2.5 gap-1 text-xs ${state.localeMode === "DE" ? "shadow-sm" : ""}`}
          onClick={() => dispatch({ type: "SET_LOCALE_MODE", payload: "DE" })}
        >
          🇩🇪 DE
        </Button>
        <Button
          variant={state.localeMode === "CH" ? "default" : "ghost"}
          size="sm"
          className={`h-7 px-2.5 gap-1 text-xs ${state.localeMode === "CH" ? "shadow-sm" : ""}`}
          onClick={() => dispatch({ type: "SET_LOCALE_MODE", payload: "CH" })}
        >
          🇨🇭 CH
          {countChOverrides(state.settings.chOverrides) > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px] bg-amber-100 text-amber-700">
              {countChOverrides(state.settings.chOverrides)}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center bg-muted rounded-lg p-0.5">
        <Button
          variant={state.viewMode === "print" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1.5"
          onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: "print" })}
        >
          <Printer className="h-3.5 w-3.5" />
          Druck
        </Button>
        <Button
          variant={state.viewMode === "online" ? "secondary" : "ghost"}
          size="sm"
          className="h-7 gap-1.5"
          onClick={() => dispatch({ type: "SET_VIEW_MODE", payload: "online" })}
        >
          <Monitor className="h-3.5 w-3.5" />
          Online
        </Button>
      </div>

      {/* Save */}
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        onClick={save}
        disabled={state.isSaving}
        title="Cmd+S"
      >
        <Save className="h-3.5 w-3.5" />
        {state.isSaving ? "Speichern…" : "Speichern"}
      </Button>
    </div>
  );
}
