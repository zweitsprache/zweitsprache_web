'use client'

import { useActionState } from 'react'

interface CreateStimmeFormProps {
  workshopId: string
  onCreate: (workshopId: string, formData: FormData) => Promise<{ error?: string } | undefined>
}

export function CreateStimmeForm({ workshopId, onCreate }: CreateStimmeFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await onCreate(workshopId, formData)) ?? null
    },
    null
  )

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input
        type="text"
        name="name"
        placeholder="Name (optional)"
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex gap-2">
        <textarea
          name="text"
          placeholder="Zitat..."
          required
          rows={2}
          className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          disabled={isPending}
          className="self-end rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Hinzufügen...' : '+ Hinzufügen'}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
