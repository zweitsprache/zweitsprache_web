import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { CourseBuilder } from "./course-builder"

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, subtitle, about, cover_image_url, published")
    .eq("id", courseId)
    .single()

  if (!course) {
    notFound()
  }

  const { data: modules } = await supabase
    .from("modules")
    .select(
      `
      id,
      title,
      description,
      sort_order,
      module_lernziele (
        id,
        text,
        sort_order
      ),
      themen (
        id,
        title,
        description,
        sort_order,
        lessons (
          id,
          title,
          sort_order,
          data
        )
      )
    `
    )
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true })

  // Sort nested items (Supabase doesn't guarantee nested order)
  const sortedModules = (modules ?? []).map((mod) => ({
    ...mod,
    module_lernziele: [...(mod.module_lernziele ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
    themen: [...(mod.themen ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((thema) => ({
        ...thema,
        lessons: [...(thema.lessons ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order
        ),
      })),
  }))

  return <CourseBuilder course={course} modules={sortedModules} />
}
