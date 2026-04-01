"use client"

import React, { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { CourseData, CourseModule, TreeSelection } from "./types"
import { CourseTreeSidebar } from "./course-tree-sidebar"
import { CourseSettingsSheet } from "./course-settings-sheet"
import {
  CourseOverviewPanel,
  ModuleDetailPanel,
  ThemaDetailPanel,
  ThemaEditorPanel,
  LessonEditorPanel,
} from "./detail-panels"

export function CourseBuilder({
  course,
  modules,
}: {
  course: CourseData
  modules: CourseModule[]
}) {
  const [selection, setSelection] = useState<TreeSelection | null>(null)
  const [themaEditorOpen, setThemaEditorOpen] = useState<string | null>(null)

  // Resolve current selection to actual data
  const selectedModule = selection && "moduleId" in selection
    ? modules.find((m) => m.id === selection.moduleId)
    : undefined

  const selectedThema = selection?.type === "thema" || selection?.type === "lesson"
    ? selectedModule?.themen.find((t) => t.id === selection.themaId)
    : undefined

  // Close thema content editor when selection changes away from the thema
  React.useEffect(() => {
    if (selection?.type !== "thema") setThemaEditorOpen(null)
  }, [selection])

  const isLessonSelected = selection?.type === "lesson"

  // Breadcrumb
  const breadcrumbs: { label: string; sel: TreeSelection | null }[] = [
    { label: course.title, sel: null },
  ]
  if (selectedModule && selection && "moduleId" in selection) {
    breadcrumbs.push({ label: selectedModule.title, sel: { type: "module", moduleId: selectedModule.id } })
  }
  if (selectedThema && selection && "themaId" in selection && "moduleId" in selection) {
    breadcrumbs.push({
      label: selectedThema.title,
      sel: { type: "thema", moduleId: selection.moduleId, themaId: selectedThema.id },
    })
  }
  if (isLessonSelected && selection) {
    const lesson = selectedThema?.lessons.find((l) => l.id === selection.lessonId)
    if (lesson) {
      breadcrumbs.push({ label: lesson.title, sel: selection })
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <a href="/admin/kurse">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </a>
          <nav className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((bc, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {i < breadcrumbs.length - 1 ? (
                  <button
                    onClick={() => setSelection(bc.sel)}
                    className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                  >
                    {bc.label}
                  </button>
                ) : (
                  <span className="font-medium truncate max-w-[200px]">{bc.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
              course.published
                ? "bg-emerald-100 text-emerald-700"
                : "bg-zinc-100 text-zinc-600"
            }`}
          >
            {course.published ? "Veröffentlicht" : "Entwurf"}
          </span>
          <CourseSettingsSheet course={course} />
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree sidebar */}
        <div className="w-64 shrink-0 border-r bg-muted/30 overflow-hidden">
          <CourseTreeSidebar
            courseId={course.id}
            modules={modules}
            selection={selection}
            onSelect={setSelection}
          />
        </div>

        {/* Detail area */}
        <div className="flex-1 overflow-hidden">
          {isLessonSelected && selection ? (
            <LessonEditorPanel
              lessonId={selection.lessonId}
              courseId={course.id}
            />
          ) : themaEditorOpen ? (
            <ThemaEditorPanel
              key={themaEditorOpen}
              themaId={themaEditorOpen}
            />
          ) : (
            <ScrollArea className="h-full">
              {!selection || selection.type === "course" ? (
                <CourseOverviewPanel
                  modules={modules}
                  onSelect={setSelection}
                />
              ) : selection.type === "module" && selectedModule ? (
                <ModuleDetailPanel
                  mod={selectedModule}
                  courseId={course.id}
                  onSelect={setSelection}
                />
              ) : selection.type === "thema" && selectedThema && selectedModule ? (
                <ThemaDetailPanel
                  thema={selectedThema}
                  moduleId={selectedModule.id}
                  courseId={course.id}
                  onSelect={setSelection}
                  onEditContent={() => setThemaEditorOpen(selectedThema.id)}
                />
              ) : (
                <CourseOverviewPanel
                  modules={modules}
                  onSelect={setSelection}
                />
              )}
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  )
}
