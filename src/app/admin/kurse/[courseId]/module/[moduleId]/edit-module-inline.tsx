'use client'

import { useActionState } from 'react'
import { updateModule } from '../../../actions'

export function EditModuleInline({
  id,
  courseId,
  title,
  description,
}: {
  id: string
  courseId: string
  title: string
  description: string | null
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await updateModule(id, courseId, formData)) ?? null
    },
    null
  )

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Titel
        </label>
        <input
          id="title"
          type="text"
          name="title"
          defaultValue={title}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Beschreibung
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={description ?? ''}
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isPending ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  )
}
