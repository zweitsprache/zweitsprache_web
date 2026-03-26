import Link from 'next/link'

export function AngebotRow({ id, title, subtitle }: { id: string; title: string; subtitle?: string | null }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <a
        href={`/admin/angebote/${id}`}
        className="flex-1 hover:underline"
      >
        <span className="text-sm font-medium">{title}</span>
        {subtitle && <span className="ml-2 text-xs text-zinc-500">{subtitle}</span>}
      </a>
      <a
        href={`/admin/angebote/${id}/edit`}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Bearbeiten
      </a>
    </div>
  )
}
