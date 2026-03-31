import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { EditModuleInline } from './edit-module-inline'
import { ModuleLernzielRow } from './module-lernziel-row'
import { CreateModuleLernzielForm } from './create-module-lernziel-form'
import { ThemaCard } from './thema-card'
import { CreateThemaForm } from './create-thema-form'

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>
}) {
  const { courseId, moduleId } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: course } = await supabase
    .from('courses')
    .select('id, title')
    .eq('id', courseId)
    .single()

  if (!course) {
    notFound()
  }

  const { data: mod } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single()

  if (!mod) {
    notFound()
  }

  const { data: lernziele } = await supabase
    .from('module_lernziele')
    .select('*')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true })

  const { data: themen } = await supabase
    .from('themen')
    .select('*, lessons(id)')
    .eq('module_id', moduleId)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href={`/admin/kurse/${courseId}`}
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zu {course.title}
      </a>
      <h1 className="mb-6 text-2xl font-bold">Modul: {mod.title}</h1>

      <div className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Details</h2>
        <EditModuleInline
          id={moduleId}
          courseId={courseId}
          title={mod.title}
          description={mod.description}
        />
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Lernziele</h2>
        <div className="mb-2 flex flex-col gap-2">
          {lernziele && lernziele.length > 0 ? (
            lernziele.map((lz) => (
              <ModuleLernzielRow
                key={lz.id}
                id={lz.id}
                courseId={courseId}
                text={lz.text}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Noch keine Lernziele vorhanden.</p>
          )}
        </div>
        <CreateModuleLernzielForm moduleId={moduleId} courseId={courseId} />
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Themen</h2>
        <div className="mb-2 flex flex-col gap-3">
          {themen && themen.length > 0 ? (
            themen.map((thema, i) => (
              <ThemaCard
                key={thema.id}
                id={thema.id}
                courseId={courseId}
                moduleId={moduleId}
                title={thema.title}
                description={thema.description}
                lessonCount={(thema.lessons ?? []).length}
                index={i + 1}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Noch keine Themen vorhanden.</p>
          )}
        </div>
        <CreateThemaForm moduleId={moduleId} courseId={courseId} />
      </div>
    </div>
  )
}
