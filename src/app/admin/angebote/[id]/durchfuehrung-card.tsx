'use client'

import { useActionState } from 'react'
import { deleteDurchfuehrung } from '../actions'
import { TerminRow } from './termin-row'
import { CreateTerminForm } from './create-termin-form'

interface Termin {
  id: string
  start_datetime: string
  end_datetime: string
}

interface DurchfuehrungCardProps {
  id: string
  angebotId: string
  index: number
  termine: Termin[]
}

export function DurchfuehrungCard({
  id,
  angebotId,
  index,
  termine,
}: DurchfuehrungCardProps) {
  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await deleteDurchfuehrung(id, angebotId)) ?? null
    },
    null
  )

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Durchführung {index}</h3>
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

      <div className="mb-3 flex flex-col gap-1.5">
        {termine.length > 0 ? (
          termine.map((t) => (
            <TerminRow
              key={t.id}
              id={t.id}
              angebotId={angebotId}
              startDatetime={t.start_datetime}
              endDatetime={t.end_datetime}
            />
          ))
        ) : (
          <p className="text-xs text-zinc-400">Noch keine Termine.</p>
        )}
      </div>

      <CreateTerminForm durchfuehrungId={id} angebotId={angebotId} />

      {deleteState?.error && (
        <p className="mt-2 text-sm text-red-600">{deleteState.error}</p>
      )}
    </div>
  )
}
