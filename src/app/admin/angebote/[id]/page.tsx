import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CreateDurchfuehrungForm } from './create-durchfuehrung-form'
import { DurchfuehrungCard } from './durchfuehrung-card'

export default async function AngebotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: angebot } = await supabase
    .from('angebote')
    .select('*')
    .eq('id', id)
    .single()

  if (!angebot) {
    notFound()
  }

  const { data: durchfuehrungen } = await supabase
    .from('durchfuehrungen')
    .select('*, termine(*)')
    .eq('angebot_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href="/admin/angebote"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zu Angebote
      </a>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{angebot.title}</h1>
        <a
          href={`/admin/angebote/${id}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Bearbeiten
        </a>
      </div>
      {angebot.subtitle && (
        <p className="mb-6 -mt-4 text-sm text-zinc-500">{angebot.subtitle}</p>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Durchführungen</h2>
      </div>

      <div className="mb-4">
        <CreateDurchfuehrungForm angebotId={id} />
      </div>

      <div className="flex flex-col gap-3">
        {durchfuehrungen && durchfuehrungen.length > 0 ? (
          durchfuehrungen.map((df, i) => (
            <DurchfuehrungCard
              key={df.id}
              id={df.id}
              angebotId={id}
              index={i + 1}
              termine={(df.termine ?? []).sort(
                (a: { start_datetime: string }, b: { start_datetime: string }) =>
                  new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
              )}
            />
          ))
        ) : (
          <p className="text-sm text-zinc-500">
            Noch keine Durchführungen vorhanden.
          </p>
        )}
      </div>
    </div>
  )
}
