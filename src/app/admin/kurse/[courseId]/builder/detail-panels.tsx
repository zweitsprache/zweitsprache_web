"use client"

import React, { useState, useTransition, useEffect } from "react"
import { BookOpen, FileText, FolderOpen, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WorksheetEditor } from "@/components/editor/worksheet-editor"
import { DEFAULT_SETTINGS } from "@/types/worksheet-constants"
import type { WorksheetBlock, WorksheetSettings } from "@/types/worksheet"
import type {
  CourseModule,
  CourseThema,
  CourseLernziel,
  TreeSelection,
} from "./types"
import {
  updateModuleInline,
  updateThemaInline,
  createModuleLernziel,
  deleteModuleLernziel,
  updateModuleLernziel,
} from "../../actions"

// ─── Course overview (default) ──────────────────────────────
export function CourseOverviewPanel({
  modules,
  onSelect,
}: {
  modules: CourseModule[]
  onSelect: (s: TreeSelection) => void
}) {
  const totalThemen = modules.reduce((sum, m) => sum + m.themen.length, 0)
  const totalLessons = modules.reduce(
    (sum, m) => m.themen.reduce((s, t) => s + t.lessons.length, sum),
    0
  )

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Kursübersicht</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border p-4 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{modules.length}</p>
          <p className="text-xs text-muted-foreground">Module</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <FolderOpen className="mx-auto h-6 w-6 text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{totalThemen}</p>
          <p className="text-xs text-muted-foreground">Themen</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <FileText className="mx-auto h-6 w-6 text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{totalLessons}</p>
          <p className="text-xs text-muted-foreground">Lektionen</p>
        </div>
      </div>

      {modules.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Struktur</h3>
          {modules.map((mod, i) => (
            <button
              key={mod.id}
              onClick={() => onSelect({ type: "module", moduleId: mod.id })}
              className="flex w-full items-center gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted transition-colors"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-medium text-blue-700">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{mod.title}</p>
                <p className="text-xs text-muted-foreground">
                  {mod.themen.length} Themen ·{" "}
                  {mod.themen.reduce((s, t) => s + t.lessons.length, 0)} Lektionen
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Module detail panel ────────────────────────────────────
export function ModuleDetailPanel({
  mod,
  courseId,
  onSelect,
}: {
  mod: CourseModule
  courseId: string
  onSelect: (s: TreeSelection) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(mod.title)
  const [description, setDescription] = useState(mod.description ?? "")
  const [lzText, setLzText] = useState("")

  const saveDetails = () => {
    startTransition(() => {
      updateModuleInline(mod.id, courseId, {
        title: title.trim(),
        description: description.trim() || null,
      })
    })
  }

  const addLernziel = () => {
    if (!lzText.trim()) return
    const fd = new FormData()
    fd.set("text", lzText.trim())
    startTransition(async () => {
      await createModuleLernziel(mod.id, courseId, fd)
      setLzText("")
    })
  }

  const removeLernziel = (id: string) => {
    startTransition(() => {
      deleteModuleLernziel(id, courseId)
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-500" />
          Modul bearbeiten
        </h2>

        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1">Titel</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveDetails}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Beschreibung</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDetails}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
      </div>

      {/* Lernziele */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Lernziele</h3>
        <div className="space-y-1.5 mb-2">
          {mod.module_lernziele.length === 0 ? (
            <p className="text-xs text-muted-foreground">Noch keine Lernziele definiert.</p>
          ) : (
            mod.module_lernziele.map((lz) => (
              <LernzielRow key={lz.id} lz={lz} courseId={courseId} onDelete={removeLernziel} />
            ))
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={lzText}
            onChange={(e) => setLzText(e.target.value)}
            placeholder="Neues Lernziel..."
            className="text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addLernziel()
              }
            }}
          />
          <Button size="sm" variant="outline" onClick={addLernziel} disabled={isPending}>
            +
          </Button>
        </div>
      </div>

      {/* Themen overview */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Themen</h3>
        {mod.themen.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Füge im Baum links Themen zu diesem Modul hinzu.
          </p>
        ) : (
          <div className="space-y-1">
            {mod.themen.map((thema, i) => (
              <button
                key={thema.id}
                onClick={() => onSelect({ type: "thema", moduleId: mod.id, themaId: thema.id })}
                className="flex w-full items-center gap-2 rounded-md border p-2 text-left text-xs hover:bg-muted transition-colors"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-[10px] font-medium text-amber-700">
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{thema.title}</span>
                <span className="text-muted-foreground">{thema.lessons.length} Lektionen</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LernzielRow({
  lz,
  courseId,
  onDelete,
}: {
  lz: CourseLernziel
  courseId: string
  onDelete: (id: string) => void
}) {
  const [text, setText] = useState(lz.text)
  const [isPending, startTransition] = useTransition()

  const save = () => {
    if (text.trim() && text.trim() !== lz.text) {
      const fd = new FormData()
      fd.set("text", text.trim())
      startTransition(() => {
        updateModuleLernziel(lz.id, courseId, fd)
      })
    }
  }

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="text-muted-foreground text-xs">•</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save()
        }}
        className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs outline-none hover:border-input focus:border-ring"
      />
      <button
        onClick={() => onDelete(lz.id)}
        disabled={isPending}
        className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive text-xs"
      >
        ×
      </button>
    </div>
  )
}

// ─── Thema detail panel ─────────────────────────────────────
export function ThemaDetailPanel({
  thema,
  moduleId,
  courseId,
  onSelect,
}: {
  thema: CourseThema
  moduleId: string
  courseId: string
  onSelect: (s: TreeSelection) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(thema.title)
  const [description, setDescription] = useState(thema.description ?? "")

  const saveDetails = () => {
    startTransition(() => {
      updateThemaInline(thema.id, courseId, {
        title: title.trim(),
        description: description.trim() || null,
      })
    })
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-amber-500" />
          Thema bearbeiten
        </h2>

        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1">Titel</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveDetails}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Beschreibung</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={saveDetails}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>
      </div>

      {/* Lessons list */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Lektionen</h3>
        {thema.lessons.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Füge im Baum links Lektionen zu diesem Thema hinzu.
          </p>
        ) : (
          <div className="space-y-1">
            {thema.lessons.map((lesson, i) => {
              const hasContent = lesson.data && typeof lesson.data === "object" && !Array.isArray(lesson.data) && Array.isArray((lesson.data as Record<string, unknown>).blocks) && ((lesson.data as Record<string, unknown>).blocks as unknown[]).length > 0
              return (
                <button
                  key={lesson.id}
                  onClick={() =>
                    onSelect({
                      type: "lesson",
                      moduleId,
                      themaId: thema.id,
                      lessonId: lesson.id,
                    })
                  }
                  className="flex w-full items-center gap-2 rounded-md border p-2 text-left text-xs hover:bg-muted transition-colors"
                >
                  <FileText className={`h-3.5 w-3.5 shrink-0 ${hasContent ? "text-emerald-500" : "text-muted-foreground/50"}`} />
                  <span className="flex-1 truncate">{lesson.title}</span>
                  <span className="text-muted-foreground text-[10px]">
                    {hasContent ? "✓" : "leer"}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Lesson editor wrapper ──────────────────────────────────
export function LessonEditorPanel({
  lessonId,
  courseId,
}: {
  lessonId: string
  courseId: string
}) {
  const [blocks, setBlocks] = useState<WorksheetBlock[]>([])
  const [settings, setSettings] = useState<WorksheetSettings>(DEFAULT_SETTINGS)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/lessons/${lessonId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Lektion nicht gefunden")
        return res.json()
      })
      .then((lesson) => {
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
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [lessonId])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Laden...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="h-full">
      <WorksheetEditor
        key={lessonId}
        lessonId={lessonId}
        initialTitle={title}
        initialBlocks={blocks}
        initialSettings={settings}
      />
    </div>
  )
}
