"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronRight, Copy, Download, FileText, Loader2, Upload, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

const CATEGORY_COLORS: Record<string, string> = {
  Grammatik: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  Rechtschreibung: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
  Zeichensetzung: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  Wortstellung: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  Ausdruck: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  Zeitform: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400",
};

const LANGUAGES = [
  "Albanisch", "Arabisch", "Bulgarisch", "Chinesisch (Mandarin)", "Dänisch",
  "Englisch", "Finnisch", "Französisch", "Griechisch", "Hindi", "Indonesisch",
  "Italienisch", "Japanisch", "Koreanisch", "Kroatisch", "Niederländisch",
  "Norwegisch", "Persisch", "Polnisch", "Portugiesisch", "Rumänisch", "Russisch",
  "Schwedisch", "Serbisch", "Slowakisch", "Slowenisch", "Spanisch", "Tschechisch",
  "Türkisch", "Ukrainisch", "Ungarisch", "Vietnamesisch",
];

type Annotation = {
  original: string;
  corrected: string;
  explanation: string;
  category: string;
};

type Result = {
  rawText: string;
  correctedText: string;
  annotations: Annotation[];
  summary: string;
  ocrEngine: "claude";
};

type PromptOption = { id: string; name: string };

type TaskTab = "none" | "text" | "file";
type SolutionTab = "text" | "file";

export default function Textkorrektor() {
  // Solution image upload
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string } | null>(null);

  // OCR
  const [ocrLoading, setOcrLoading] = useState(false);
  const [rawText, setRawText] = useState<string | null>(null);
  const [editableRawText, setEditableRawText] = useState("");

  // Aufgabe section
  const [taskTab, setTaskTab] = useState<TaskTab>("none");
  const [taskText, setTaskText] = useState("");
  const [taskImagePreview, setTaskImagePreview] = useState<string | null>(null);
  const [taskImageData, setTaskImageData] = useState<{ base64: string; mimeType: string } | null>(null);
  const [taskPdfData, setTaskPdfData] = useState<{ base64: string; name: string } | null>(null);
  const [taskFileDragOver, setTaskFileDragOver] = useState(false);

  // Lösung section
  const [solutionTab, setSolutionTab] = useState<SolutionTab>("text");

  // Correction config
  const [prompts, setPrompts] = useState<PromptOption[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [translateComments, setTranslateComments] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Englisch");
  const [customLanguage, setCustomLanguage] = useState("");
  const [isCustomLanguage, setIsCustomLanguage] = useState(false);

  // Correction result
  const [correctLoading, setCorrectLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"raw" | "corrected" | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const taskFileRef = useRef<HTMLInputElement>(null);

  // Sync editable text when OCR completes
  useEffect(() => {
    if (rawText !== null) setEditableRawText(rawText);
  }, [rawText]);

  // Load prompts once OCR completes
  useEffect(() => {
    if (rawText === null) return;
    setPromptsLoading(true);
    fetch("/api/textkorrektor-prompts")
      .then((r) => r.json())
      .then((data: PromptOption[]) => {
        setPrompts(data);
        if (data.length > 0) setSelectedPromptId(data[0].id);
      })
      .catch(() => setPrompts([]))
      .finally(() => setPromptsLoading(false));
  }, [rawText]);

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Bitte nur Bilddateien hochladen (JPEG, PNG, WebP, GIF)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Das Bild ist zu gross (max. 10 MB)");
      return;
    }
    setError(null);
    setRawText(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(",")[1];
      setImageData({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const processTaskFile = useCallback((file: File) => {
    const reader = new FileReader();
    if (file.type === "application/pdf") {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setTaskPdfData({ base64: dataUrl.split(",")[1], name: file.name });
        setTaskImagePreview(null);
        setTaskImageData(null);
      };
    } else if (file.type.startsWith("image/")) {
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setTaskImagePreview(dataUrl);
        setTaskImageData({ base64: dataUrl.split(",")[1], mimeType: file.type });
        setTaskPdfData(null);
      };
    } else {
      return;
    }
    reader.readAsDataURL(file);
  }, []);

  const clearImage = () => {
    setImagePreview(null);
    setImageData(null);
    setRawText(null);
    setEditableRawText("");
    setResult(null);
    setError(null);
    setTaskTab("none");
    setTaskText("");
    setTaskImagePreview(null);
    setTaskImageData(null);
    setTaskPdfData(null);
    if (inputRef.current) inputRef.current.value = "";
    if (taskFileRef.current) taskFileRef.current.value = "";
  };

  const recognise = async () => {
    if (!imageData) return;
    setOcrLoading(true);
    setError(null);
    setRawText(null);
    setResult(null);
    try {
      const res = await fetch("/api/textkorrektor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData.base64, mimeType: imageData.mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unbekannter Fehler");
      setRawText(data.rawText);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler bei der Texterkennung");
    } finally {
      setOcrLoading(false);
    }
  };

  const proceedWithText = () => {
    const trimmed = editableRawText.trim();
    if (!trimmed) return;
    setRawText(trimmed);
  };

  const correct = async () => {
    if (!editableRawText.trim()) return;
    setCorrectLoading(true);
    setError(null);
    setResult(null);
    try {
      const targetLanguage = translateComments
        ? (isCustomLanguage ? customLanguage.trim() : selectedLanguage)
        : undefined;
      const body: Record<string, unknown> = {
        text: editableRawText,
        promptId: selectedPromptId || undefined,
        targetLanguage,
      };
      if (taskTab === "text" && taskText.trim()) {
        body.taskText = taskText.trim();
      } else if (taskTab === "file" && taskImageData) {
        body.taskImage = taskImageData;
      } else if (taskTab === "file" && taskPdfData) {
        body.taskPdf = { base64: taskPdfData.base64 };
      }
      const res = await fetch("/api/textkorrektor/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unbekannter Fehler");
      setResult({ annotations: [], rawText: editableRawText, ocrEngine: "claude", ...data });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler bei der Korrektur");
    } finally {
      setCorrectLoading(false);
    }
  };

  const stripMarkdown = (text: string): string =>
    text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/#{1,6}\s+/g, "")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/^\s*[-*+]\s/gm, "\u2022 ")
      .trim();

  const parseMarkdownTable = (text: string): { headers: string[]; rows: string[][] } | null => {
    const tableLines = text
      .split("\n")
      .filter((l) => l.includes("|") && l.trim().startsWith("|"));
    // Need at least header + separator + one data row
    if (tableLines.length < 3) return null;
    const parseCells = (line: string) =>
      line.split("|").slice(1, -1).map((c) => c.trim());
    const headers = parseCells(tableLines[0]);
    // tableLines[1] is the separator row (---|---)
    const rows = tableLines.slice(2).map(parseCells).filter((r) => r.some((c) => c));
    if (!headers.length || !rows.length) return null;
    return { headers, rows };
  };

  const downloadPdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentW = pageW - margin * 2;

      const addSectionTitle = (text: string, y: number): number => {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(text, margin, y);
        return y + 6;
      };

      const addBodyText = (text: string, y: number): number => {
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(text, contentW);
        doc.text(lines, margin, y);
        return y + lines.length * 5;
      };

      const checkPageBreak = (y: number, reserve = 30): number => {
        if (y > pageH - reserve) {
          doc.addPage();
          return 20;
        }
        return y;
      };

      // ── Page 1: Aufgabe + Kandidatenlösung + Optimierte Lösung ──
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Textkorrektor – Korrektur", margin, 18);
      let y = 28;

      if (taskTab !== "none" && taskText.trim()) {
        y = addSectionTitle("Aufgabe", y);
        y = addBodyText(taskText.trim(), y) + 8;
        y = checkPageBreak(y);
      } else if (taskTab === "file") {
        y = addSectionTitle("Aufgabe", y);
        y = addBodyText("[Als Datei hochgeladen]", y) + 8;
        y = checkPageBreak(y);
      }

      y = addSectionTitle("Kandidatenlösung", y);
      y = addBodyText(result.rawText, y) + 8;
      y = checkPageBreak(y);

      y = addSectionTitle("Optimierte Lösung", y);
      addBodyText(result.correctedText, y);

      // ── Page 2: Marks table (summary) ──
      if (result.summary) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Bewertung", margin, 18);

        const tableData = parseMarkdownTable(result.summary);
        if (tableData) {
          autoTable(doc, {
            head: [tableData.headers],
            body: tableData.rows,
            startY: 26,
            margin: { left: margin, right: margin },
            styles: { fontSize: 10, cellPadding: 3 },
            headStyles: { fillColor: [63, 63, 70] },
          });
          // Text outside the table
          const nonTableText = result.summary
            .split("\n")
            .filter((l) => !l.startsWith("|"))
            .join("\n")
            .trim();
          if (nonTableText) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const afterY = (doc as any).lastAutoTable.finalY + 8;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(stripMarkdown(nonTableText), contentW);
            doc.text(lines, margin, afterY);
          }
        } else {
          addBodyText(stripMarkdown(result.summary), 26);
        }
      }

      // ── Page 3+: Annotated corrections ──
      if ((result.annotations?.length ?? 0) > 0) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`Korrekturen (${result.annotations.length})`, margin, 18);

        autoTable(doc, {
          head: [["#", "Original", "Korrektur", "Kategorie", "Erklärung"]],
          body: result.annotations.map((a, i) => [
            String(i + 1),
            a.original,
            a.corrected,
            a.category,
            stripMarkdown(a.explanation),
          ]),
          startY: 26,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
          headStyles: { fillColor: [63, 63, 70] },
          columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 28 },
            2: { cellWidth: 28 },
            3: { cellWidth: 25 },
            4: { cellWidth: "auto" },
          },
        });
      }

      doc.save("korrektur.pdf");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim PDF-Export");
    } finally {
      setPdfLoading(false);
    }
  };

  const copyText = async (type: "raw" | "corrected") => {
    const text = type === "raw" ? result?.rawText : result?.correctedText;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const TASK_TABS: { id: TaskTab; label: string }[] = [
    { id: "none", label: "Keine" },
    { id: "text", label: "Text" },
    { id: "file", label: "Bild / PDF" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="relative h-48 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-56 md:h-64">
        <Image
          src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
          alt="Textkorrektor"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 to-slate-900/20 p-6 sm:p-8">
          <Link href="/tools" className="mb-4 inline-block text-sm text-zinc-300 hover:text-white">
            ← Alle Tools
          </Link>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Textkorrektor</h1>
          <p className="mt-2 text-lg text-zinc-200">
            Handgeschriebene Texte fotografieren, erkennen und korrigieren lassen.
          </p>
        </div>
      </div>

      {/* Content + Sidebar */}
      <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
        {/* ── Aufgabe – always shown before results ── */}
      {!result && (
        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Aufgabe</h2>

          {/* Tab bar */}
          <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
            {TASK_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTaskTab(tab.id)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  taskTab === tab.id
                    ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {taskTab === "none" && (
            <p className="text-xs text-zinc-400">Keine Aufgabenstellung – der Text wird ohne Kontext korrigiert.</p>
          )}

          {taskTab === "text" && (
            <textarea
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              rows={5}
              placeholder="Aufgabenstellung hier einfügen…"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
            />
          )}

          {taskTab === "file" && (
            <div className="space-y-3">
              {/* Preview of loaded file */}
              {taskImagePreview ? (
                <div className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={taskImagePreview} alt="Aufgabenbild" className="max-h-60 w-full object-contain" />
                  <button
                    onClick={() => { setTaskImagePreview(null); setTaskImageData(null); if (taskFileRef.current) taskFileRef.current.value = ""; }}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : taskPdfData ? (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900">
                  <FileText className="size-5 shrink-0 text-zinc-400" />
                  <span className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-zinc-300">{taskPdfData.name}</span>
                  <button
                    onClick={() => { setTaskPdfData(null); if (taskFileRef.current) taskFileRef.current.value = ""; }}
                    className="shrink-0 text-zinc-400 hover:text-zinc-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div
                  onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setTaskFileDragOver(false); const f = e.dataTransfer.files[0]; if (f) processTaskFile(f); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setTaskFileDragOver(true); }}
                  onDragLeave={(e) => { e.stopPropagation(); setTaskFileDragOver(false); }}
                  onClick={() => taskFileRef.current?.click()}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors ${
                    taskFileDragOver
                      ? "border-slate-400 bg-slate-50 text-slate-600 dark:border-slate-500 dark:bg-slate-900"
                      : "border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <Upload className="size-4" />
                  Bild oder PDF ablegen oder klicken
                </div>
              )}
              <input
                ref={taskFileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processTaskFile(f); }}
              />
            </div>
          )}
        </section>
      )}

      {/* ── Lösung ── */}
      {!result && (
        <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">Lösung</h2>

          {/* Tab bar */}
          <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
            {(["text", "file"] as SolutionTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setSolutionTab(tab)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  solutionTab === tab
                    ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab === "text" ? "Text" : "Datei"}
              </button>
            ))}
          </div>

          {/* Text tab – paste directly, skip OCR */}
          {solutionTab === "text" && (
            <div className="space-y-3">
              <textarea
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                rows={8}
                placeholder="Text des Lernenden hier einfügen…"
                value={editableRawText}
                onChange={(e) => setEditableRawText(e.target.value)}
              />
              {rawText === null && (
                <Button className="w-full" onClick={proceedWithText} disabled={!editableRawText.trim()}>
                  Weiter →
                </Button>
              )}
            </div>
          )}

          {/* File tab – image upload + OCR */}
          {solutionTab === "file" && (
            <div>
              {!imagePreview ? (
                <div
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => inputRef.current?.click()}
                  className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors ${
                    dragOver
                      ? "border-slate-400 bg-slate-50 text-slate-600 dark:border-slate-500 dark:bg-slate-900"
                      : "border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <Upload className="size-4" />
                  Bild hier ablegen oder klicken
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Hochgeladenes Bild" className="max-h-60 w-full object-contain" />
                    <button
                      onClick={clearImage}
                      className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-black/70"
                      aria-label="Bild entfernen"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  {rawText === null && (
                    <Button className="w-full" onClick={recognise} disabled={ocrLoading}>
                      {ocrLoading && <Loader2 className="size-4 animate-spin" />}
                      {ocrLoading ? "Text wird erkannt…" : "Text erkennen"}
                    </Button>
                  )}
                  {rawText !== null && (
                    <>
                      <textarea
                        className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                        rows={8}
                        value={editableRawText}
                        onChange={(e) => setEditableRawText(e.target.value)}
                      />
                      <p className="text-xs text-zinc-400">
                        Erkannter Text – Tippfehler der Texterkennung können hier korrigiert werden.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* OCR loading skeleton */}
      {ocrLoading && (
        <div className="mb-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" style={{ width: `${70 + i * 8}%` }} />
          ))}
        </div>
      )}

      {/* Korrektur konfigurieren */}
      {rawText !== null && !result && (
        <div className="space-y-6">

          {/* ── Korrektur konfigurieren ── */}
          <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <ChevronRight className="size-4 text-zinc-400" />
              Korrektur konfigurieren
            </h2>

            {/* Prompt selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500">Korrekturprofil</label>
              {promptsLoading ? (
                <div className="h-9 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
              ) : prompts.length === 0 ? (
                <p className="text-xs text-zinc-400">Keine Profile vorhanden – Standardkorrektur wird verwendet.</p>
              ) : (
                <select
                  className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  value={selectedPromptId}
                  onChange={(e) => setSelectedPromptId(e.target.value)}
                >
                  {prompts.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Translate toggle */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Korrekturen übersetzen</p>
                  <p className="text-xs text-zinc-400">Erklärungen und Bewertung in einer anderen Sprache ausgeben</p>
                </div>
                <button
                  role="switch"
                  aria-checked={translateComments}
                  onClick={() => setTranslateComments((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    translateComments ? "bg-slate-700" : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      translateComments ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {translateComments && (
                <div className="space-y-2">
                  <select
                    className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    value={isCustomLanguage ? "__custom__" : selectedLanguage}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setIsCustomLanguage(true);
                      } else {
                        setIsCustomLanguage(false);
                        setSelectedLanguage(e.target.value);
                      }
                    }}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                    <option value="__custom__">Andere Sprache…</option>
                  </select>
                  {isCustomLanguage && (
                    <input
                      className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder="Sprache eingeben, z.B. Tigrinya"
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>

            <Button
              className="w-full"
              onClick={correct}
              disabled={correctLoading || !editableRawText.trim() || (translateComments && isCustomLanguage && !customLanguage.trim())}
            >
              {correctLoading && <Loader2 className="size-4 animate-spin" />}
              {correctLoading ? "Korrigiere…" : "Korrigieren"}
            </Button>
          </section>
        </div>
      )}

      {/* Correction loading skeleton */}
      {correctLoading && (
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" style={{ width: `${60 + i * 9}%` }} />
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Raw text */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Erkannter Text (Original)
              </h2>
              <button
                onClick={() => copyText("raw")}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {copied === "raw" ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied === "raw" ? "Kopiert" : "Kopieren"}
              </button>
            </div>
            <pre className="font-sans whitespace-pre-wrap rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {result.rawText}
            </pre>
          </section>

          {/* Corrected text */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Korrigierter Text
              </h2>
              <button
                onClick={() => copyText("corrected")}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {copied === "corrected" ? <Check className="size-3" /> : <Copy className="size-3" />}
                {copied === "corrected" ? "Kopiert" : "Kopieren"}
              </button>
            </div>
            <pre className="font-sans whitespace-pre-wrap rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-zinc-700 dark:border-green-800 dark:bg-green-950/20 dark:text-zinc-300">
              {result.correctedText}
            </pre>
          </section>

          {/* Annotations */}
          {(result.annotations?.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Korrekturen ({result.annotations.length})
              </h2>
              <div className="space-y-2">
                {result.annotations.map((a, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-zinc-100 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="line-through text-sm text-zinc-400">{a.original}</span>
                      <span className="text-zinc-400">→</span>
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                        {a.corrected}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          CATEGORY_COLORS[a.category] ?? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {a.category}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 prose prose-xs max-w-none dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.explanation}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Summary */}
          {result.summary && (
            <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
              <h2 className="mb-1 text-sm font-semibold text-blue-800 dark:text-blue-300">
                Gesamtbewertung
              </h2>
              <div className="text-sm text-blue-700 dark:text-blue-400 prose prose-sm prose-blue max-w-none dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary}</ReactMarkdown>
              </div>
            </section>
          )}

          <div className="flex gap-3">
            <Button className="flex-1 gap-2" onClick={downloadPdf} disabled={pdfLoading}>
              {pdfLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {pdfLoading ? "PDF wird erstellt…" : "PDF herunterladen"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={clearImage}>
              Neues Bild analysieren
            </Button>
          </div>
        </div>
      )}
        </div>

        {/* Sidebar */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Weitere Tools</h2>
          <Link
            href="/tools/textgenerator"
            className="group block overflow-hidden rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <div className="relative h-36 bg-zinc-100 dark:bg-zinc-800">
              <Image
                src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
                alt="Textgenerator"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/60 to-transparent p-4">
                <h3 className="text-base font-semibold text-white group-hover:underline">Textgenerator</h3>
                <p className="mt-0.5 text-xs text-zinc-200">Authentische Texte für den DaZ-Unterricht generieren</p>
              </div>
            </div>
            <div className="p-3">
              <span className="block rounded-md bg-teal-700 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-teal-800">
                Öffnen
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
