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
      lessons (
        id,
        title,
        sort_order
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
    lessons: (mod.lessons ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    ),
  }));

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
          {sortedModules.reduce(
            (sum, mod) => sum + (mod.lessons ?? []).length,
            0
          )}{" "}
          Lektionen
        </p>

        <div className="flex flex-col gap-4">
          {sortedModules.map((mod, index) => (
            <div
              key={mod.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <Link
                href={`/kurse/${courseId}/${mod.id}`}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{mod.title}</h3>
                  {mod.description && (
                    <p className="mt-0.5 truncate text-sm text-zinc-500">
                      {mod.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-zinc-400">
                  {(mod.lessons ?? []).length} Lektion
                  {(mod.lessons ?? []).length !== 1 ? "en" : ""}
                </span>
              </Link>

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
            </div>
          ))}
        </div>
      </div>

      {sortedModules.length > 0 && sortedModules[0].lessons.length > 0 && (
        <Link
          href={`/kurse/${courseId}/${sortedModules[0].id}/${sortedModules[0].lessons[0].id}`}
          className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <BookOpen className="h-4 w-4" />
          Kurs starten
        </Link>
      )}
    </div>
  );
}
