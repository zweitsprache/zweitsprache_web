"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Regel = {
  id: string;
  handlungsfeld_code: string;
  regel: string;
  sort_order: number;
};

type Handlungsfeld = {
  code: string;
  name: string;
};

export default function KontextregelnPage() {
  const [handlungsfelder, setHandlungsfelder] = useState<Handlungsfeld[]>([]);
  const [selectedHF, setSelectedHF] = useState<string>("");
  const [regeln, setRegeln] = useState<Regel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // New rule form
  const [newRegel, setNewRegel] = useState("");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [adding, setAdding] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editSort, setEditSort] = useState(0);

  useEffect(() => {
    fetch("/api/handlungsfelder")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setHandlungsfelder(data);
          if (data.length > 0) setSelectedHF(data[0].code);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedHF) return;
    setLoading(true);
    fetch(`/api/kontextregeln?handlungsfeld=${selectedHF}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRegeln(data);
      })
      .finally(() => setLoading(false));
  }, [selectedHF]);

  const addRegel = async () => {
    if (!newRegel.trim() || !selectedHF) return;
    setAdding(true);
    try {
      const res = await fetch("/api/kontextregeln", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handlungsfeld_code: selectedHF,
          regel: newRegel.trim(),
          sort_order: newSortOrder,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setRegeln((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
        setNewRegel("");
        setNewSortOrder(Math.max(...regeln.map((r) => r.sort_order), 0) + 1);
      }
    } finally {
      setAdding(false);
    }
  };

  const updateRegel = async (id: string) => {
    if (!editText.trim()) return;
    setSaving(id);
    try {
      const res = await fetch("/api/kontextregeln", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, regel: editText.trim(), sort_order: editSort }),
      });
      if (res.ok) {
        setRegeln((prev) =>
          prev
            .map((r) => (r.id === id ? { ...r, regel: editText.trim(), sort_order: editSort } : r))
            .sort((a, b) => a.sort_order - b.sort_order)
        );
        setEditId(null);
      }
    } finally {
      setSaving(null);
    }
  };

  const deleteRegel = async (id: string) => {
    setSaving(id);
    try {
      const res = await fetch("/api/kontextregeln", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setRegeln((prev) => prev.filter((r) => r.id !== id));
      }
    } finally {
      setSaving(null);
    }
  };

  const startEdit = (r: Regel) => {
    setEditId(r.id);
    setEditText(r.regel);
    setEditSort(r.sort_order);
  };

  // Auto-set next sort_order when HF changes
  useEffect(() => {
    setNewSortOrder(Math.max(...regeln.map((r) => r.sort_order), 0) + 1);
  }, [regeln]);

  const selectedHFName = handlungsfelder.find((h) => h.code === selectedHF)?.name ?? "";

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Kontextregeln</h1>
      <p className="text-sm text-zinc-500">
        Landeskundliche Fakten pro Handlungsfeld. Diese werden automatisch in den Prompt injiziert,
        wenn ein Text für das entsprechende Handlungsfeld generiert wird.
      </p>

      {/* Handlungsfeld selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Handlungsfeld:</label>
        <select
          value={selectedHF}
          onChange={(e) => setSelectedHF(e.target.value)}
          className="h-8 rounded-lg border border-zinc-300 bg-white px-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {handlungsfelder.map((h) => (
            <option key={h.code} value={h.code}>
              {h.code} – {h.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rules list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" /> Laden…
        </div>
      ) : (
        <div className="space-y-2">
          {regeln.length === 0 && (
            <p className="text-sm text-zinc-400">
              Keine Regeln für «{selectedHFName}» vorhanden.
            </p>
          )}

          {regeln.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
            >
              {editId === r.id ? (
                <div className="flex flex-1 flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-500">Reihenfolge:</label>
                    <Input
                      type="number"
                      value={editSort}
                      onChange={(e) => setEditSort(Number(e.target.value))}
                      className="w-20"
                    />
                    <Button size="sm" onClick={() => updateRegel(r.id)} disabled={saving === r.id}>
                      {saving === r.id ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                      Speichern
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>
                      <X className="size-3" /> Abbrechen
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="mt-0.5 shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
                    {r.sort_order}
                  </span>
                  <p
                    className="flex-1 cursor-pointer text-sm hover:text-zinc-600 dark:hover:text-zinc-300"
                    onClick={() => startEdit(r)}
                  >
                    {r.regel}
                  </p>
                  <Button
                    size="icon-xs"
                    variant="destructive"
                    onClick={() => deleteRegel(r.id)}
                    disabled={saving === r.id}
                  >
                    {saving === r.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                  </Button>
                </>
              )}
            </div>
          ))}

          {/* Add new rule */}
          <div className="mt-4 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
            <div className="flex flex-col gap-2">
              <textarea
                value={newRegel}
                onChange={(e) => setNewRegel(e.target.value)}
                placeholder="Neue Kontextregel eingeben…"
                rows={2}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-zinc-500">Reihenfolge:</label>
                <Input
                  type="number"
                  value={newSortOrder}
                  onChange={(e) => setNewSortOrder(Number(e.target.value))}
                  className="w-20"
                />
                <Button size="sm" onClick={addRegel} disabled={adding || !newRegel.trim()}>
                  {adding ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                  Hinzufügen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
