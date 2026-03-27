'use client'

import { useActionState } from 'react'
import { deleteModule } from '../actions'

interface ModuleCardProps {
  id: string
  courseId: string
  title: string
  description: string | null
  lessonCount: number
  index: number
}

export function ModuleCard({ id, courseId, title, description, lessonCount, index }: ModuleCardProps) {
  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await deleteModule(id, courseId)) ?? null
    },
    null
  )

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex items-center justify-between">
        <a
          href={`/admin/kurse/${courseId}/module/${id}`}
          className="text-sm font-semibold hover:underline"
        >
          Modul {index}: {title}
        </a>
        <div className="flex gap-2">
          <a
            href={`/admin/kurse/${courseId}/module/${id}`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Bearbeiten
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
      </div>
      {description && (
        <p className="mb-2 text-xs text-zinc-500">{description}</p>
      )}
      <p className="text-xs text-zinc-400">
        {lessonCount} {lessonCount === 1 ? 'Lektion' : 'Lektionen'}
      </p>
      {deleteState?.error && (
        <p className="mt-2 text-sm text-red-600">{deleteState.error}</p>
      )}
    </div>
  )
}
