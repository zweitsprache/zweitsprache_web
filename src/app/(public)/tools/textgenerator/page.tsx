"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy, Check, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2"] as const;
type Level = (typeof LEVELS)[number];

type Textsorte = {
  key: string;
  label: string;
  gruppe: string;
};

export default function TextgeneratorPage() {
  const [selectedLevels, setSelectedLevels] = useState<Set<Level>>(new Set(["A1.1"]));
  const [topic, setTopic] = useState("");
  const [textType, setTextType] = useState<string>("");
  const [textsorten, setTextsorten] = useState<Textsorte[]>([]);
  const [region, setRegion] = useState<"ch" | "de">("ch");
  const [handlungsfeld, setHandlungsfeld] = useState<string>("");
  const [handlungsfelder, setHandlungsfelder] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/handlungsfelder").then((r) => r.json()),
      fetch("/api/textsorten").then((r) => r.json()),
    ]).then(([hfData, tsData]) => {
      if (Array.isArray(hfData)) setHandlungsfelder(hfData);
      if (Array.isArray(tsData)) setTextsorten(tsData);
    }).catch(() => {});
  }, []);
  const [count, setCount] = useState(1);
  const [results, setResults] = useState<{ title: string; text: string; matchCount: number; level: string }[]>([]);
  const [prompt, setPrompt] = useState<{ system: string; user: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const toggleLevel = (l: Level) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(l)) {
        if (next.size > 1) next.delete(l);
      } else {
        next.add(l);
      }
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedLevels((prev) =>
      prev.size === LEVELS.length ? new Set([LEVELS[0]]) : new Set(LEVELS)
    );
  };

  const generate = async () => {
    if (!topic.trim() || !handlungsfeld || !textType || selectedLevels.size === 0) return;
    setGenerating(true);
    setError(null);
    setResults([]);
    setPrompt(null);

    try {
      const levels = Array.from(selectedLevels);
      const promises = levels.flatMap((level) =>
        Array.from({ length: count }, () =>
          fetch("/api/satzbank/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ level, topic, region, textType, handlungsfeld }),
          }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            if (data.prompt) setPrompt(data.prompt);
            return { title: data.title as string, text: data.text, matchCount: data.matchCount, level: data.level as string };
          })
        )
      );
      const texts = await Promise.all(promises);
      setResults(texts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler bei der Generierung");
    } finally {
      setGenerating(false);
    }
  };

  const copyText = async (index: number) => {
    const r = results[index];
    await navigator.clipboard.writeText(r.title ? `${r.title}\n\n${r.text}` : r.text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = async () => {
    const all = results.map((r, i) => `--- Text ${i + 1} ---\n${r.text}`).join("\n\n");
    await navigator.clipboard.writeText(all);
    setCopiedIndex(-1);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="relative h-48 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-56 md:h-64">
        <Image
          src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
          alt="Textgenerator"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 to-slate-900/20 p-6 sm:p-8">
          <Link href="/tools" className="mb-4 inline-block text-sm text-zinc-300 hover:text-white">
            ← Alle Tools
          </Link>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Textgenerator</h1>
          <p className="mt-2 text-lg text-zinc-200">
            Niveaugerechte deutsche Texte generieren.
          </p>
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
        {/* Input section */}
        <div className="mb-8 space-y-4">

        {/* Niveau — full width */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Niveau</label>
          <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
            {LEVELS.map((l, i) => (
              <button
                key={l}
                onClick={() => toggleLevel(l)}
                className={`flex-1 ${i > 0 ? "border-l border-zinc-200 dark:border-zinc-700" : ""} px-2.5 py-2 text-sm font-medium transition-colors ${
                  selectedLevels.has(l)
                    ? "bg-slate-100 text-slate-900"
                    : "bg-white text-zinc-500 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-slate-800"
                }`}
              >
                {l}
              </button>
            ))}
            <button
              onClick={toggleAll}
              className={`flex-1 border-l border-zinc-200 px-2.5 py-2 text-sm font-medium transition-colors dark:border-zinc-700 ${
                selectedLevels.size === LEVELS.length
                  ? "bg-slate-100 text-slate-900"
                  : "bg-white text-zinc-500 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-slate-800"
              }`}
            >
              Alle
            </button>
          </div>
        </div>

        {/* 6-col row: Handlungsfeld(1-2) | Textsorte(3-4) | Region(5) | Anzahl(6) */}
        <div className="grid grid-cols-6 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Handlungsfeld</label>
            <Select value={handlungsfeld} onValueChange={(v) => v !== null && setHandlungsfeld(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => handlungsfelder.find((h) => h.code === v)?.name ?? <span className="text-muted-foreground">Auswahl</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {[...handlungsfelder].sort((a, b) => a.name.localeCompare(b.name, "de")).map((h) => (
                    <SelectItem key={h.code} value={h.code}>{h.name}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium">Textsorte</label>
            <Select value={textType} onValueChange={(v) => v !== null && setTextType(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(v: string) => textsorten.find((t) => t.key === v)?.label ?? <span className="text-muted-foreground">Auswahl</span>}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(
                  textsorten.reduce<Record<string, Textsorte[]>>((acc, t) => {
                    if (!acc[t.gruppe]) acc[t.gruppe] = [];
                    acc[t.gruppe].push(t);
                    return acc;
                  }, {})
                ).map(([gruppe, items]) => (
                  <SelectGroup key={gruppe}>
                    <SelectLabel>{gruppe}</SelectLabel>
                    {items.map((t) => (
                      <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <label className="mb-1.5 block text-sm font-medium">Region</label>
            <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => setRegion("ch")}
                className={`flex-1 flex items-center justify-center px-2.5 py-2 transition-colors ${
                  region === "ch"
                    ? "bg-slate-100 text-slate-900"
                    : "bg-white text-zinc-500 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-slate-800"
                }`}
                title="Schweizer Hochdeutsch"
              >
                <Image src="/flags/flag_of_Switzerland.svg" alt="Schweiz" width={24} height={16} className="rounded-sm" />
              </button>
              <button
                onClick={() => setRegion("de")}
                className={`flex-1 flex items-center justify-center border-l border-zinc-200 px-2.5 py-2 transition-colors dark:border-zinc-700 ${
                  region === "de"
                    ? "bg-slate-100 text-slate-900"
                    : "bg-white text-zinc-500 hover:bg-slate-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-slate-800"
                }`}
                title="Bundesdeutsches Hochdeutsch"
              >
                <Image src="/flags/flag_of_Germany.svg" alt="Deutschland" width={24} height={16} className="rounded-sm" />
              </button>
            </div>
          </div>
          <div className="col-span-1">
            <label className="mb-1.5 block text-sm font-medium">Anzahl</label>
            <input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
              className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-center text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        {/* Thema — full width */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">Thema</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Einkaufen, Arztbesuch, Reise nach Berlin..."
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !generating) generate();
            }}
          />
        </div>

        <Button className="w-full" onClick={generate} disabled={generating || !topic.trim() || !handlungsfeld || selectedLevels.size === 0}>
          {generating && <Loader2 className="size-4 animate-spin" />}
          {generating ? "Generiere..." : "Text generieren"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {results.length} {results.length === 1 ? "Text" : "Texte"} generiert • {results[0].matchCount} Referenzsätze
            </p>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={generate} disabled={generating}>
                <RefreshCw className={`size-3.5 ${generating ? "animate-spin" : ""}`} />
                Neu generieren
              </Button>
              {results.length > 1 && (
                <Button size="sm" variant="outline" onClick={copyAll}>
                  {copiedIndex === -1 ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copiedIndex === -1 ? "Kopiert" : "Alle kopieren"}
                </Button>
              )}
            </div>
          </div>

          {results.map((r, i) => (
            <div key={i} className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
              {results.length > 1 && (
                <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2 dark:border-zinc-800">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{r.level} • Text {i + 1}</span>
                  <Button size="xs" variant="ghost" onClick={() => copyText(i)}>
                    {copiedIndex === i ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copiedIndex === i ? "Kopiert" : "Kopieren"}
                  </Button>
                </div>
              )}
              <div className="p-5">
                {r.title && <h2 className="mb-3 text-base font-semibold">{r.title}</h2>}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{r.text}</p>
              </div>
              {results.length === 1 && (
                <div className="flex justify-end border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
                  <Button size="xs" variant="ghost" onClick={() => copyText(0)}>
                    {copiedIndex === 0 ? <Check className="size-3" /> : <Copy className="size-3" />}
                    {copiedIndex === 0 ? "Kopiert" : "Kopieren"}
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* Prompt details */}
          {prompt && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">
                Prompt anzeigen
              </summary>
              <div className="mt-2 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">System</p>
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{prompt.system}</pre>
                </div>
                <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">User</p>
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{prompt.user}</pre>
                </div>
              </div>
            </details>
          )}
        </div>
      )}
        </div>

        {/* Sidebar */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Weitere Tools</h2>
          <Link
            href="/tools/textkorrektor"
            className="group block overflow-hidden rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="relative h-36 bg-zinc-100 dark:bg-zinc-800">
              <Image
                src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
                alt="Textkorrektor"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/60 to-transparent p-4">
                <h3 className="text-base font-semibold text-white group-hover:underline">Textkorrektor</h3>
                <p className="mt-0.5 text-xs text-zinc-200">Handgeschriebene Texte fotografieren und automatisch korrigieren</p>
              </div>
            </div>
            <div className="p-3">
              <span className="block rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-zinc-200">
                Öffnen
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
