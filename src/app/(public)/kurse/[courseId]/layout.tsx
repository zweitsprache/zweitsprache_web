import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FloatingCourseSidebar } from "./floating-course-sidebar";
import { LessonSidebar } from "./[moduleId]/[themaId]/[lessonId]/lesson-sidebar";
import Link from "next/link";
import Image from "next/image";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, subtitle")
    .eq("id", courseId)
    .eq("published", true)
    .single();

  if (!course) {
    notFound();
  }

  const { data: modules } = await supabase
    .from("modules")
    .select(
      `
      id,
      title,
      sort_order,
      themen (
        id,
        title,
        sort_order,
        lessons (
          id,
          title,
          sort_order
        )
      )
    `
    )
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  const sortedModules = (modules ?? []).map((mod) => ({
    ...mod,
    themen: (mod.themen ?? [])
      .sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      )
      .map((thema: { id: string; title: string; sort_order: number; lessons: { id: string; title: string; sort_order: number }[] }) => ({
        ...thema,
        lessons: (thema.lessons ?? []).sort(
          (a: { sort_order: number }, b: { sort_order: number }) =>
            a.sort_order - b.sort_order
        ),
      })),
  }));

  return (
    <div data-course-layout className="mx-auto max-w-4xl px-4 py-8">
      {/* Hero */}
      <div className="relative mb-8 h-36 w-full overflow-hidden rounded-[12px] bg-zinc-100 dark:bg-zinc-800 sm:h-40 md:h-48">
        <Image
          src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
          alt={course.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 to-slate-900/20 p-6 sm:p-8">
          <Link
            href="/kurse"
            className="mb-3 inline-block text-sm text-zinc-300 hover:text-white"
          >
            ← Alle Kurse
          </Link>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{course.title}</h1>
          {course.subtitle && (
            <p className="mt-1 text-base text-zinc-200">{course.subtitle}</p>
          )}
        </div>
      </div>

      <FloatingCourseSidebar
        courseId={courseId}
        courseTitle={course.title}
        modules={sortedModules}
      />

      <LessonSidebar />

      <div className="min-w-0">{children}</div>
    </div>
  );
}
