import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export default async function CourseOverviewPage({
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
    module_lernziele: (mod.module_lernziele ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
    themen: (mod.themen ?? [])
      .sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      )
      .map((t: { id: string; title: string; sort_order: number; lessons: { id: string; title: string; sort_order: number }[] }) => ({
        ...t,
        lessons: (t.lessons ?? []).sort(
          (a: { sort_order: number }, b: { sort_order: number }) =>
            a.sort_order - b.sort_order
        ),
      })),
  }));

  // Count total lessons across all modules > themen
  const totalLessons = sortedModules.reduce(
    (sum, mod) =>
      sum +
      mod.themen.reduce(
        (tSum: number, t: { lessons: unknown[] }) => tSum + t.lessons.length,
        0
      ),
    0
  );

  // Find first lesson for "Kurs starten" button
  const firstLesson = (() => {
    for (const mod of sortedModules) {
      for (const thema of mod.themen) {
        if (thema.lessons.length > 0) {
          return {
            moduleId: mod.id,
            themaId: thema.id,
            lessonId: thema.lessons[0].id,
          };
        }
      }
    }
    return null;
  })();

  return (
    <div>
      {course.about && (
        <div className="mb-10">
          <h2 className="mb-3 text-xl font-semibold">Über diesen Kurs</h2>
          <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {course.about}
          </p>
        </div>
      )}

      <div className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Kursinhalt</h2>
        <p className="mb-6 text-sm text-zinc-500">
          {sortedModules.length} Modul{sortedModules.length !== 1 ? "e" : ""} ·{" "}
          {totalLessons} Lektionen
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedModules.map((mod, index) => (
            <Link
              key={mod.id}
              href={`/kurse/${courseId}/${mod.id}`}
              className="group flex flex-col rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {index + 1}
                  </div>
                  <h3 className="font-medium group-hover:underline">{mod.title}</h3>
                </div>
                {mod.description && (
                  <p className="mb-3 line-clamp-2 text-sm text-zinc-500">
                    {mod.description}
                  </p>
                )}
                <p className="mt-auto text-xs text-zinc-400">
                  {mod.themen.reduce((s: number, t: { lessons: unknown[] }) => s + t.lessons.length, 0)} Lektion
                  {mod.themen.reduce((s: number, t: { lessons: unknown[] }) => s + t.lessons.length, 0) !== 1 ? "en" : ""}
                </p>
              </div>

              {mod.module_lernziele.length > 0 && (
                <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                    Lernziele
                  </p>
                  <ul className="flex flex-col gap-1">
                    {mod.module_lernziele.map(
                      (lz: { id: string; text: string }) => (
                        <li
                          key={lz.id}
                          className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
                        >
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          {lz.text}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {firstLesson && (
        <Link
          href={`/kurse/${courseId}/${firstLesson.moduleId}/${firstLesson.themaId}/${firstLesson.lessonId}`}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <BookOpen className="h-4 w-4" />
          Kurs starten
        </Link>
      )}
    </div>
  );
}
