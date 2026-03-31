'use client'

import { useActionState, useState } from 'react'
import { updateLessonTitle, deleteLesson } from '../../../../../actions'

interface LessonRowProps {
  id: string
  courseId: string
  moduleId: string
  themaId: string
  title: string
}

export function LessonRow({ id, courseId, moduleId, themaId, title }: LessonRowProps) {
  const [editing, setEditing] = useState(false)

  const [updateState, updateAction, isUpdating] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await updateLessonTitle(id, courseId, formData)
      if (!result?.error) setEditing(false)
      return result ?? null
    },
    null
  )

  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await deleteLesson(id, courseId)) ?? null
    },
    null
  )

  if (editing) {
    return (
      <form action={updateAction} className="flex gap-2">
        <input
          type="text"
          name="title"
          defaultValue={title}
          required
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isUpdating}
          className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isUpdating ? 'Speichern...' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Abbrechen
        </button>
        {updateState?.error && <p className="text-xs text-red-600">{updateState.error}</p>}
      </form>
    )
  }

  const editorUrl = `/admin/kurse/${courseId}/module/${moduleId}/themen/${themaId}/lektionen/${id}`

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2">
        <a href={editorUrl} className="text-sm font-semibold hover:underline">
          {title}
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Umbenennen
        </button>
        <a
          href={editorUrl}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Editor
        </a>
        <form action={deleteAction}>
          <button
            type="submit"
            disabled={isDeleting}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            {isDeleting ? 'Löschen...' : 'Löschen'}
          </button>
        </form>
      </div>
      {deleteState?.error && <p className="mt-2 text-xs text-red-600">{deleteState.error}</p>}
    </div>
  )
}
