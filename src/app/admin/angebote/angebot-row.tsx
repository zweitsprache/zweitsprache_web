'use client'

import { useActionState, useState } from 'react'
import { deleteAngebot, updateAngebot } from './actions'

export function AngebotRow({ id, title }: { id: string; title: string }) {
  const [editing, setEditing] = useState(false)

  const [updateState, updateAction, isUpdating] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await updateAngebot(id, formData)
      if (!result?.error) setEditing(false)
      return result ?? null
    },
    null
  )

  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await deleteAngebot(id)) ?? null
    },
    null
  )

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <form action={updateAction} className="flex flex-1 gap-2">
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
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isUpdating ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Abbrechen
          </button>
        </form>
        {updateState?.error && (
          <p className="text-sm text-red-600">{updateState.error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <a
        href={`/admin/angebote/${id}`}
        className="flex-1 text-sm font-medium hover:underline"
      >
        {title}
      </a>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Bearbeiten
        </button>
        <form action={deleteAction}>
          <button
            type="submit"
            disabled={isDeleting}
            className="rounded-md border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            {isDeleting ? 'Löschen...' : 'Löschen'}
          </button>
        </form>
        {deleteState?.error && (
          <p className="text-sm text-red-600">{deleteState.error}</p>
        )}
      </div>
    </div>
  )
}
