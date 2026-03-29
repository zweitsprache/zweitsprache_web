"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Database, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";

type Handlungsfeld = { code: string; name: string };
type Subdomain = { id: string; hf_code: string; name: string; sort_order: number };

export default function HfKontextPage() {
  const [handlungsfelder, setHandlungsfelder] = useState<Handlungsfeld[]>([]);
  const [selectedHF, setSelectedHF] = useState<string>("");
  const [jsonInput, setJsonInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; subdomains?: number; ids?: string[]; error?: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subdomains, setSubdomains] = useState<Subdomain[]>([]);
  const [loadingSubdomains, setLoadingSubdomains] = useState(false);

  useEffect(() => {
    fetch("/api/handlungsfelder")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHandlungsfelder(data);
          if (data.length > 0) setSelectedHF(data[0].code);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedHF) return;
    setLoadingSubdomains(true);
    setResult(null);
    fetch(`/api/hf-kontext?hf_code=${selectedHF}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setSubdomains(data);
        else setSubdomains([]);
      })
      .finally(() => setLoadingSubdomains(false));
  }, [selectedHF]);

  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith(".json") && file.type !== "application/json") {
      setResult({ ok: false, error: "Nur .json-Dateien werden akzeptiert." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonInput(text);
      setFileName(file.name);
      setResult(null);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!selectedHF || !jsonInput.trim()) return;
    setSaving(true);
    setResult(null);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonInput);
      } catch {
        setResult({ ok: false, error: "Ungültiges JSON. Bitte überprüfen." });
        return;
      }
      const res = await fetch("/api/hf-kontext", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hf_code: selectedHF, context_json: parsed }),
      });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        // Reload subdomains
        setLoadingSubdomains(true);
        fetch(`/api/hf-kontext?hf_code=${selectedHF}`)
          .then((r) => r.json())
          .then((d) => { if (Array.isArray(d)) setSubdomains(d); })
          .finally(() => setLoadingSubdomains(false));
        setJsonInput("");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HF Strukturkontext</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Strukturiertes Kontextwissen (JSON) pro Handlungsfeld hochladen. Subdomains werden automatisch eingebettet
          und beim Textgenerator für präzise Fakten, Terminologie und Fehlervermeidung genutzt.
        </p>
      </div>

      {/* HF Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium w-32 shrink-0">Handlungsfeld</label>
        <select
          className="border rounded-md px-3 py-2 text-sm bg-background w-64"
          value={selectedHF}
          onChange={(e) => setSelectedHF(e.target.value)}
        >
          {handlungsfelder.map((hf) => (
            <option key={hf.code} value={hf.code}>
              {hf.code} – {hf.name}
            </option>
          ))}
        </select>
      </div>

      {/* Current subdomains */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Database className="h-4 w-4 text-muted-foreground" />
          Gespeicherte Subdomains
        </div>
        {loadingSubdomains ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Lädt…
          </div>
        ) : subdomains.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Subdomains gespeichert für dieses Handlungsfeld.
          </p>
        ) : (
          <ul className="space-y-1">
            {subdomains.map((sd) => (
              <li key={sd.id} className="text-sm flex gap-2">
                <span className="font-mono text-xs text-muted-foreground w-56 shrink-0">{sd.id}</span>
                <span>{sd.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* JSON input with drag-and-drop */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Strukturkontext JSON</label>
        <p className="text-xs text-muted-foreground">
          Vollständiges JSON-Objekt mit{" "}
          <code className="bg-muted px-1 rounded">handlungsfeld.subdomains</code> (inkl.
          actors, institutions, processes, terminology, common_mistakes_in_texts).
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer px-6 py-6 transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40"
          }`}
        >
          <UploadCloud className={`h-7 w-7 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
          {fileName ? (
            <span className="text-sm font-medium">{fileName}</span>
          ) : (
            <span className="text-sm text-muted-foreground">
              JSON-Datei hier ablegen oder <span className="underline">auswählen</span>
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* Preview / manual edit */}
        {jsonInput && (
          <textarea
            className="w-full h-48 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-y"
            value={jsonInput}
            onChange={(e) => { setJsonInput(e.target.value); setFileName(null); }}
            spellCheck={false}
          />
        )}

        {!jsonInput && (
          <textarea
            className="w-full h-48 rounded-md border bg-background px-3 py-2 text-xs font-mono resize-y"
            placeholder={"{\n  \"schema_version\": \"1.0\",\n  \"handlungsfeld\": {\n    \"subdomains\": [ ... ]\n  }\n}"}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            spellCheck={false}
          />
        )}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSave}
          disabled={saving || !jsonInput.trim() || !selectedHF}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichern & Einbetten…
            </>
          ) : (
            "Speichern & Subdomains einbetten"
          )}
        </Button>

        {result && (
          <div className={`flex items-center gap-2 text-sm ${result.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {result.ok ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {result.subdomains} Subdomain{result.subdomains !== 1 ? "s" : ""} gespeichert und eingebettet.
              </>
            ) : (
              <>Fehler: {result.error}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
