import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PlateRenderer } from "@/components/plate/static-renderer";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default async function LessonPublicPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; lessonId: string }>;
}) {
  const { courseId, moduleId, lessonId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (!lesson) {
    notFound();
  }

  // Fetch all lessons in this module for prev/next navigation
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, sort_order, module_id")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  // Also fetch all modules for cross-module navigation
  const { data: mod } = await supabase
    .from("modules")
    .select("id, title, course_id")
    .eq("id", moduleId)
    .single();

  const { data: allModules } = await supabase
    .from("modules")
    .select(
      `
      id,
      title,
      sort_order,
      lessons (
        id,
        title,
        sort_order
      )
    `
    )
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  // Build flat ordered list of all lessons across all modules
  const flatLessons: { id: string; title: string; moduleId: string; moduleName: string }[] = [];
  for (const m of allModules ?? []) {
    const sorted = (m.lessons ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
    for (const l of sorted) {
      flatLessons.push({
        id: l.id,
        title: l.title,
        moduleId: m.id,
        moduleName: m.title,
      });
    }
  }

  const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

  const hasContent =
    lesson.data &&
    Array.isArray(lesson.data) &&
    lesson.data.length > 0;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">{lesson.title}</h2>

      {hasContent ? (
        <div className="max-w-none text-[18px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          <PlateRenderer value={lesson.data} />
        </div>
      ) : (
        <p className="text-zinc-500">
          Diese Lektion hat noch keinen Inhalt.
        </p>
      )}

      {/* Prev / Next navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {prevLesson ? (
          <Link
            href={`/kurse/${courseId}/${prevLesson.moduleId}/${prevLesson.id}`}
            className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="h-4 w-4" />
            <div className="text-right">
              <p className="text-xs text-zinc-400">Vorherige Lektion</p>
              <p className="font-medium">{prevLesson.title}</p>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <Link
            href={`/kurse/${courseId}/${nextLesson.moduleId}/${nextLesson.id}`}
            className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <div>
              <p className="text-xs text-zinc-400">Nächste Lektion</p>
              <p className="font-medium">{nextLesson.title}</p>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
