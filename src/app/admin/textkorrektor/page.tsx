"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { FileText, Image, Loader2, Plus, Save, Trash2, Upload, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextkorrektorPrompt {
  id: string;
  name: string;
  prompt: string;
  additional_info: string | null;
  sort_order: number;
  attachment_mime_type: string | null;
  created_at: string;
  updated_at: string;
}

type PromptSaveData = {
  name: string;
  prompt: string;
  additional_info: string;
  sort_order: number;
  attachment_base64?: string;
  attachment_mime_type?: string;
  remove_attachment?: boolean;
};

const EMPTY_FORM = { name: "", prompt: "", additional_info: "", sort_order: 0 };

function PromptCard({
  prompt,
  onSave,
  onDelete,
}: {
  prompt: TextkorrektorPrompt;
  onSave: (id: string, data: PromptSaveData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: prompt.name,
    prompt: prompt.prompt,
    additional_info: prompt.additional_info ?? "",
    sort_order: prompt.sort_order,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newAttachment, setNewAttachment] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const attachRef = useRef<HTMLInputElement>(null);

  const isDirty =
    form.name !== prompt.name ||
    form.prompt !== prompt.prompt ||
    form.additional_info !== (prompt.additional_info ?? "") ||
    form.sort_order !== prompt.sort_order ||
    newAttachment !== null ||
    removeAttachment;

  const handleAttachFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Datei zu gross (max. 5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setNewAttachment({ base64: dataUrl.split(",")[1], mimeType: file.type, name: file.name });
      setRemoveAttachment(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    const saveData: PromptSaveData = { ...form };
    if (newAttachment) {
      saveData.attachment_base64 = newAttachment.base64;
      saveData.attachment_mime_type = newAttachment.mimeType;
    } else if (removeAttachment) {
      saveData.remove_attachment = true;
    }
    await onSave(prompt.id, saveData);
    setNewAttachment(null);
    setRemoveAttachment(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Profil "${prompt.name}" wirklich löschen?`)) return;
    setDeleting(true);
    await onDelete(prompt.id);
    setDeleting(false);
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{prompt.name}</span>
          <span className="text-xs text-zinc-400">Reihenfolge: {prompt.sort_order}</span>
        </div>
        {open ? <ChevronUp className="size-4 text-zinc-400" /> : <ChevronDown className="size-4 text-zinc-400" />}
      </button>

      {open && (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-3 space-y-4 dark:border-zinc-800">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Name</label>
            <input
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Prompt</label>
            <textarea
              rows={6}
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              value={form.prompt}
              onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">
              Zusatzinformationen{" "}
              <span className="font-normal text-zinc-400">(optional – wird dem Prompt angehängt)</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="z.B. Lernende sind auf Niveau A2, Fokus auf Vergangenheitsformen…"
              value={form.additional_info}
              onChange={(e) => setForm((f) => ({ ...f, additional_info: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Reihenfolge</label>
            <input
              type="number"
              className="w-24 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            />
          </div>

          {/* Attachment */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500">
              Anhang{" "}
              <span className="font-normal text-zinc-400">(optional – PDF oder Bild, wird mit dem Prompt mitgesendet)</span>
            </label>

            {/* Existing attachment indicator */}
            {prompt.attachment_mime_type && !removeAttachment && !newAttachment && (
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">
                {prompt.attachment_mime_type === "application/pdf"
                  ? <FileText className="size-3.5 shrink-0 text-zinc-400" />
                  : <Image className="size-3.5 shrink-0 text-zinc-400" />}
                <span className="text-zinc-600 dark:text-zinc-400">
                  {prompt.attachment_mime_type === "application/pdf" ? "PDF" : "Bild"} vorhanden
                </span>
                <button
                  className="ml-auto text-zinc-400 hover:text-red-500"
                  onClick={() => setRemoveAttachment(true)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {/* Pending remove notice */}
            {removeAttachment && !newAttachment && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Anhang wird beim Speichern entfernt.{" "}
                <button className="underline" onClick={() => setRemoveAttachment(false)}>Rückgängig</button>
              </p>
            )}

            {/* New attachment preview */}
            {newAttachment && (
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">
                {newAttachment.mimeType === "application/pdf"
                  ? <FileText className="size-3.5 shrink-0 text-zinc-400" />
                  : <Image className="size-3.5 shrink-0 text-zinc-400" />}
                <span className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-400">{newAttachment.name}</span>
                <button
                  className="ml-auto shrink-0 text-zinc-400 hover:text-red-500"
                  onClick={() => setNewAttachment(null)}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            <button
              onClick={() => attachRef.current?.click()}
              className="flex items-center gap-1.5 rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:hover:border-zinc-600"
            >
              <Upload className="size-3.5" />
              {newAttachment || (!removeAttachment && prompt.attachment_mime_type) ? "Ersetzen" : "Datei auswählen"}
            </button>
            <input
              ref={attachRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleAttachFile}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              Löschen
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={!isDirty}
                onClick={() => {
                  setForm({
                    name: prompt.name,
                    prompt: prompt.prompt,
                    additional_info: prompt.additional_info ?? "",
                    sort_order: prompt.sort_order,
                  });
                  setNewAttachment(null);
                  setRemoveAttachment(false);
                }}
              >
                <X className="size-3" /> Verwerfen
              </Button>
              <Button size="sm" disabled={!isDirty || saving} onClick={handleSave}>
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TextkorrektorPromptsPage() {
  const [prompts, setPrompts] = useState<TextkorrektorPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/textkorrektor-prompts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler");
      setPrompts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (id: string, data: PromptSaveData) => {
    const res = await fetch(`/api/textkorrektor-prompts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } else {
      const err = await res.json();
      alert(err.error ?? "Fehler beim Speichern");
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/textkorrektor-prompts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPrompts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert("Fehler beim Löschen");
    }
  };

  const handleCreate = async () => {
    if (!newForm.name.trim() || !newForm.prompt.trim()) return;
    setCreating(true);
    const res = await fetch("/api/textkorrektor-prompts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) {
      const created = await res.json();
      setPrompts((prev) => [...prev, created]);
      setNewForm(EMPTY_FORM);
      setShowNew(false);
    } else {
      const err = await res.json();
      alert(err.error ?? "Fehler beim Erstellen");
    }
    setCreating(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Textkorrektor – Profile</h1>
          <p className="text-sm text-zinc-500">Korrekturprofile verwalten, die im Textkorrektor-Tool auswählbar sind.</p>
        </div>
        <Button size="sm" onClick={() => setShowNew((v) => !v)}>
          <Plus className="size-3" /> Neues Profil
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {showNew && (
        <div className="rounded-lg border border-zinc-300 bg-zinc-50 p-4 space-y-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Neues Profil</h2>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Name</label>
            <input
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="z.B. Feedback A2"
              value={newForm.name}
              onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Prompt</label>
            <textarea
              rows={6}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="Du bist ein DaZ-Lehrer..."
              value={newForm.prompt}
              onChange={(e) => setNewForm((f) => ({ ...f, prompt: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">
              Zusatzinformationen <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="z.B. Lernende sind auf Niveau A2…"
              value={newForm.additional_info}
              onChange={(e) => setNewForm((f) => ({ ...f, additional_info: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Reihenfolge</label>
            <input
              type="number"
              className="w-24 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              value={newForm.sort_order}
              onChange={(e) => setNewForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setShowNew(false); setNewForm(EMPTY_FORM); }}>
              Abbrechen
            </Button>
            <Button size="sm" disabled={!newForm.name.trim() || !newForm.prompt.trim() || creating} onClick={handleCreate}>
              {creating ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
              Erstellen
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" /> Laden…
        </div>
      ) : prompts.length === 0 ? (
        <p className="text-sm text-zinc-400">Noch keine Profile vorhanden.</p>
      ) : (
        <div className="space-y-3">
          {prompts.map((p) => (
            <PromptCard key={p.id} prompt={p} onSave={handleSave} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
