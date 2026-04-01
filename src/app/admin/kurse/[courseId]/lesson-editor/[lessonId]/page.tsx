"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { WorksheetEditor } from "@/components/editor/worksheet-editor"
import { WorksheetBlock, WorksheetSettings, ContentLocale } from "@/types/worksheet"
import { DEFAULT_SETTINGS } from "@/types/worksheet-constants"

export default function LessonEditorPage() {
  const params = useParams<{ courseId: string; lessonId: string }>()
  const [blocks, setBlocks] = useState<WorksheetBlock[]>([])
  const [settings, setSettings] = useState<WorksheetSettings>(DEFAULT_SETTINGS)
  const [title, setTitle] = useState("")
  const [availableLocales, setAvailableLocales] = useState<ContentLocale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/lessons/${params.lessonId}`).then((res) => {
        if (!res.ok) throw new Error("Lektion nicht gefunden")
        return res.json()
      }),
      fetch(`/api/courses/${params.courseId}/languages`).then((res) =>
        res.ok ? res.json() : { available_languages: [] }
      ),
    ])
      .then(([lesson, courseData]) => {
        const d = lesson.data
        if (
          d &&
          typeof d === "object" &&
          !Array.isArray(d) &&
          Array.isArray(d.blocks)
        ) {
          setBlocks(d.blocks as WorksheetBlock[])
          setSettings({ ...DEFAULT_SETTINGS, ...(d.settings ?? {}) })
        } else {
          setBlocks([])
          setSettings(DEFAULT_SETTINGS)
        }
        setTitle(lesson.title || "")
        const langs: string[] = courseData.available_languages ?? []
        setAvailableLocales(langs.filter((l): l is ContentLocale => l === "en" || l === "uk"))
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [params.lessonId, params.courseId])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Laden...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="h-screen">
      <WorksheetEditor
        lessonId={params.lessonId}
        initialTitle={title}
        initialBlocks={blocks}
        initialSettings={settings}
        availableLocales={availableLocales}
      />
    </div>
  )
}
