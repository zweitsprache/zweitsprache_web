"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Loader2, RefreshCw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

const LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1", "B2.2"] as const;
type Level = (typeof LEVELS)[number];

type LevelStat = {
  level: Level;
  file_count: number;
  db_count: number;
  scored_count: number;
};

type HfScore = {
  code: string;
  score: number;
};

type ScoredWord = {
  id: string;
  wort: string;
  level: Level;
  top_hf: HfScore[];
};

// Per-level scoring status
type ScoreStatus = "idle" | "running" | "done" | "error";

const LEVEL_COLORS: Record<string, string> = {
  "A1.1": "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  "A1.2": "bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
  "A2.1": "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  "A2.2": "bg-sky-200 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
  "B1.1": "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  "B1.2": "bg-violet-200 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200",
  "B2.1": "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  "B2.2": "bg-orange-200 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200",
};

const HF_SCORE_COLOR = (score: number) => {
  if (score >= 0.75) return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
  if (score >= 0.5) return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
  if (score >= 0.25) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300";
  return "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";
};

export default function WortlistenPage() {
  const [stats, setStats] = useState<LevelStat[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<Record<string, number> | null>(null);

  const [scoreStatus, setScoreStatus] = useState<Record<Level, ScoreStatus>>(
    Object.fromEntries(LEVELS.map((l) => [l, "idle"])) as Record<Level, ScoreStatus>
  );
  const [scoreErrors, setScoreErrors] = useState<Record<Level, string>>(
    Object.fromEntries(LEVELS.map((l) => [l, ""])) as Record<Level, string>
  );
  const [scoringAll, setScoringAll] = useState(false);
  const [recalibrating, setRecalibrating] = useState(false);
  const [recalibrateResult, setRecalibrateResult] = useState<number | null>(null);

  const [resultsLevel, setResultsLevel] = useState<Level>("A1.1");
  const [results, setResults] = useState<ScoredWord[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await fetch("/api/wortlisten");
      const data = await res.json();
      if (Array.isArray(data)) setStats(data);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/wortlisten/import", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setImportResult(data.imported);
        await fetchStats();
      } else {
        alert(data.error ?? "Importfehler");
      }
    } finally {
      setImporting(false);
    }
  };

  const scoreLevel = async (level: Level): Promise<boolean> => {
    setScoreStatus((prev) => ({ ...prev, [level]: "running" }));
    setScoreErrors((prev) => ({ ...prev, [level]: "" }));
    try {
      const res = await fetch(`/api/wortlisten/score?level=${encodeURIComponent(level)}`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setScoreStatus((prev) => ({ ...prev, [level]: "done" }));
        return true;
      } else {
        setScoreStatus((prev) => ({ ...prev, [level]: "error" }));
        setScoreErrors((prev) => ({ ...prev, [level]: data.error ?? "Fehler" }));
        return false;
      }
    } catch {
      setScoreStatus((prev) => ({ ...prev, [level]: "error" }));
      setScoreErrors((prev) => ({ ...prev, [level]: "Netzwerkfehler" }));
      return false;
    }
  };

  const handleScoreAll = async () => {
    setScoringAll(true);
    for (const level of LEVELS) {
      const stat = stats.find((s) => s.level === level);
      if (!stat || stat.db_count === 0) continue;
      await scoreLevel(level);
    }
    await fetchStats();
    setScoringAll(false);
  };

  const handleRecalibrate = async () => {
    setRecalibrating(true);
    setRecalibrateResult(null);
    try {
      const res = await fetch("/api/wortlisten/recalibrate", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRecalibrateResult(data.updated);
        await fetchResults(resultsLevel);
      } else {
        alert(data.error ?? "Rekalibrierungsfehler");
      }
    } finally {
      setRecalibrating(false);
    }
  };

  const fetchResults = useCallback(async (level: Level) => {
    setLoadingResults(true);
    try {
      const res = await fetch(`/api/wortlisten/score?level=${encodeURIComponent(level)}`);
      const data = await res.json();
      if (Array.isArray(data)) setResults(data);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(resultsLevel);
  }, [resultsLevel, fetchResults]);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">Wortlisten & Relevanz-Scoring</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Wortlisten aus <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">public/sources/wortliste_[Level].csv</code> importieren und semantisch gegen alle 20 Handlungsfelder scoren. Scores werden für die Textgenerierung verwendet.
        </p>
      </div>

      {/* Stats table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Status pro Level</h2>
          <Button variant="outline" size="sm" onClick={fetchStats} disabled={loadingStats}>
            {loadingStats ? <Loader2 className="size-3 animate-spin" /> : "Aktualisieren"}
          </Button>
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-zinc-500">Level</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500">In CSV</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500">In DB</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500">Gescored</th>
                <th className="px-4 py-2 text-right font-medium text-zinc-500">Scoring</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {loadingStats ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                    <Loader2 className="mx-auto size-4 animate-spin" />
                  </td>
                </tr>
              ) : (
                LEVELS.map((level) => {
                  const stat = stats.find((s) => s.level === level) ?? {
                    level,
                    file_count: 0,
                    db_count: 0,
                    scored_count: 0,
                  };
                  const status = scoreStatus[level];
                  return (
                    <tr key={level} className="bg-white dark:bg-zinc-950">
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${LEVEL_COLORS[level]}`}
                        >
                          {level}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                        {stat.file_count > 0 ? stat.file_count.toLocaleString() : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                        {stat.db_count > 0 ? stat.db_count.toLocaleString() : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                        {stat.scored_count > 0 ? (
                          <span className="flex items-center justify-end gap-1">
                            <CheckCircle2 className="size-3 text-green-500" />
                            {stat.scored_count.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {status === "running" ? (
                          <span className="flex items-center justify-end gap-1 text-xs text-zinc-400">
                            <Loader2 className="size-3 animate-spin" /> Läuft…
                          </span>
                        ) : status === "done" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={scoringAll}
                            onClick={() => {
                              setScoreStatus((prev) => ({ ...prev, [level]: "idle" }));
                            }}
                            className="h-6 px-2 text-xs text-green-600 hover:text-green-700 dark:text-green-400"
                          >
                            <CheckCircle2 className="mr-1 size-3" /> Fertig — Nochmal
                          </Button>
                        ) : status === "error" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={scoringAll}
                            onClick={() => scoreLevel(level).then(() => fetchStats())}
                            className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
                            title={scoreErrors[level]}
                          >
                            Fehler – Retry
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={stat.db_count === 0 || scoringAll}
                            onClick={() => scoreLevel(level).then(() => fetchStats())}
                            className="h-6 px-2 text-xs"
                          >
                            Score
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Import & Score All & Recalibrate */}
      <section className="flex flex-wrap items-center gap-3">
        <Button onClick={handleImport} disabled={importing || scoringAll || recalibrating} variant="outline">
          {importing ? (
            <><Loader2 className="size-4 animate-spin" /> Importiere…</>
          ) : (
            <><Upload className="size-4" /> Wörter importieren</>
          )}
        </Button>

        <Button onClick={handleScoreAll} disabled={scoringAll || importing || recalibrating}>
          {scoringAll ? (
            <><Loader2 className="size-4 animate-spin" /> Score läuft…</>
          ) : (
            "Alle Levels scoren"
          )}
        </Button>

        {importResult && (
          <span className="text-sm text-zinc-500">
            Importiert:{" "}
            {Object.entries(importResult)
              .filter(([, n]) => n > 0)
              .map(([l, n]) => `${l}: ${n}`)
              .join(", ")}
          </span>
        )}

        <div className="ml-auto flex items-center gap-3">
          <Button
            onClick={handleRecalibrate}
            disabled={recalibrating || scoringAll || importing}
            variant="outline"
            size="sm"
          >
            {recalibrating ? (
              <><Loader2 className="size-3 animate-spin" /> Rekalibriere…</>
            ) : (
              <><RefreshCw className="size-3" /> Scores rekalibrieren</>
            )}
          </Button>
          {recalibrateResult !== null && (
            <span className="text-xs text-zinc-500">{recalibrateResult.toLocaleString()} Scores aktualisiert</span>
          )}
        </div>
      </section>

      {/* Results table */}
      <section className="space-y-4">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold">Ergebnisse</h2>
          <div className="flex gap-1">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setResultsLevel(l)}
                className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
                  resultsLevel === l
                    ? LEVEL_COLORS[l]
                    : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {loadingResults ? (
          <div className="flex items-center gap-2 py-8 text-sm text-zinc-400">
            <Loader2 className="size-4 animate-spin" /> Laden…
          </div>
        ) : results.filter((r) => r.level === resultsLevel).length === 0 ? (
          <p className="text-sm text-zinc-400">
            Noch keine Scores für {resultsLevel}. Bitte importieren und scoren.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Wort</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">Top-Handlungsfeld</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">2. Platz</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-500">3. Platz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {results
                  .filter((r) => r.level === resultsLevel)
                  .map((word) => (
                    <tr key={word.id} className="bg-white dark:bg-zinc-950">
                      <td className="px-4 py-2 font-medium">{word.wort}</td>
                      {[0, 1, 2].map((i) => (
                        <td key={i} className="px-4 py-2">
                          {word.top_hf[i] ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${HF_SCORE_COLOR(word.top_hf[i].score)}`}
                            >
                              {word.top_hf[i].code}
                              <span className="font-normal opacity-75">
                                {word.top_hf[i].score.toFixed(2)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
