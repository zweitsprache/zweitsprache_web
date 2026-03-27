import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { CreatePageForm } from './create-page-form'
import { PageRow } from './page-row'

export default async function SeitenPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: pages } = await supabase
    .from('pages')
    .select('slug, title, published, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Seiten</h1>
      <div className="mb-6">
        <CreatePageForm />
      </div>
      <div className="flex flex-col gap-2">
        {pages && pages.length > 0 ? (
          pages.map((page) => (
            <PageRow
              key={page.slug}
              slug={page.slug}
              title={page.title}
              published={page.published}
            />
          ))
        ) : (
          <p className="text-sm text-zinc-500">Noch keine Seiten vorhanden.</p>
        )}
      </div>
    </div>
  )
}
