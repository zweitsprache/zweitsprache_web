'use client'

import { useActionState, useState } from 'react'
import { deleteTermin, updateTermin } from '../actions'

interface TerminRowProps {
  id: string
  angebotId: string
  startDatetime: string
  endDatetime: string
}

function formatDateTime(dt: string) {
  const d = new Date(dt)
  return {
    date: d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }),
    dateInput: d.toISOString().slice(0, 10),
    timeInput: d.toTimeString().slice(0, 5),
  }
}

export function TerminRow({ id, angebotId, startDatetime, endDatetime }: TerminRowProps) {
  const [editing, setEditing] = useState(false)
  const start = formatDateTime(startDatetime)
  const end = formatDateTime(endDatetime)

  const [updateState, updateAction, isUpdating] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await updateTermin(id, angebotId, formData)
      if (!result?.error) setEditing(false)
      return result ?? null
    },
    null
  )

  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await deleteTermin(id, angebotId)) ?? null
    },
    null
  )

  if (editing) {
    return (
      <form action={updateAction} className="flex flex-col gap-2 rounded-md border border-zinc-200 p-2 sm:flex-row sm:items-end dark:border-zinc-700">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Datum</label>
          <input
            type="date"
            name="date"
            defaultValue={start.dateInput}
            required
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Von</label>
          <input
            type="time"
            name="start_time"
            defaultValue={start.timeInput}
            required
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Bis</label>
          <input
            type="time"
            name="end_time"
            defaultValue={end.timeInput}
            required
            className="rounded-md border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex gap-2">
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
        </div>
        {updateState?.error && <p className="text-xs text-red-600">{updateState.error}</p>}
      </form>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900">
      <p className="text-sm">
        {start.date} · {start.time} – {end.time}
      </p>
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
