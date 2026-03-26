import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { CreateAngebotForm } from './create-angebot-form'
import { AngebotRow } from './angebot-row'

export default async function AngebotePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: angebote } = await supabase
    .from('angebote')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Angebote</h1>
      <div className="mb-6">
        <CreateAngebotForm />
      </div>
      <div className="flex flex-col gap-2">
        {angebote && angebote.length > 0 ? (
          angebote.map((angebot) => (
            <AngebotRow key={angebot.id} id={angebot.id} title={angebot.title} subtitle={angebot.subtitle} />
          ))
        ) : (
          <p className="text-sm text-zinc-500">Noch keine Angebote vorhanden.</p>
        )}
      </div>
    </div>
  )
}
