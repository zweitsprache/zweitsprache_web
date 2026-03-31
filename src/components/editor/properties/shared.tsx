"use client";

import React from "react";
import { useEditor } from "@/store/editor-store";
import { Input } from "@/components/ui/input";
import { hasChOverride, getEffectiveValue } from "@/lib/locale-utils";
import { X } from "lucide-react";

interface ChInputProps {
  blockId: string;
  fieldPath: string;
  baseValue: string;
  onBaseChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

/**
 * Locale-aware input: in CH mode shows the effective (ß→ss) value,
 * allows manual CH overrides, and shows a clear button when overridden.
 */
export function ChInput({
  blockId,
  fieldPath,
  baseValue,
  onBaseChange,
  className,
  placeholder,
  multiline,
}: ChInputProps) {
  const { state, dispatch } = useEditor();
  const isChMode = state.localeMode === "CH";
  const overrideExists = hasChOverride(blockId, fieldPath, state.settings.chOverrides);
  const displayValue = getEffectiveValue(
    baseValue,
    blockId,
    fieldPath,
    state.localeMode,
    state.settings.chOverrides
  );

  const handleChange = (value: string) => {
    if (isChMode) {
      const autoConverted = baseValue.replace(/ß/g, "ss");
      if (value === autoConverted) {
        dispatch({ type: "CLEAR_CH_OVERRIDE", payload: { blockId, fieldPath } });
      } else {
        dispatch({ type: "SET_CH_OVERRIDE", payload: { blockId, fieldPath, value } });
      }
    } else {
      onBaseChange(value);
    }
  };

  const inputClassName = `${className ?? ""} ${
    isChMode && overrideExists ? "bg-amber-50/50 border-l-2 border-l-amber-400" : ""
  }`;

  if (multiline) {
    return (
      <div>
        <textarea
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[80px] resize-y ${inputClassName}`}
          placeholder={placeholder}
        />
        {isChMode && overrideExists && (
          <div className="flex items-center gap-1 mt-1">
            <button
              type="button"
              onClick={() => dispatch({ type: "CLEAR_CH_OVERRIDE", payload: { blockId, fieldPath } })}
              className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-50 text-amber-500 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {isChMode && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate" title={baseValue}>
            🇩🇪 {baseValue.length > 60 ? baseValue.slice(0, 60) + "…" : baseValue}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <Input
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          className={inputClassName}
          placeholder={placeholder}
        />
        {isChMode && overrideExists && (
          <button
            type="button"
            onClick={() => dispatch({ type: "CLEAR_CH_OVERRIDE", payload: { blockId, fieldPath } })}
            className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-50 text-amber-500 hover:text-red-500 shrink-0"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      {isChMode && (
        <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate" title={baseValue}>
          🇩🇪 {baseValue.length > 60 ? baseValue.slice(0, 60) + "…" : baseValue}
        </p>
      )}
    </div>
  );
}
