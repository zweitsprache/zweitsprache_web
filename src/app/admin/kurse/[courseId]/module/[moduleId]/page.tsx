import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { EditModuleInline } from './edit-module-inline'
import { ModuleLernzielRow } from './module-lernziel-row'
import { CreateModuleLernzielForm } from './create-module-lernziel-form'
import { LessonRow } from './lesson-row'
import { CreateLessonForm } from './create-lesson-form'

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

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order')
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
        <h2 className="mb-2 text-lg font-semibold">Lektionen</h2>
        <div className="mb-2 flex flex-col gap-2">
          {lessons && lessons.length > 0 ? (
            lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                id={lesson.id}
                courseId={courseId}
                moduleId={moduleId}
                title={lesson.title}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Noch keine Lektionen vorhanden.</p>
          )}
        </div>
        <CreateLessonForm moduleId={moduleId} courseId={courseId} />
      </div>
    </div>
  )
}
