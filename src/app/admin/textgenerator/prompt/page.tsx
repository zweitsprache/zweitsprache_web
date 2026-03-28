"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

const SHORTCODES = [
  { code: "{{NIVEAU}}", desc: "CEFR-Niveau (z.B. A1.1, B1.2)" },
  { code: "{{REGION}}", desc: "Regionale Sprachvariante (CH/DE)" },
  { code: "{{ANSPRACHE}}", desc: "Ansprechregel (persönlich oder neutral-man)" },
  { code: "{{HANDLUNGSFELD}}", desc: "Handlungsfeld-Abschnitt (nur wenn gewählt)" },
  { code: "{{KONTEXTREGELN}}", desc: "Landeskundliche Regeln pro Handlungsfeld" },
  { code: "{{TEXTSORTE}}", desc: "Textsorte-Anweisung" },
  { code: "{{LAENGE}}", desc: "Längensteuerung (dynamisch nach Inhalt/Textsorte)" },
  { code: "{{NIVEAUREGELN}}", desc: "Detaillierte Grammatik-/Wortschatzregeln für das Niveau" },
  { code: "{{TITEL_NEUTRAL}}", desc: "'; neutral formulieren' für Sachtexte, leer für persönliche" },
  { code: "{{REFERENZSAETZE}}", desc: "Referenzsätze aus der Satzbank als Stilvorlage" },
];

export default function PromptPage() {
  const [template, setTemplate] = useState("");
  const [savedTemplate, setSavedTemplate] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadTemplate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prompt");
      const data = await res.json();
      if (res.ok && data.template) {
        setTemplate(data.template);
        setSavedTemplate(data.template);
        setUpdatedAt(data.updated_at);
      }
    } catch {
      setError("Fehler beim Laden des Prompts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const saveTemplate = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedTemplate(template);
        setUpdatedAt(data.updated_at);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error ?? "Fehler beim Speichern.");
      }
    } catch {
      setError("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = template !== savedTemplate;

  const insertShortcode = (code: string) => {
    const textarea = document.getElementById("prompt-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = template.slice(0, start) + code + template.slice(end);
    setTemplate(newValue);
    // Restore cursor position after insert
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + code.length;
      textarea.focus();
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin" /> Laden…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prompt-Template</h1>
          {updatedAt && (
            <p className="text-xs text-zinc-400">
              Zuletzt gespeichert: {new Date(updatedAt).toLocaleString("de-CH")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setTemplate(savedTemplate)}
            >
              <RotateCcw className="size-3" /> Zurücksetzen
            </Button>
          )}
          <Button size="sm" onClick={saveTemplate} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            Speichern
          </Button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-950/50 dark:text-green-400">
          Gespeichert.
        </p>
      )}

      {/* Shortcode reference */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-2 text-sm font-semibold">Verfügbare Shortcodes</h2>
        <p className="mb-3 text-xs text-zinc-500">
          Klicke auf einen Shortcode, um ihn an der Cursor-Position einzufügen. Shortcodes werden bei der Generierung durch die berechneten Werte ersetzt.
        </p>
        <div className="flex flex-wrap gap-2">
          {SHORTCODES.map((s) => (
            <button
              key={s.code}
              onClick={() => insertShortcode(s.code)}
              className="group relative rounded-md border border-zinc-300 bg-white px-2 py-1 font-mono text-xs transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-600 dark:hover:bg-blue-950"
              title={s.desc}
            >
              {s.code}
              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-800 px-2 py-1 text-xs text-white group-hover:block dark:bg-zinc-200 dark:text-zinc-900">
                {s.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Template editor */}
      <div className="relative">
        <textarea
          id="prompt-textarea"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={35}
          spellCheck={false}
          className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 font-mono text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-900"
        />
        {hasChanges && (
          <div className="absolute right-3 top-3 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
            Ungespeicherte Änderungen
          </div>
        )}
      </div>
    </div>
  );
}
