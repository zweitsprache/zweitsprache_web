import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { CreateWorkshopForm } from './create-workshop-form'
import { WorkshopRow } from './workshop-row'

export default async function WorkshopsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: workshops } = await supabase
    .from('workshops')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Workshops</h1>
      <div className="mb-6">
        <CreateWorkshopForm />
      </div>
      <div className="flex flex-col gap-2">
        {workshops && workshops.length > 0 ? (
          workshops.map((workshop) => (
            <WorkshopRow key={workshop.id} id={workshop.id} title={workshop.title} subtitle={workshop.subtitle} />
          ))
        ) : (
          <p className="text-sm text-zinc-500">Noch keine Workshops vorhanden.</p>
        )}
      </div>
    </div>
  )
}
