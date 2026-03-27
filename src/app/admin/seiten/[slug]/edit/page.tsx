"use client";

import { type Value } from "platejs";
import { PlateEditor } from "@/components/plate/editor";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditPageEditor() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [data, setData] = useState<Value | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/pages/${params.slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Seite nicht gefunden");
        return res.json();
      })
      .then((page) => {
        const d = page.data;
        setData(Array.isArray(d) ? (d as Value) : null);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.slug]);

  const handleSave = async (value: Value) => {
    const res = await fetch(`/api/pages/${params.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: value }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Speichern fehlgeschlagen");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Laden...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => router.push("/admin/seiten")}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Zurück zu Seiten
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <PlateEditor
        initialValue={data}
        onSave={handleSave}
        headerTitle={params.slug}
        backUrl="/admin/seiten"
      />
    </div>
  );
}
