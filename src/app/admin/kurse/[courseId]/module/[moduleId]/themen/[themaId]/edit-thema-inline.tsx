'use client'

import { useActionState, useState } from 'react'
import { updateThema } from '../../../../../actions'

interface EditThemaInlineProps {
  id: string
  courseId: string
  title: string
  description: string | null
}

export function EditThemaInline({ id, courseId, title, description }: EditThemaInlineProps) {
  const [editing, setEditing] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await updateThema(id, courseId, formData)
      if (!result?.error) setEditing(false)
      return result ?? null
    },
    null
  )

  if (!editing) {
    return (
      <div className="rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        <button
          onClick={() => setEditing(true)}
          className="mt-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Bearbeiten
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-md bg-zinc-50 p-4 dark:bg-zinc-900">
      <input
        type="text"
        name="title"
        defaultValue={title}
        required
        placeholder="Titel"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <textarea
        name="description"
        defaultValue={description ?? ''}
        placeholder="Beschreibung (optional)"
        rows={3}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Speichern...' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Abbrechen
        </button>
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  )
}
