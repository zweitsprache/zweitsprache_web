"use client";

import { useState } from "react";
import { Check, Edit2, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2"] as const;
type Level = (typeof LEVELS)[number];

interface SentenceAttributes {
  tense: string[];
  sentence_type: string;
  structures: string[];
  vocabulary_band: string;
  topics: string[];
  word_count: number;
  subordinate_clauses: number;
  level_reasoning: string;
}

interface AnnotatedSentence {
  text: string;
  level: Level;
  attributes: SentenceAttributes;
}

const LEVEL_COLORS: Record<string, string> = {
  "A1.1": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "A1.2": "bg-green-200 text-green-900 dark:bg-green-900/40 dark:text-green-300",
  "A2.1": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  "A2.2": "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-300",
  "B1.1": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "B1.2": "bg-blue-200 text-blue-900 dark:bg-blue-900/40 dark:text-blue-300",
};

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function SentenceCard({
  sentence,
  index,
  onUpdate,
  onRemove,
  approved,
}: {
  sentence: AnnotatedSentence;
  index: number;
  onUpdate: (index: number, updated: AnnotatedSentence) => void;
  onRemove: (index: number) => void;
  approved: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sentence);

  const save = () => {
    onUpdate(index, draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(sentence);
    setEditing(false);
  };

  const attr = sentence.attributes;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        approved
          ? "border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed font-medium">{sentence.text}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Badge className={LEVEL_COLORS[sentence.level]}>{sentence.level}</Badge>
          {!approved && !editing && (
            <Button variant="ghost" size="icon-xs" onClick={() => setEditing(true)}>
              <Edit2 className="size-3" />
            </Button>
          )}
          {!approved && (
            <Button variant="ghost" size="icon-xs" onClick={() => onRemove(index)}>
              <X className="size-3" />
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          {/* Level */}
          <div className="flex items-center gap-2">
            <label className="w-28 text-xs font-medium text-zinc-500">Niveau</label>
            <select
              value={draft.level}
              onChange={(e) => setDraft({ ...draft, level: e.target.value as Level })}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Tense */}
          <div className="flex items-center gap-2">
            <label className="w-28 text-xs font-medium text-zinc-500">Zeitformen</label>
            <input
              value={draft.attributes.tense.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attributes: {
                    ...draft.attributes,
                    tense: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          {/* Sentence type */}
          <div className="flex items-center gap-2">
            <label className="w-28 text-xs font-medium text-zinc-500">Satztyp</label>
            <select
              value={draft.attributes.sentence_type}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attributes: { ...draft.attributes, sentence_type: e.target.value },
                })
              }
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {["Hauptsatz", "Nebensatz", "Fragesatz", "Imperativsatz", "Relativsatz"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Structures */}
          <div className="flex items-center gap-2">
            <label className="w-28 text-xs font-medium text-zinc-500">Strukturen</label>
            <input
              value={draft.attributes.structures.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attributes: {
                    ...draft.attributes,
                    structures: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          {/* Vocabulary band */}
          <div className="flex items-center gap-2">
            <label className="w-28 text-xs font-medium text-zinc-500">Wortschatz</label>
            <select
              value={draft.attributes.vocabulary_band}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attributes: { ...draft.attributes, vocabulary_band: e.target.value },
                })
              }
              className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {["basic", "intermediate", "advanced", "specialized"].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Topics */}
          <div className="flex items-center gap-2">
            <label className="w-28 text-xs font-medium text-zinc-500">Themen</label>
            <input
              value={draft.attributes.topics.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attributes: {
                    ...draft.attributes,
                    topics: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  },
                })
              }
              className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          {/* Level reasoning */}
          <div className="flex items-start gap-2">
            <label className="w-28 pt-1 text-xs font-medium text-zinc-500">Begründung</label>
            <textarea
              value={draft.attributes.level_reasoning}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  attributes: { ...draft.attributes, level_reasoning: e.target.value },
                })
              }
              rows={2}
              className="flex-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={save}>Speichern</Button>
            <Button size="sm" variant="outline" onClick={cancel}>Abbrechen</Button>
          </div>
        </div>
      ) : (
        /* Read-only attributes */
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {attr.tense.map((t, i) => (
              <Badge key={`tense-${i}`} className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{t}</Badge>
            ))}
            <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{attr.sentence_type}</Badge>
            <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{attr.vocabulary_band}</Badge>
            <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{attr.word_count} Wörter</Badge>
            {attr.subordinate_clauses > 0 && (
              <Badge className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {attr.subordinate_clauses} NS
              </Badge>
            )}
          </div>
          {attr.structures.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attr.structures.map((s, i) => (
                <Badge key={`struct-${i}`} className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{s}</Badge>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {attr.topics.map((t, i) => (
              <Badge key={`topic-${i}`} className="bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400">{t}</Badge>
            ))}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{attr.level_reasoning}</p>
        </div>
      )}
    </div>
  );
}

export default function SatzbankPage() {
  const [text, setText] = useState("");
  const [level, setLevel] = useState<Level>("A1.1");
  const [sentences, setSentences] = useState<AnnotatedSentence[]>([]);
  const [approved, setApproved] = useState<Set<number>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setError(null);
    setSuccessMsg(null);
    setSentences([]);
    setApproved(new Set());

    try {
      const res = await fetch("/api/satzbank/annotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, level }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSentences(data.sentences);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysefehler");
    } finally {
      setAnalyzing(false);
    }
  };

  const updateSentence = (index: number, updated: AnnotatedSentence) => {
    setSentences((prev) => prev.map((s, i) => (i === index ? updated : s)));
  };

  const removeSentence = (index: number) => {
    setSentences((prev) => prev.filter((_, i) => i !== index));
    setApproved((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const approveAll = async () => {
    const unapproved = sentences.filter((_, i) => !approved.has(i));
    if (!unapproved.length) return;

    setApproving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const batchId = crypto.randomUUID();
      const res = await fetch("/api/satzbank/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentences: unapproved, batchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setApproved(new Set(sentences.map((_, i) => i)));
      setSuccessMsg(`${data.approved.length} Sätze genehmigt und gespeichert.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Genehmigen");
    } finally {
      setApproving(false);
    }
  };

  const allApproved = sentences.length > 0 && approved.size === sentences.length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 text-lg font-bold tracking-tight">Satzbank</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        Deutschen Text einfügen, CEFR-Niveau wählen und automatisch annotieren lassen.
      </p>

      {/* Input section */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Niveau</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Deutschen Text hier einfügen..."
          rows={6}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm leading-relaxed placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
        />
        <Button onClick={analyze} disabled={analyzing || !text.trim()}>
          {analyzing && <Loader2 className="size-4 animate-spin" />}
          {analyzing ? "Analysiere..." : "Analysieren"}
        </Button>
      </div>

      {/* Error / Success */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400">
          <Check className="mr-1 inline size-4" />
          {successMsg}
        </div>
      )}

      {/* Results */}
      {sentences.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {sentences.length} Sätze erkannt
            </h2>
            {!allApproved && (
              <Button onClick={approveAll} disabled={approving}>
                {approving && <Loader2 className="size-4 animate-spin" />}
                {approving ? "Speichere..." : "Alle genehmigen"}
              </Button>
            )}
          </div>

          {sentences.map((sentence, i) => (
            <SentenceCard
              key={`${sentence.text}-${i}`}
              sentence={sentence}
              index={i}
              onUpdate={updateSentence}
              onRemove={removeSentence}
              approved={approved.has(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
