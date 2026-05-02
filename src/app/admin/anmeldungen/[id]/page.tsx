import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { updateAnmeldungStatus, deleteAnmeldung } from '../actions'
import { AnmeldungKommunikation } from './kommunikation'

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

function formatTermin(t: { start_datetime: string; end_datetime: string }) {
  const start = new Date(t.start_datetime)
  const end = new Date(t.end_datetime)
  const date = `${WEEKDAYS[start.getDay()]}, ${start.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
  const startTime = start.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
  const endTime = end.toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${startTime}–${endTime} Uhr`
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">{value}</dd>
    </div>
  )
}

export default async function AnmeldungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: a } = await supabase
    .from('anmeldungen')
    .select(`
      *,
      workshops ( id, title, subtitle, preis ),
      durchfuehrungen ( id, ort, termine ( start_datetime, end_datetime ) )
    `)
    .eq('id', id)
    .single()

  if (!a) notFound()

  const { data: kommLogs } = await supabase
    .from('kommunikation_log')
    .select('id, typ, betreff, gesendet_at')
    .eq('anmeldung_id', id)
    .order('gesendet_at', { ascending: false })

  const workshop = a.workshops as { id: string; title: string; subtitle: string | null; preis: number | null } | null
  const durchfuehrung = a.durchfuehrungen as { id: string; ort: string | null; termine: { start_datetime: string; end_datetime: string }[] } | null
  const termine = [...(durchfuehrung?.termine ?? [])].sort(
    (x, y) => new Date(x.start_datetime).getTime() - new Date(y.start_datetime).getTime()
  )

  async function handleStatusChange(formData: FormData) {
    'use server'
    const status = formData.get('status') as string
    await updateAnmeldungStatus(id, status)
  }

  async function handleDelete() {
    'use server'
    await deleteAnmeldung(id)
    redirect('/admin/anmeldungen')
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/anmeldungen"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zu Anmeldungen
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {a.anrede} {a.vorname} {a.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Eingegangen am{' '}
            {new Date(a.created_at).toLocaleDateString('de-CH', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })} Uhr
          </p>
        </div>
        <span className={`mt-1 inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[a.status ?? 'pending']}`}>
          {STATUS_LABELS[a.status ?? 'pending']}
        </span>
      </div>

      {/* Workshop */}
      <section className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Kurs</h2>
        <p className="font-semibold">{workshop?.title}</p>
        {workshop?.subtitle && <p className="mt-0.5 text-sm text-zinc-500">{workshop.subtitle}</p>}
        {durchfuehrung?.ort && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">📍 {durchfuehrung.ort}</p>
        )}
        {termine.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {termine.map((t, i) => (
              <li key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
                • {formatTermin(t)}
              </li>
            ))}
          </ul>
        )}
        {workshop?.preis != null && (
          <p className="mt-2 text-sm font-medium">CHF {workshop.preis.toFixed(2)}</p>
        )}
      </section>

      {/* Personal data */}
      <section className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Persönliche Angaben</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Anrede" value={a.anrede} />
          <Field label="Vorname" value={a.vorname} />
          <Field label="Name" value={a.name} />
          <Field label="E-Mail" value={a.email} />
          <Field label="Mobiltelefon" value={a.mobiltelefon} />
          <Field label="Strasse" value={a.strasse} />
          <Field label="PLZ / Ort" value={a.plz_ort} />
        </dl>
      </section>

      {/* Billing */}
      <section className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Rechnungsadresse</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Typ" value={a.rechnungsadresse_typ} />
          <Field label="Firma" value={a.firma} />
          <Field label="Abteilung" value={a.abteilung} />
          <Field label="Strasse" value={a.rechnung_strasse} />
          <Field label="PLZ / Ort" value={a.rechnung_plz_ort} />
          <Field label="Rechnungs-E-Mail" value={a.rechnung_email} />
        </dl>
      </section>

      {/* Remarks */}
      {a.bemerkungen && (
        <section className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Bemerkungen</h2>
          <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{a.bemerkungen}</p>
        </section>
      )}

      {/* Kommunikation */}
      <AnmeldungKommunikation
        anmeldungId={id}
        initialLogs={kommLogs ?? []}
      />

      {/* Status change */}
      <section className="mb-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">Status ändern</h2>
        <form action={handleStatusChange} className="flex flex-wrap gap-2">
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <button
              key={value}
              name="status"
              value={value}
              type="submit"
              className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                a.status === value
                  ? 'border-transparent bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
        </form>
      </section>

      {/* Delete */}
      <section className="rounded-lg border border-red-200 p-4 dark:border-red-900/50">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-400">Anmeldung löschen</h2>
        <p className="mb-3 text-sm text-zinc-500">Diese Aktion kann nicht rückgängig gemacht werden.</p>
        <form action={handleDelete}>
          <button
            type="submit"
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Anmeldung löschen
          </button>
        </form>
      </section>
    </div>
  )
}
