import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { CreateModuleForm } from './create-module-form'
import { ModuleCard } from './module-card'

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (!course) {
    notFound()
  }

  const { data: modules } = await supabase
    .from('modules')
    .select('*, themen(id, lessons(id))')
    .eq('course_id', courseId)
    .order('sort_order', { ascending: true })

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <a
        href="/admin/kurse"
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zu Kurse
      </a>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <a
          href={`/admin/kurse/${courseId}/edit`}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Bearbeiten
        </a>
      </div>
      {course.subtitle && (
        <p className="mb-6 -mt-4 text-sm text-zinc-500">{course.subtitle}</p>
      )}

      {course.about && (
        <div className="mb-6 whitespace-pre-wrap rounded-md bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          {course.about}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Module</h2>
      </div>

      <div className="mb-4">
        <CreateModuleForm courseId={courseId} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modules && modules.length > 0 ? (
          modules.map((mod, i) => (
            <ModuleCard
              key={mod.id}
              id={mod.id}
              courseId={courseId}
              title={mod.title}
              description={mod.description}
              lessonCount={(mod.themen ?? []).reduce((sum: number, t: { lessons: { id: string }[] }) => sum + (t.lessons ?? []).length, 0)}
              index={i + 1}
            />
          ))
        ) : (
          <p className="text-sm text-zinc-500">
            Noch keine Module vorhanden.
          </p>
        )}
      </div>
    </div>
  )
}
