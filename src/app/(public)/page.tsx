import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

const WEEKDAYS_DE = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const weekday = WEEKDAYS_DE[date.getDay()];
  return `${weekday} ${date.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: workshops } = await supabase
    .from("workshops")
    .select(
      `
      id,
      title,
      subtitle,
      created_at,
      durchfuehrungen (
        id,
        created_at,
        termine (
          id,
          start_datetime,
          end_datetime
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  const sorted = (workshops ?? []).sort((a, b) => {
    const getFirstStart = (ws: typeof a) => {
      const starts = (ws.durchfuehrungen ?? [])
        .flatMap((df: { termine: { start_datetime: string }[] }) => df.termine ?? [])
        .map((t: { start_datetime: string }) => new Date(t.start_datetime).getTime())
        .filter((ts: number) => ts >= Date.now());
      return starts.length > 0 ? Math.min(...starts) : Infinity;
    };
    return getFirstStart(a) - getFirstStart(b);
  });

  const { data: courses } = await supabase
    .from("courses")
    .select(
      `
      id,
      title,
      subtitle,
      modules (
        id,
        lessons (id)
      )
    `
    )
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div>
      {/* Hero */}
      <div className="mx-auto max-w-6xl px-4 pt-12">
        <div className="relative h-80 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 sm:h-96">
          <Image
            src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
            alt="DaZ einfach machen"
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 flex flex-col items-start justify-center bg-slate-900/60 p-8 sm:p-12">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              DaZ einfach machen
            </h1>
            <p className="mt-4 text-2xl leading-snug text-zinc-200 sm:text-3xl sm:leading-snug">
              Beratung, Weiterbildung und Fachcoaching<br /> für Organisationen, Teams und Kursleitende
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Nächste Workshops */}
        <div className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Nächste Workshops</h2>
            <Link
              href="/workshops"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Alle Workshops →
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.slice(0, 3).map((workshop) => {
              const allTermine = (workshop.durchfuehrungen ?? [])
                .flatMap((df: { termine: { start_datetime: string; end_datetime: string }[] }) => df.termine ?? [])
                .sort(
                  (a: { start_datetime: string }, b: { start_datetime: string }) =>
                    new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
                );
              const upcoming = allTermine.filter(
                (t: { start_datetime: string }) => new Date(t.start_datetime) >= new Date()
              );
              const nextTermin = upcoming[0] as { start_datetime: string; end_datetime: string } | undefined;
              const dfCount = (workshop.durchfuehrungen ?? []).length;

              return (
                <Link
                  key={workshop.id}
                  href={`/workshops/${workshop.id}`}
                  className="group overflow-hidden rounded-lg border border-zinc-200 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
                      alt={workshop.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/60 to-transparent p-4">
                      <h3 className="text-lg font-semibold text-white group-hover:underline">
                        {workshop.title}
                      </h3>
                      {workshop.subtitle && (
                        <p className="mt-0.5 text-sm text-zinc-200">{workshop.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    {nextTermin ? (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(nextTermin.start_datetime)} |{" "}
                        {formatTime(nextTermin.start_datetime)} –{" "}
                        {formatTime(nextTermin.end_datetime)}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-400">Keine kommenden Termine</p>
                    )}
                    <p className="mt-2 text-xs text-zinc-400">
                      {dfCount} Durchführung{dfCount !== 1 ? "en" : ""}
                    </p>
                    <span className="mt-3 block rounded-md bg-teal-700 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-teal-800">
                      Details
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Neueste Online-Kurse */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Neueste Online-Kurse</h2>
            <Link
              href="/kurse"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Alle Kurse →
            </Link>
          </div>

          {(!courses || courses.length === 0) ? (
            <p className="text-zinc-500">Noch keine Kurse verfügbar.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
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
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/60 to-transparent p-4">
                        <h3 className="text-lg font-semibold text-white group-hover:underline">
                          {course.title}
                        </h3>
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
                      <span className="mt-3 block rounded-md bg-teal-700 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-teal-800">
                        Kurs ansehen
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
