import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function KurseListPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: courses } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      subtitle,
      about,
      cover_image_url,
      modules (
        id,
        lessons (id)
      )
    `
    )
    .eq("published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="relative mb-10 h-48 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-56 md:h-64">
        <Image
          src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
          alt="Kurse"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-black/20 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Kurse</h1>
          <p className="mt-2 text-lg text-zinc-200">Unsere aktuellen Kurse</p>
        </div>
      </div>

      {(!courses || courses.length === 0) && (
        <p className="text-zinc-500">Noch keine Kurse verfügbar.</p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(courses ?? []).map((course) => {
          const moduleCount = (course.modules ?? []).length;
          const lessonCount = (course.modules ?? []).reduce(
            (sum: number, mod: { lessons: { id: string }[] }) =>
              sum + (mod.lessons ?? []).length,
            0
          );

          return (
            <Link
              key={course.id}
              href={`/kurse/${course.id}`}
              className="group overflow-hidden rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
                  alt={course.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h2 className="text-lg font-semibold text-white group-hover:underline">
                    {course.title}
                  </h2>
                  {course.subtitle && (
                    <p className="mt-0.5 text-sm text-zinc-200">{course.subtitle}</p>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {moduleCount} Modul{moduleCount !== 1 ? "e" : ""} · {lessonCount} Lektion
                  {lessonCount !== 1 ? "en" : ""}
                </p>
                <span className="mt-3 block rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-zinc-200">
                  Kurs ansehen
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
