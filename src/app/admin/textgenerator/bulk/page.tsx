"use client";

import { useRef, useState } from "react";
import { Copy, Check, Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2"] as const;

interface CsvRow {
  hf: string;
  textsorte: string;
  thema: string;
}

interface GeneratedText {
  rowIndex: number;
  level: string;
  text: string;
  matchCount: number;
  error?: string;
}

function parseCsv(raw: string): CsvRow[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      // Support both ; and , as delimiter, but prefer ;
      const delim = line.includes(";") ? ";" : ",";
      const parts = line.split(delim).map((p) => p.trim());
      return { hf: parts[0] ?? "", textsorte: parts[1] ?? "", thema: parts[2] ?? "" };
    })
    .filter((r) => r.hf && r.thema);
}

export default function BulkGeneratorPage() {
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [results, setResults] = useState<GeneratedText[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(false);

  const parseAndPreview = () => {
    const parsed = parseCsv(csvText);
    setRows(parsed);
    setResults([]);
  };

  const startGeneration = async () => {
    if (rows.length === 0) return;
    abortRef.current = false;
    setGenerating(true);
    setResults([]);
    const total = rows.length * LEVELS.length;
    setProgress({ done: 0, total });

    const allResults: GeneratedText[] = [];

    for (let ri = 0; ri < rows.length; ri++) {
      const row = rows[ri];
      for (const level of LEVELS) {
        if (abortRef.current) break;

        try {
          const res = await fetch("/api/satzbank/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              level,
              topic: row.thema,
              region: "ch",
              textType: row.textsorte,
              handlungsfeld: row.hf,
            }),
          });
          const data = await res.json();

          if (!res.ok) {
            allResults.push({ rowIndex: ri, level, text: "", matchCount: 0, error: data.error });
          } else {
            allResults.push({ rowIndex: ri, level, text: data.text, matchCount: data.matchCount });
          }
        } catch {
          allResults.push({ rowIndex: ri, level, text: "", matchCount: 0, error: "Netzwerkfehler" });
        }

        setResults([...allResults]);
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      }
      if (abortRef.current) break;
    }

    setGenerating(false);
  };

  const abort = () => {
    abortRef.current = true;
  };

  const copyAll = async () => {
    const grouped = rows.map((row, ri) => {
      const rowResults = results.filter((r) => r.rowIndex === ri && !r.error);
      const texts = rowResults
        .map((r) => `--- ${r.level} ---\n${r.text}`)
        .join("\n\n");
      return `══════════════════════════════════════\nHF: ${row.hf} | Textsorte: ${row.textsorte} | Thema: ${row.thema}\n══════════════════════════════════════\n\n${texts}`;
    });
    await navigator.clipboard.writeText(grouped.join("\n\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-1 text-lg font-bold tracking-tight">Bulk-Textgenerator</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        CSV mit Handlungsfeld-Code, Textsorte und Thema einfügen. Generiert Texte für alle 6 Niveaus pro Zeile.
      </p>

      {/* CSV Input */}
      <div className="mb-6 space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-400">
            CSV-Daten <span className="font-normal text-zinc-400">(HF-Code ; Textsorte ; Thema)</span>
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"GES;Sachtext;Einen Arzttermin vereinbaren\nMOB;Dialog;Am Bahnhof nach dem Weg fragen\nEIN;E-Mail;Reklamation wegen falschem Produkt"}
            rows={8}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={parseAndPreview} disabled={!csvText.trim()}>
            <Upload className="size-4" />
            Vorschau
          </Button>
          {rows.length > 0 && !generating && (
            <Button onClick={startGeneration}>
              <Loader2 className="size-4" />
              {rows.length * LEVELS.length} Texte generieren
            </Button>
          )}
          {generating && (
            <Button variant="outline" onClick={abort}>
              <X className="size-4" />
              Abbrechen
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {generating && (
        <div className="mb-6">
          <div className="mb-1 flex justify-between text-xs text-zinc-500">
            <span>Generiere… {progress.done} / {progress.total}</span>
            <span>{Math.round((progress.done / progress.total) * 100)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview Table */}
      {rows.length > 0 && results.length === 0 && !generating && (
        <div className="mb-6">
          <p className="mb-2 text-xs font-medium text-zinc-500">{rows.length} Zeilen erkannt</p>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">#</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">HF</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Textsorte</th>
                  <th className="px-3 py-2 text-left font-medium text-zinc-500">Thema</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-zinc-50 dark:border-zinc-900">
                    <td className="px-3 py-1.5 text-zinc-400">{i + 1}</td>
                    <td className="px-3 py-1.5 font-mono">{r.hf}</td>
                    <td className="px-3 py-1.5">{r.textsorte}</td>
                    <td className="px-3 py-1.5">{r.thema}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {results.filter((r) => !r.error).length} Texte generiert
              {results.some((r) => r.error) && ` • ${results.filter((r) => r.error).length} Fehler`}
            </p>
            <Button size="sm" variant="outline" onClick={copyAll}>
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copied ? "Kopiert" : "Alle kopieren"}
            </Button>
          </div>

          {rows.map((row, ri) => {
            const rowResults = results.filter((r) => r.rowIndex === ri);
            if (rowResults.length === 0) return null;
            return (
              <div key={ri} className="rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-xs font-medium text-zinc-500">
                    {ri + 1}. {row.hf} · {row.textsorte} · {row.thema}
                  </span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {rowResults.map((r) => (
                    <div key={r.level} className="px-4 py-3">
                      <span className="mb-1 inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {r.level}
                      </span>
                      {r.error ? (
                        <p className="mt-1 text-sm text-red-500">{r.error}</p>
                      ) : (
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{r.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
