import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CreateDurchfuehrungForm } from './create-durchfuehrung-form'
import { CreateRepeatableForm } from './create-repeatable-form'
import { CreateStimmeForm } from './create-stimme-form'
import { DurchfuehrungCard } from './durchfuehrung-card'
import { RepeatableRow } from './repeatable-row'
import { StimmeRow } from './stimme-row'
import {
  createLernziel, updateLernziel, deleteLernziel,
  createInhalt, updateInhalt, deleteInhalt,
  createVoraussetzung, updateVoraussetzung, deleteVoraussetzung,
  createStimme, updateStimme, deleteStimme,
} from '../actions'

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: workshop } = await supabase
    .from('workshops')
    .select('*')
    .eq('id', id)
    .single()

  if (!workshop) {
    notFound()
  }

  const { data: durchfuehrungen } = await supabase
    .from('durchfuehrungen')
    .select('*, termine(*)')
    .eq('workshop_id', id)
    .order('created_at', { ascending: true })

  const { data: lernziele } = await supabase
    .from('lernziele')
    .select('*')
    .eq('workshop_id', id)
    .order('sort_order', { ascending: true })

  const { data: inhalte } = await supabase
    .from('inhalte')
    .select('*')
    .eq('workshop_id', id)
    .order('sort_order', { ascending: true })

  const { data: voraussetzungen } = await supabase
    .from('voraussetzungen')
    .select('*')
    .eq('workshop_id', id)
    .order('sort_order', { ascending: true })

  const { data: stimmen } = await supabase
    .from('workshop_stimmen')
    .select('*')
    .eq('workshop_id', id)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href="/admin/workshops"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zu Workshops
      </a>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{workshop.title}</h1>
        <a
          href={`/admin/workshops/${id}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Bearbeiten
        </a>
      </div>
      {workshop.subtitle && (
        <p className="mb-6 -mt-4 text-sm text-zinc-500">{workshop.subtitle}</p>
      )}

      {workshop.about && (
        <div className="mb-6 rounded-md bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 whitespace-pre-wrap">
          {workshop.about}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Lernziele</h2>
        <div className="mb-2 flex flex-col gap-2">
          {lernziele && lernziele.length > 0 ? (
            lernziele.map((lz) => (
              <RepeatableRow
                key={lz.id}
                id={lz.id}
                workshopId={id}
                text={lz.text}
                onUpdate={updateLernziel}
                onDelete={deleteLernziel}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Noch keine Lernziele vorhanden.</p>
          )}
        </div>
        <CreateRepeatableForm workshopId={id} placeholder="Neues Lernziel..." onCreate={createLernziel} />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Inhalte</h2>
        <div className="mb-2 flex flex-col gap-2">
          {inhalte && inhalte.length > 0 ? (
            inhalte.map((item) => (
              <RepeatableRow
                key={item.id}
                id={item.id}
                workshopId={id}
                text={item.text}
                onUpdate={updateInhalt}
                onDelete={deleteInhalt}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Noch keine Inhalte vorhanden.</p>
          )}
        </div>
        <CreateRepeatableForm workshopId={id} placeholder="Neuer Inhalt..." onCreate={createInhalt} />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Voraussetzungen</h2>
        <div className="mb-2 flex flex-col gap-2">
          {voraussetzungen && voraussetzungen.length > 0 ? (
            voraussetzungen.map((item) => (
              <RepeatableRow
                key={item.id}
                id={item.id}
                workshopId={id}
                text={item.text}
                onUpdate={updateVoraussetzung}
                onDelete={deleteVoraussetzung}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Noch keine Voraussetzungen vorhanden.</p>
          )}
        </div>
        <CreateRepeatableForm workshopId={id} placeholder="Neue Voraussetzung..." onCreate={createVoraussetzung} />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Teilnehmer:innen-Stimmen</h2>
        <div className="mb-2 flex flex-col gap-2">
          {stimmen && stimmen.length > 0 ? (
            stimmen.map((stimme) => (
              <StimmeRow
                key={stimme.id}
                id={stimme.id}
                workshopId={id}
                name={stimme.name}
                text={stimme.text}
                onUpdate={updateStimme}
                onDelete={deleteStimme}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Noch keine Stimmen vorhanden.</p>
          )}
        </div>
        <CreateStimmeForm workshopId={id} onCreate={createStimme} />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Durchführungen</h2>
      </div>

      <div className="mb-4">
        <CreateDurchfuehrungForm workshopId={id} />
      </div>

      <div className="flex flex-col gap-3">
        {durchfuehrungen && durchfuehrungen.length > 0 ? (
          durchfuehrungen.map((df, i) => (
            <DurchfuehrungCard
              key={df.id}
              id={df.id}
              workshopId={id}
              index={i + 1}
              ort={df.ort ?? null}
              status={df.status ?? 'geplant'}
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
