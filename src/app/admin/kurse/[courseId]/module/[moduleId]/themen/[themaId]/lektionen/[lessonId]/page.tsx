"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorksheetEditor } from "@/components/editor/worksheet-editor";
import {
  WorksheetBlock,
  WorksheetSettings,
} from "@/types/worksheet";
import { DEFAULT_SETTINGS } from "@/types/worksheet-constants";

export default function LessonEditor() {
  const params = useParams<{
    courseId: string;
    moduleId: string;
    themaId: string;
    lessonId: string;
  }>();
  const router = useRouter();
  const [blocks, setBlocks] = useState<WorksheetBlock[]>([]);
  const [settings, setSettings] = useState<WorksheetSettings>(DEFAULT_SETTINGS);
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
        if (d && typeof d === "object" && !Array.isArray(d) && Array.isArray(d.blocks)) {
          setBlocks(d.blocks as WorksheetBlock[]);
          setSettings({ ...DEFAULT_SETTINGS, ...(d.settings ?? {}) });
        } else {
          setBlocks([]);
          setSettings(DEFAULT_SETTINGS);
        }
        setTitle(lesson.title || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.lessonId]);

  const backUrl = `/admin/kurse/${params.courseId}/module/${params.moduleId}/themen/${params.themaId}`;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Laden...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => router.push(backUrl)}
          className="text-sm text-zinc-500 hover:text-zinc-900"
        >
          ← Zurück zum Thema
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <WorksheetEditor
        lessonId={params.lessonId}
        initialTitle={title}
        initialBlocks={blocks}
        initialSettings={settings}
        backUrl={backUrl}
      />
    </div>
  );
}
