"use client"

import React, { useState, useRef, useEffect, useTransition } from "react"
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  FileText,
  FolderOpen,
  BookOpen,
  Trash2,
} from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CourseModule, CourseThema, CourseLesson, TreeSelection } from "./types"
import {
  createModuleInline,
  createThemaInline,
  createLessonInline,
  updateModuleInline,
  updateThemaInline,
  updateLessonInline,
  deleteModule,
  deleteThema,
  deleteLesson,
  reorderItems,
} from "../../actions"

// ─── Inline editable title ──────────────────────────────────
function InlineTitle({
  value,
  onSave,
  autoFocus,
  className,
}: {
  value: string
  onSave: (v: string) => void
  autoFocus?: boolean
  className?: string
}) {
  const [editing, setEditing] = useState(autoFocus ?? false)
  const [text, setText] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => {
    setText(value)
  }, [value])

  const commit = () => {
    const trimmed = text.trim()
    if (trimmed && trimmed !== value) {
      onSave(trimmed)
    } else {
      setText(value)
    }
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        className={cn("truncate cursor-default", className)}
        onDoubleClick={() => setEditing(true)}
      >
        {value}
      </span>
    )
  }

  return (
    <input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit()
        if (e.key === "Escape") {
          setText(value)
          setEditing(false)
        }
      }}
      className={cn(
        "w-full rounded border border-ring bg-background px-1 py-0 text-[inherit] outline-none",
        className
      )}
    />
  )
}

// ─── Sortable lesson item ───────────────────────────────────
function SortableLessonItem({
  lesson,
  courseId,
  moduleId,
  themaId,
  isSelected,
  onSelect,
  isNew,
}: {
  lesson: CourseLesson
  courseId: string
  moduleId: string
  themaId: string
  isSelected: boolean
  onSelect: () => void
  isNew?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const hasContent = lesson.data && typeof lesson.data === "object" && !Array.isArray(lesson.data) && Array.isArray((lesson.data as Record<string, unknown>).blocks) && ((lesson.data as Record<string, unknown>).blocks as unknown[]).length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-1 rounded-md py-0.5 pl-12 pr-1 text-xs transition-colors",
        isSelected
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted",
        isDragging && "opacity-50"
      )}
    >
      <button
        className="cursor-grab opacity-0 group-hover:opacity-60 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <FileText className={cn("h-3 w-3 shrink-0", hasContent ? "text-emerald-500" : "text-muted-foreground/50")} />
      <button className="flex-1 truncate text-left" onClick={onSelect}>
        <InlineTitle
          value={lesson.title}
          autoFocus={isNew}
          onSave={(v) =>
            startTransition(() => {
              updateLessonInline(lesson.id, courseId, { title: v })
            })
          }
          className="text-xs"
        />
      </button>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <button className="rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100 hover:text-destructive" />
          }
        >
          <Trash2 className="h-3 w-3" />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Lektion löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              «{lesson.title}» wird unwiderruflich gelöscht inkl. aller Inhalte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  deleteLesson(lesson.id, courseId)
                })
              }
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Thema group ────────────────────────────────────────────
function ThemaGroup({
  thema,
  courseId,
  moduleId,
  selection,
  onSelect,
  newLessonId,
}: {
  thema: CourseThema
  courseId: string
  moduleId: string
  selection: TreeSelection | null
  onSelect: (s: TreeSelection) => void
  newLessonId: string | null
}) {
  const [open, setOpen] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [localNewLessonId, setLocalNewLessonId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const isThemaSelected =
    selection?.type === "thema" && selection.themaId === thema.id

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = thema.lessons.findIndex((l) => l.id === active.id)
    const newIndex = thema.lessons.findIndex((l) => l.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...thema.lessons]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    startTransition(() => {
      reorderItems(
        "lessons",
        courseId,
        reordered.map((l, i) => ({ id: l.id, sort_order: i }))
      )
    })
  }

  const addLesson = () => {
    startTransition(async () => {
      const result = await createLessonInline(thema.id, courseId, "Neue Lektion")
      if (result?.id) {
        setLocalNewLessonId(result.id)
        onSelect({ type: "lesson", moduleId, themaId: thema.id, lessonId: result.id })
      }
    })
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-0.5 pl-6 pr-1 text-xs transition-colors",
          isThemaSelected
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground/80 hover:bg-muted"
        )}
      >
        <button
          className="shrink-0"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        <FolderOpen className="h-3 w-3 shrink-0 text-amber-500" />
        <button
          className="flex-1 truncate text-left"
          onClick={() =>
            onSelect({ type: "thema", moduleId, themaId: thema.id })
          }
        >
          <InlineTitle
            value={thema.title}
            onSave={(v) =>
              startTransition(() => {
                updateThemaInline(thema.id, courseId, { title: v })
              })
            }
            className="text-xs"
          />
        </button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <button className="rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100 hover:text-destructive" />
            }
          >
            <Trash2 className="h-3 w-3" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Thema löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                «{thema.title}» und alle {thema.lessons.length} zugehörigen
                Lektionen werden unwiderruflich gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    deleteThema(thema.id, courseId)
                  })
                }
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {open && (
        <div>
          <DndContext
            id={`lessons-${thema.id}`}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={thema.lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {thema.lessons.map((lesson) => (
                <SortableLessonItem
                  key={lesson.id}
                  lesson={lesson}
                  courseId={courseId}
                  moduleId={moduleId}
                  themaId={thema.id}
                  isSelected={
                    selection?.type === "lesson" &&
                    selection.lessonId === lesson.id
                  }
                  onSelect={() =>
                    onSelect({
                      type: "lesson",
                      moduleId,
                      themaId: thema.id,
                      lessonId: lesson.id,
                    })
                  }
                  isNew={lesson.id === (localNewLessonId ?? newLessonId)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            onClick={addLesson}
            disabled={isPending}
            className="flex items-center gap-1 pl-12 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" /> Lektion
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Module group ───────────────────────────────────────────
function ModuleGroup({
  mod,
  courseId,
  selection,
  onSelect,
  isNew,
}: {
  mod: CourseModule
  courseId: string
  selection: TreeSelection | null
  onSelect: (s: TreeSelection) => void
  isNew?: boolean
}) {
  const [open, setOpen] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [newThemaId, setNewThemaId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const isModuleSelected =
    selection?.type === "module" && selection.moduleId === mod.id

  const totalLessons = mod.themen.reduce(
    (sum, t) => sum + t.lessons.length,
    0
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = mod.themen.findIndex((t) => t.id === active.id)
    const newIndex = mod.themen.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...mod.themen]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    startTransition(() => {
      reorderItems(
        "themen",
        courseId,
        reordered.map((t, i) => ({ id: t.id, sort_order: i }))
      )
    })
  }

  const addThema = () => {
    startTransition(async () => {
      const result = await createThemaInline(mod.id, courseId, "Neues Thema")
      if (result?.id) {
        setNewThemaId(result.id)
        onSelect({ type: "thema", moduleId: mod.id, themaId: result.id })
      }
    })
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1 pl-1 pr-1 text-sm transition-colors",
          isModuleSelected
            ? "bg-primary/10 text-primary font-medium"
            : "text-foreground hover:bg-muted"
        )}
      >
        <button
          className="shrink-0"
          onClick={() => setOpen(!open)}
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        <button
          className="flex-1 truncate text-left"
          onClick={() => onSelect({ type: "module", moduleId: mod.id })}
        >
          <InlineTitle
            value={mod.title}
            autoFocus={isNew}
            onSave={(v) =>
              startTransition(() => {
                updateModuleInline(mod.id, courseId, { title: v })
              })
            }
            className="text-sm"
          />
        </button>
        <span className="shrink-0 text-[10px] text-muted-foreground mr-1">
          {totalLessons}
        </span>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <button className="rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100 hover:text-destructive" />
            }
          >
            <Trash2 className="h-3 w-3" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Modul löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                «{mod.title}» mit {mod.themen.length} Themen und {totalLessons}{" "}
                Lektionen wird unwiderruflich gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => {
                    deleteModule(mod.id, courseId)
                  })
                }
              >
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {open && (
        <div className="ml-1 border-l border-border/50">
          <DndContext
            id={`themen-${mod.id}`}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={mod.themen.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {mod.themen.map((thema) => (
                <ThemaGroup
                  key={thema.id}
                  thema={thema}
                  courseId={courseId}
                  moduleId={mod.id}
                  selection={selection}
                  onSelect={onSelect}
                  newLessonId={null}
                />
              ))}
            </SortableContext>
          </DndContext>
          <button
            onClick={addThema}
            disabled={isPending}
            className="flex items-center gap-1 pl-7 py-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" /> Thema
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main tree sidebar ──────────────────────────────────────
export function CourseTreeSidebar({
  courseId,
  modules,
  selection,
  onSelect,
}: {
  courseId: string
  modules: CourseModule[]
  selection: TreeSelection | null
  onSelect: (s: TreeSelection) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [newModuleId, setNewModuleId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = modules.findIndex((m) => m.id === active.id)
    const newIndex = modules.findIndex((m) => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = [...modules]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)

    startTransition(() => {
      reorderItems(
        "modules",
        courseId,
        reordered.map((m, i) => ({ id: m.id, sort_order: i }))
      )
    })
  }

  const addModule = () => {
    startTransition(async () => {
      const result = await createModuleInline(courseId, "Neues Modul")
      if (result?.id) {
        setNewModuleId(result.id)
        onSelect({ type: "module", moduleId: result.id })
      }
    })
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {modules.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground mb-1">
              Noch keine Module vorhanden.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mb-3">
              Module sind die Hauptkapitel deines Kurses.
            </p>
          </div>
        ) : (
          <DndContext
            id="modules"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={modules.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-0.5">
                {modules.map((mod) => (
                  <ModuleGroup
                    key={mod.id}
                    mod={mod}
                    courseId={courseId}
                    selection={selection}
                    onSelect={onSelect}
                    isNew={mod.id === newModuleId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-1.5 text-xs"
          onClick={addModule}
          disabled={isPending}
        >
          <Plus className="h-3.5 w-3.5" />
          Modul hinzufügen
        </Button>
      </div>
    </div>
  )
}
