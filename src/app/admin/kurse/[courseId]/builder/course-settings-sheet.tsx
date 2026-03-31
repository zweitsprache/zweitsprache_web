"use client"

import React, { useState, useTransition } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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
import type { CourseData } from "./types"
import { updateCourseInline, deleteCourse } from "../../actions"

export function CourseSettingsSheet({
  course,
}: {
  course: CourseData
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(course.title)
  const [subtitle, setSubtitle] = useState(course.subtitle ?? "")
  const [about, setAbout] = useState(course.about ?? "")
  const [coverImageUrl, setCoverImageUrl] = useState(course.cover_image_url ?? "")
  const [published, setPublished] = useState(course.published)

  const save = () => {
    startTransition(() => {
      updateCourseInline(course.id, {
        title,
        subtitle: subtitle || null,
        about: about || null,
        cover_image_url: coverImageUrl || null,
        published,
      })
    })
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Settings className="h-4 w-4 mr-1.5" />
        Einstellungen
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Kurs-Einstellungen</SheetTitle>
          <SheetDescription>
            Metadaten und Veröffentlichung
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 p-4">
          <div>
            <Label className="text-xs mb-1">Titel</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Untertitel</Label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Beschreibung</Label>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div>
            <Label className="text-xs mb-1">Cover-Bild URL</Label>
            <Input
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="published-toggle"
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="published-toggle" className="text-sm cursor-pointer">
              Veröffentlicht
            </Label>
          </div>

          <Button onClick={save} disabled={isPending} className="w-full">
            {isPending ? "Speichern..." : "Speichern"}
          </Button>

          <hr className="my-2" />

          <div>
            <p className="text-xs font-semibold text-destructive mb-2">Gefahrenzone</p>
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button variant="destructive" size="sm" className="w-full" />
                }
              >
                Kurs löschen
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Kurs endgültig löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    «{course.title}» und alle Module, Themen und Lektionen werden
                    unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig
                    gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={() => {
                      startTransition(() => {
                        deleteCourse(course.id)
                      })
                    }}
                  >
                    Ja, Kurs löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
