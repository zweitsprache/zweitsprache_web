"use client";

import { type Value } from "platejs";
import { PlateEditor } from "@/components/plate/editor";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function LessonEditor() {
  const params = useParams<{
    courseId: string;
    moduleId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const [data, setData] = useState<Value | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/lessons/${params.lessonId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lektion nicht gefunden");
        return res.json();
      })
      .then((lesson) => {
        const d = lesson.data;
        setData(Array.isArray(d) ? (d as Value) : null);
        setTitle(lesson.title || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.lessonId]);

  const handleSave = async (value: Value) => {
    const res = await fetch(`/api/lessons/${params.lessonId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: value }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error || "Speichern fehlgeschlagen");
    }
  };

  const backUrl = `/admin/kurse/${params.courseId}/module/${params.moduleId}`;

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
          onClick={() => router.push(backUrl)}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Zurück zum Modul
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <PlateEditor
        initialValue={data}
        onSave={handleSave}
        headerTitle={title}
        backUrl={backUrl}
      />
    </div>
  );
}
