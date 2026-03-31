import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { CreateCourseForm } from './create-course-form'
import { CourseRow } from './course-row'
import { ImportCourseDialog } from './import-course-dialog'

export default async function CoursesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Kurse</h1>
      <div className="mb-6 flex items-start gap-2">
        <div className="flex-1">
          <CreateCourseForm />
        </div>
        <ImportCourseDialog />
      </div>
      <div className="flex flex-col gap-2">
        {courses && courses.length > 0 ? (
          courses.map((course) => (
            <CourseRow key={course.id} id={course.id} title={course.title} subtitle={course.subtitle} />
          ))
        ) : (
          <p className="text-sm text-zinc-500">Noch keine Kurse vorhanden.</p>
        )}
      </div>
    </div>
  )
}
