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
  anweisung: string;
  is_personal: boolean;
  is_dialog: boolean;
  sort_order: number;
};

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
    anweisung: "",
    is_personal: false,
    is_dialog: false,
    sort_order: 0,
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
          anweisung: "",
          is_personal: false,
          is_dialog: false,
          sort_order: 0,
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
            Textsorten mit Anweisungen verwalten. Die Anweisungen werden in den Prompt injiziert.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(!showNew)}>
          {showNew ? <X className="size-3" /> : <Plus className="size-3" />}
          {showNew ? "Abbrechen" : "Neue Textsorte"}
        </Button>
      </div>

      {/* New item form */}
      {showNew && (
        <div className="space-y-3 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
          <h3 className="text-sm font-semibold">Neue Textsorte</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Key (eindeutig, keine Leerzeichen)</label>
              <Input
                value={newForm.key ?? ""}
                onChange={(e) => setNewForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="z.B. messenger"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Label</label>
              <Input
                value={newForm.label ?? ""}
                onChange={(e) => setNewForm((p) => ({ ...p, label: e.target.value }))}
                placeholder="z.B. Messenger"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Gruppe</label>
              <Input
                value={newForm.gruppe ?? ""}
                onChange={(e) => setNewForm((p) => ({ ...p, gruppe: e.target.value }))}
                placeholder="z.B. Korrespondenz"
                list="gruppen-list"
              />
              <datalist id="gruppen-list">
                {gruppen.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Reihenfolge</label>
              <Input
                type="number"
                value={newForm.sort_order ?? 0}
                onChange={(e) => setNewForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Anweisung</label>
            <textarea
              value={newForm.anweisung ?? ""}
              onChange={(e) => setNewForm((p) => ({ ...p, anweisung: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Prompt-Anweisung für diese Textsorte…"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newForm.is_personal ?? false}
                onChange={(e) => setNewForm((p) => ({ ...p, is_personal: e.target.checked }))}
              />
              Persönlich (Ich-Form statt «man»)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newForm.is_dialog ?? false}
                onChange={(e) => setNewForm((p) => ({ ...p, is_dialog: e.target.checked }))}
              />
              Dialog (keine Längensteuerung)
            </label>
          </div>
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Key</label>
                      <Input
                        value={editForm.key ?? ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, key: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Label</label>
                      <Input
                        value={editForm.label ?? ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, label: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Gruppe</label>
                      <Input
                        value={editForm.gruppe ?? ""}
                        onChange={(e) => setEditForm((p) => ({ ...p, gruppe: e.target.value }))}
                        list="gruppen-edit-list"
                      />
                      <datalist id="gruppen-edit-list">
                        {gruppen.map((g) => (
                          <option key={g} value={g} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-zinc-500">Reihenfolge</label>
                      <Input
                        type="number"
                        value={editForm.sort_order ?? 0}
                        onChange={(e) => setEditForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-500">Anweisung</label>
                    <textarea
                      value={editForm.anweisung ?? ""}
                      onChange={(e) => setEditForm((p) => ({ ...p, anweisung: e.target.value }))}
                      rows={3}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.is_personal ?? false}
                        onChange={(e) => setEditForm((p) => ({ ...p, is_personal: e.target.checked }))}
                      />
                      Persönlich
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editForm.is_dialog ?? false}
                        onChange={(e) => setEditForm((p) => ({ ...p, is_dialog: e.target.checked }))}
                      />
                      Dialog
                    </label>
                  </div>
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.label}</span>
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
                    {t.anweisung && (
                      <p className="mt-1 text-sm text-zinc-500">{t.anweisung}</p>
                    )}
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
