'use client'

import { useActionState } from 'react'
import { togglePublish } from './actions'

export function PageRow({
  slug,
  title,
  published,
}: {
  slug: string
  title: string
  published: boolean
}) {
  const [state, action, isPending] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await togglePublish(slug)) ?? null
    },
    null
  )

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-1 items-center gap-3">
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            published ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'
          }`}
          title={published ? 'Veröffentlicht' : 'Entwurf'}
        />
        <a href={`/admin/seiten/${slug}/edit`} className="flex-1 hover:underline">
          <span className="text-sm font-medium">{title}</span>
          <span className="ml-2 text-xs text-zinc-500">/{slug}</span>
        </a>
      </div>
      <div className="flex items-center gap-2">
        <form action={action}>
          <button
            type="submit"
            disabled={isPending}
            className={`rounded-md border px-3 py-1.5 text-xs disabled:opacity-50 ${
              published
                ? 'border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950'
                : 'border-green-300 text-green-600 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950'
            }`}
          >
            {published ? 'Zurückziehen' : 'Veröffentlichen'}
          </button>
        </form>
        <a
          href={`/admin/seiten/${slug}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Bearbeiten
        </a>
      </div>
      {state?.error && <p className="mt-1 text-xs text-red-600">{state.error}</p>}
    </div>
  )
}
