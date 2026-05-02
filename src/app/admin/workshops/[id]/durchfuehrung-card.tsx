'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { deleteDurchfuehrung, updateDurchfuehrungOrt } from '../actions'
import { TerminRow } from './termin-row'
import { CreateTerminForm } from './create-termin-form'

interface Termin {
  id: string
  start_datetime: string
  end_datetime: string
}

interface DurchfuehrungCardProps {
  id: string
  workshopId: string
  index: number
  termine: Termin[]
  ort: string | null
  status?: string
}

const STATUS_LABELS: Record<string, string> = {
  geplant: 'Geplant',
  'bestätigt': 'Bestätigt',
  abgesagt: 'Abgesagt',
}

const STATUS_COLORS: Record<string, string> = {
  geplant: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
  'bestätigt': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  abgesagt: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

export function DurchfuehrungCard({
  id,
  workshopId,
  index,
  termine,
  ort,
  status = 'geplant',
}: DurchfuehrungCardProps) {
  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await deleteDurchfuehrung(id, workshopId)) ?? null
    },
    null
  )

  const [ortState, ortAction, isUpdatingOrt] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await updateDurchfuehrungOrt(id, workshopId, formData)) ?? null
    },
    null
  )

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Durchführung {index}</h3>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.geplant}`}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/durchfuehrungen/${id}`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Verwalten →
          </Link>
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

      <div className="mb-3 flex flex-col gap-1.5">
        {termine.length > 0 ? (
          termine.map((t) => (
            <TerminRow
              key={t.id}
              id={t.id}
              workshopId={workshopId}
              startDatetime={t.start_datetime}
              endDatetime={t.end_datetime}
            />
          ))
        ) : (
          <p className="text-xs text-zinc-400">Noch keine Termine.</p>
        )}
      </div>

      <CreateTerminForm durchfuehrungId={id} workshopId={workshopId} />

      <form action={ortAction} className="mt-3 flex gap-2">
        <input
          type="text"
          name="ort"
          defaultValue={ort ?? ''}
          placeholder="Durchführungsort"
          className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isUpdatingOrt}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {isUpdatingOrt ? 'Speichern...' : 'Ort speichern'}
        </button>
      </form>
      {ortState?.error && (
        <p className="mt-1 text-sm text-red-600">{ortState.error}</p>
      )}

      {deleteState?.error && (
        <p className="mt-2 text-sm text-red-600">{deleteState.error}</p>
      )}
    </div>
  )
}
