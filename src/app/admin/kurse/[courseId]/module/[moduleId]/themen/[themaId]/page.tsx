import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { EditThemaInline } from './edit-thema-inline'
import { LessonRow } from './lesson-row'
import { CreateLessonForm } from './create-lesson-form'

export default async function ThemaDetailPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; themaId: string }>
}) {
  const { courseId, moduleId, themaId } = await params
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
    .select('id, title')
    .eq('id', moduleId)
    .single()

  if (!mod) {
    notFound()
  }

  const { data: thema } = await supabase
    .from('themen')
    .select('*')
    .eq('id', themaId)
    .single()

  if (!thema) {
    notFound()
  }

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, sort_order')
    .eq('thema_id', themaId)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <a
        href={`/admin/kurse/${courseId}/module/${moduleId}`}
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zu {mod.title}
      </a>
      <h1 className="mb-6 text-2xl font-bold">Thema: {thema.title}</h1>

      <div className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Details</h2>
        <EditThemaInline
          id={themaId}
          courseId={courseId}
          title={thema.title}
          description={thema.description}
        />
      </div>

      <div className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Lektionen</h2>
        <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lessons && lessons.length > 0 ? (
            lessons.map((lesson) => (
              <LessonRow
                key={lesson.id}
                id={lesson.id}
                courseId={courseId}
                moduleId={moduleId}
                themaId={themaId}
                title={lesson.title}
              />
            ))
          ) : (
            <p className="text-sm text-zinc-500">Noch keine Lektionen vorhanden.</p>
          )}
        </div>
        <CreateLessonForm themaId={themaId} courseId={courseId} />
      </div>
    </div>
  )
}
