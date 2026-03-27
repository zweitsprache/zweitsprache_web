'use client'

import { useActionState, useState } from 'react'

interface RepeatableRowProps {
  id: string
  workshopId: string
  text: string
  onUpdate: (id: string, workshopId: string, formData: FormData) => Promise<{ error?: string } | undefined>
  onDelete: (id: string, workshopId: string) => Promise<{ error?: string } | undefined>
}

export function RepeatableRow({ id, workshopId, text, onUpdate, onDelete }: RepeatableRowProps) {
  const [editing, setEditing] = useState(false)

  const [updateState, updateAction, isUpdating] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await onUpdate(id, workshopId, formData)
      if (!result?.error) setEditing(false)
      return result ?? null
    },
    null
  )

  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await onDelete(id, workshopId)) ?? null
    },
    null
  )

  if (editing) {
    return (
      <form action={updateAction} className="flex gap-2">
        <input
          type="text"
          name="text"
          defaultValue={text}
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

  return (
    <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
      <p className="text-sm">{text}</p>
      <div className="flex gap-2">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Bearbeiten
        </button>
        <form action={deleteAction}>
          <button
            type="submit"
            disabled={isDeleting}
            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
          >
            {isDeleting ? '...' : 'Löschen'}
          </button>
        </form>
      </div>
      {deleteState?.error && <p className="text-xs text-red-600">{deleteState.error}</p>}
    </div>
  )
}
