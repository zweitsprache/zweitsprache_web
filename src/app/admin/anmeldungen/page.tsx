import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Ausstehend',
  confirmed: 'Bestätigt',
  cancelled: 'Abgesagt',
  waitlist: 'Warteliste',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  waitlist: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${WEEKDAYS[d.getDay()]}, ${d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
}

export default async function AnmeldungenPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: anmeldungen } = await supabase
    .from('anmeldungen')
    .select(`
      id, anrede, vorname, name, email, mobiltelefon, status, created_at,
      workshop_id, durchfuehrung_id,
      workshops ( id, title, subtitle ),
      durchfuehrungen ( id, ort, termine ( start_datetime, end_datetime ) )
    `)
    .order('created_at', { ascending: false })

  // Group by workshop → durchfuehrung
  const grouped = new Map<
    string,
    {
      workshop: { id: string; title: string; subtitle: string | null }
      durchfuehrungen: Map<
        string,
        {
          ort: string | null
          firstTermin: string | null
          anmeldungen: typeof anmeldungen
        }
      >
    }
  >()

  for (const a of anmeldungen ?? []) {
    const ws = a.workshops as { id: string; title: string; subtitle: string | null } | null
    const df = a.durchfuehrungen as {
      id: string
      ort: string | null
      termine: { start_datetime: string; end_datetime: string }[]
    } | null
    if (!ws || !df) continue

    if (!grouped.has(ws.id)) {
      grouped.set(ws.id, { workshop: ws, durchfuehrungen: new Map() })
    }
    const wsGroup = grouped.get(ws.id)!

    if (!wsGroup.durchfuehrungen.has(df.id)) {
      const termine = [...(df.termine ?? [])].sort(
        (x, y) => new Date(x.start_datetime).getTime() - new Date(y.start_datetime).getTime()
      )
      wsGroup.durchfuehrungen.set(df.id, {
        ort: df.ort,
        firstTermin: termine[0]?.start_datetime ?? null,
        anmeldungen: [],
      })
    }
    wsGroup.durchfuehrungen.get(df.id)!.anmeldungen!.push(a)
  }

  const totalCount = anmeldungen?.length ?? 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Anmeldungen</h1>
          <p className="mt-1 text-sm text-zinc-500">{totalCount} Anmeldung{totalCount !== 1 ? 'en' : ''} total</p>
        </div>
      </div>

      {grouped.size === 0 ? (
        <p className="text-sm text-zinc-500">Noch keine Anmeldungen vorhanden.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {[...grouped.values()].map(({ workshop, durchfuehrungen }) => (
            <div key={workshop.id}>
              <div className="mb-3 border-b border-zinc-200 pb-2 dark:border-zinc-800">
                <h2 className="text-lg font-semibold">{workshop.title}</h2>
                {workshop.subtitle && (
                  <p className="text-sm text-zinc-500">{workshop.subtitle}</p>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {[...durchfuehrungen.entries()].map(([dfId, df]) => (
                  <div key={dfId}>
                    <div className="mb-2 flex items-center gap-3">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {df.firstTermin ? formatDate(df.firstTermin) : 'Termin unbekannt'}
                        {df.ort ? ` · ${df.ort}` : ''}
                      </span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {df.anmeldungen!.length} TN
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-50 dark:bg-zinc-900">
                          <tr>
                            <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Name</th>
                            <th className="px-4 py-2.5 text-left font-medium text-zinc-500">E-Mail</th>
                            <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Status</th>
                            <th className="px-4 py-2.5 text-left font-medium text-zinc-500">Eingegangen</th>
                            <th className="px-4 py-2.5"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {df.anmeldungen!.map((a) => (
                            <tr key={a.id} className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900">
                              <td className="px-4 py-3 font-medium">
                                {a.anrede} {a.vorname} {a.name}
                              </td>
                              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                                <a href={`mailto:${a.email}`} className="hover:underline">
                                  {a.email}
                                </a>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status ?? 'pending']}`}>
                                  {STATUS_LABELS[a.status ?? 'pending']}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-zinc-500">
                                {new Date(a.created_at).toLocaleDateString('de-CH', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Link
                                  href={`/admin/anmeldungen/${a.id}`}
                                  className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                  Details →
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
