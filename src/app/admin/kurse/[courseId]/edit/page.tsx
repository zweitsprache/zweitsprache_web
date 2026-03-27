import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { EditCourseForm } from "./edit-course-form";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href={`/admin/kurse/${courseId}`}
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück
      </a>
      <h1 className="mb-6 text-2xl font-bold">Kurs bearbeiten</h1>
      <EditCourseForm
        id={course.id}
        title={course.title}
        subtitle={course.subtitle}
        about={course.about}
        coverImageUrl={course.cover_image_url}
        published={course.published}
      />
    </div>
  );
}
