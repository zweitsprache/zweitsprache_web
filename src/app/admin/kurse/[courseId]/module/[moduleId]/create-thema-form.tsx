'use client'

import { useActionState } from 'react'
import { createThema } from '../../../actions'

export function CreateThemaForm({ moduleId, courseId }: { moduleId: string; courseId: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await createThema(moduleId, courseId, formData)) ?? null
    },
    null
  )

  return (
    <form action={formAction} className="flex gap-2">
      <input
        type="text"
        name="title"
        placeholder="Neues Thema..."
        required
        className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isPending ? 'Erstellen...' : '+ Thema'}
      </button>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
