"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, X, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Textsorte = {
  id: string;
  key: string;
  label: string;
  gruppe: string;
  is_personal: boolean;
  is_dialog: boolean;
  sort_order: number;
  register: string | null;
  funktion: string[] | null;
  perspektive: string | null;
  textaufbau: string[] | null;
  typische_sprachhandlungen: string[] | null;
  typische_konnektoren: string[] | null;
  textlaenge_richtwert: string | null;
  layout_merkmale: string[] | null;
  adressat: string | null;
  signalwoerter: string[] | null;
};

// ── Reusable per-item array editor ──────────────────────────────────────────
function ArrayFieldEditor({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[] | null;
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const items = value ?? [];
  return (
    <div>
      <label className="mb-1 block text-xs text-zinc-500">{label}</label>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex gap-1">
            <Input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className="h-7 text-xs"
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="shrink-0 rounded px-1.5 text-zinc-400 hover:text-red-500"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <Plus className="size-3" /> Hinzufügen
        </button>
      </div>
    </div>
  );
}

export default function TextsortenPage() {
  const [textsorten, setTextsorten] = useState<Textsorte[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Textsorte>>({});

  // New item form
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<Partial<Textsorte>>({
    key: "",
    label: "",
    gruppe: "",
    is_personal: false,
    is_dialog: false,
    sort_order: 0,
    register: "",
    funktion: [],
    perspektive: "",
    textaufbau: [],
    typische_sprachhandlungen: [],
    typische_konnektoren: [],
    textlaenge_richtwert: "",
    layout_merkmale: [],
    adressat: "",
    signalwoerter: [],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/textsorten");
      const data = await res.json();
      if (Array.isArray(data)) setTextsorten(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startEdit = (t: Textsorte) => {
    setEditId(t.id);
    setEditForm({ ...t });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editId) return;
    setSaving(editId);
    try {
      const res = await fetch("/api/textsorten", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editId, ...editForm }),
      });
      if (res.ok) {
        await loadData();
        setEditId(null);
      }
    } finally {
      setSaving(null);
    }
  };

  const deleteItem = async (id: string) => {
    setSaving(id);
    try {
      const res = await fetch("/api/textsorten", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setTextsorten((prev) => prev.filter((t) => t.id !== id));
      }
    } finally {
      setSaving(null);
    }
  };

  const addItem = async () => {
    if (!newForm.key || !newForm.label || !newForm.gruppe) return;
    setSaving("new");
    try {
      const res = await fetch("/api/textsorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newForm),
      });
      if (res.ok) {
        await loadData();
        setNewForm({
          key: "",
          label: "",
          gruppe: "",
          is_personal: false,
          is_dialog: false,
          sort_order: 0,
          register: "",
          funktion: [],
          perspektive: "",
          textaufbau: [],
          typische_sprachhandlungen: [],
          typische_konnektoren: [],
          textlaenge_richtwert: "",
          layout_merkmale: [],
          adressat: "",
          signalwoerter: [],
        });
        setShowNew(false);
      }
    } finally {
      setSaving(null);
    }
  };

  // Group textsorten by gruppe
  const grouped = textsorten.reduce<Record<string, Textsorte[]>>((acc, t) => {
    if (!acc[t.gruppe]) acc[t.gruppe] = [];
    acc[t.gruppe].push(t);
    return acc;
  }, {});

  // Collect unique group names for the new-form dropdown
  const gruppen = [...new Set(textsorten.map((t) => t.gruppe))];

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin" /> Laden…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Textsorten</h1>
          <p className="text-sm text-zinc-500">
            Textsorten und ihre strukturierten Richtlinien verwalten.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(!showNew)}>
          {showNew ? <X className="size-3" /> : <Plus className="size-3" />}
          {showNew ? "Abbrechen" : "Neue Textsorte"}
        </Button>
      </div>

      {/* New item form */}
      {showNew && (
        <div className="space-y-4 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <h3 className="text-sm font-semibold">Neue Textsorte</h3>
          <TextsorteFormFields
            form={newForm}
            setForm={setNewForm}
            gruppen={gruppen}
            datalistId="gruppen-new"
          />
          <Button size="sm" onClick={addItem} disabled={saving === "new" || !newForm.key || !newForm.label || !newForm.gruppe}>
            {saving === "new" ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
            Hinzufügen
          </Button>
        </div>
      )}

      {/* Grouped list */}
      {Object.entries(grouped).map(([gruppe, items]) => (
        <div key={gruppe} className="space-y-2">
          <h2 className="border-b border-zinc-200 pb-1 text-sm font-semibold text-zinc-500 dark:border-zinc-800">
            {gruppe}
          </h2>
          {items.map((t) => (
            <div
              key={t.id}
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              {editId === t.id ? (
                <div className="space-y-3">
                  <TextsorteFormFields
                    form={editForm}
                    setForm={setEditForm}
                    gruppen={gruppen}
                    datalistId="gruppen-edit"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveEdit} disabled={saving === t.id}>
                      {saving === t.id ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                      Speichern
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit}>
                      <X className="size-3" /> Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    {/* Header row */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.label}</span>
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
                        {t.key}
                      </span>
                      {t.is_personal && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                          persönlich
                        </span>
                      )}
                      {t.is_dialog && (
                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                          dialog
                        </span>
                      )}
                    </div>
                    {/* Structured fields */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1 text-xs">
                      {t.register && (
                        <ReadField label="Register" value={t.register} />
                      )}
                      {t.perspektive && (
                        <ReadField label="Perspektive" value={t.perspektive} />
                      )}
                      {t.adressat && (
                        <ReadField label="Adressat" value={t.adressat} />
                      )}
                      {t.textlaenge_richtwert && (
                        <ReadField label="Textlänge (Richtwert)" value={t.textlaenge_richtwert} />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      {t.funktion && t.funktion.length > 0 && (
                        <ReadTags label="Funktion" items={t.funktion} />
                      )}
                      {t.textaufbau && t.textaufbau.length > 0 && (
                        <ReadTags label="Textaufbau" items={t.textaufbau} />
                      )}
                      {t.typische_sprachhandlungen && t.typische_sprachhandlungen.length > 0 && (
                        <ReadTags label="Typische Sprachhandlungen" items={t.typische_sprachhandlungen} />
                      )}
                      {t.typische_konnektoren && t.typische_konnektoren.length > 0 && (
                        <ReadTags label="Typische Konnektoren" items={t.typische_konnektoren} />
                      )}
                      {t.layout_merkmale && t.layout_merkmale.length > 0 && (
                        <ReadTags label="Layout-Merkmale" items={t.layout_merkmale} />
                      )}
                      {t.signalwoerter && t.signalwoerter.length > 0 && (
                        <ReadTags label="Signalwörter" items={t.signalwoerter} />
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="icon-xs" variant="ghost" onClick={() => startEdit(t)}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="destructive"
                      onClick={() => deleteItem(t.id)}
                      disabled={saving === t.id}
                    >
                      {saving === t.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Read-only display helpers ─────────────────────────────────────────────────
function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="font-medium text-zinc-400">{label}: </span>
      <span className="text-zinc-600 dark:text-zinc-300">{value}</span>
    </div>
  );
}

function ReadTags({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="mb-0.5 font-medium text-zinc-400">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((item, i) => (
          <span
            key={i}
            className="rounded bg-zinc-100 px-1.5 py-0.5 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Shared form fields component ──────────────────────────────────────────────
function TextsorteFormFields({
  form,
  setForm,
  gruppen,
  datalistId,
}: {
  form: Partial<Textsorte>;
  setForm: (patch: Partial<Textsorte>) => void;
  gruppen: string[];
  datalistId: string;
}) {
  const set = <K extends keyof Textsorte>(key: K, val: Textsorte[K]) =>
    setForm({ ...form, [key]: val });

  return (
    <div className="space-y-4">
      {/* Basic metadata */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Key (eindeutig, keine Leerzeichen)</label>
          <Input value={form.key ?? ""} onChange={(e) => set("key", e.target.value)} placeholder="z.B. messenger" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Label</label>
          <Input value={form.label ?? ""} onChange={(e) => set("label", e.target.value)} placeholder="z.B. Messenger" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Gruppe</label>
          <Input
            value={form.gruppe ?? ""}
            onChange={(e) => set("gruppe", e.target.value)}
            placeholder="z.B. Korrespondenz"
            list={datalistId}
          />
          <datalist id={datalistId}>
            {gruppen.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-xs text-zinc-500">Reihenfolge</label>
          <Input
            type="number"
            value={form.sort_order ?? 0}
            onChange={(e) => set("sort_order", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Flags */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_personal ?? false} onChange={(e) => set("is_personal", e.target.checked)} />
          Persönlich (Ich-Form statt «man»)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_dialog ?? false} onChange={(e) => set("is_dialog", e.target.checked)} />
          Dialog (keine Längensteuerung)
        </label>
      </div>

      <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <p className="mb-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">Strukturierte Richtlinien</p>

        {/* Text fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Register</label>
            <Input
              value={form.register ?? ""}
              onChange={(e) => set("register", e.target.value)}
              placeholder="z.B. informell, formell"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Perspektive</label>
            <Input
              value={form.perspektive ?? ""}
              onChange={(e) => set("perspektive", e.target.value)}
              placeholder="z.B. 1. Person Singular"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Adressat</label>
            <Input
              value={form.adressat ?? ""}
              onChange={(e) => set("adressat", e.target.value)}
              placeholder="z.B. Bekannte, Arbeitgeber"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Textlänge (Richtwert)</label>
            <Input
              value={form.textlaenge_richtwert ?? ""}
              onChange={(e) => set("textlaenge_richtwert", e.target.value)}
              placeholder="z.B. 50–100 Wörter"
            />
          </div>
        </div>

        {/* Array fields */}
        <div className="mt-3 grid grid-cols-2 gap-4">
          <ArrayFieldEditor
            label="Funktion"
            value={form.funktion ?? []}
            onChange={(v) => set("funktion", v)}
            placeholder="z.B. Informieren"
          />
          <ArrayFieldEditor
            label="Textaufbau"
            value={form.textaufbau ?? []}
            onChange={(v) => set("textaufbau", v)}
            placeholder="z.B. Einleitung"
          />
          <ArrayFieldEditor
            label="Typische Sprachhandlungen"
            value={form.typische_sprachhandlungen ?? []}
            onChange={(v) => set("typische_sprachhandlungen", v)}
            placeholder="z.B. berichten, schildern"
          />
          <ArrayFieldEditor
            label="Typische Konnektoren"
            value={form.typische_konnektoren ?? []}
            onChange={(v) => set("typische_konnektoren", v)}
            placeholder="z.B. weil, obwohl"
          />
          <ArrayFieldEditor
            label="Layout-Merkmale"
            value={form.layout_merkmale ?? []}
            onChange={(v) => set("layout_merkmale", v)}
            placeholder="z.B. Betreffzeile"
          />
          <ArrayFieldEditor
            label="Signalwörter"
            value={form.signalwoerter ?? []}
            onChange={(v) => set("signalwoerter", v)}
            placeholder="z.B. Liebe/r, Mit freundlichen Grüßen"
          />
        </div>
      </div>
    </div>
  );
}
