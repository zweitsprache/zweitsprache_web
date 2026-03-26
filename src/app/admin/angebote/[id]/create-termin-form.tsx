'use client'

import { useActionState, useState } from 'react'
import { createTermin } from '../actions'

export function CreateTerminForm({
  durchfuehrungId,
  angebotId,
}: {
  durchfuehrungId: string
  angebotId: string
}) {
  const [open, setOpen] = useState(false)

  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const result = await createTermin(durchfuehrungId, angebotId, formData)
      if (!result?.error) setOpen(false)
      return result ?? null
    },
    null
  )

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
      >
        + Termin hinzufügen
      </button>
    )
  }

  return (
    <form action={formAction} className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Datum</label>
          <input
            type="date"
            name="date"
            required
            className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Von</label>
          <input
            type="time"
            name="start_time"
            required
            className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-zinc-500">Bis</label>
          <input
            type="time"
            name="end_time"
            required
            className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? 'Speichern...' : 'Speichern'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Abbrechen
          </button>
        </div>
      </div>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
