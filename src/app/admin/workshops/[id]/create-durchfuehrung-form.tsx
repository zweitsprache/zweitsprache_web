'use client'

import { useActionState } from 'react'
import { createDurchfuehrung } from '../actions'

export function CreateDurchfuehrungForm({ workshopId }: { workshopId: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await createDurchfuehrung(workshopId)) ?? null
    },
    null
  )

  return (
    <div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Erstellen...' : '+ Durchführung hinzufügen'}
        </button>
      </form>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </div>
  )
}
