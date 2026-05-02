import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

const WEEKDAYS_DE = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'];
const CARD_LINK_CLASS =
  "group overflow-hidden rounded-lg border border-zinc-200 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800";
const CARD_MEDIA_CLASS =
  "absolute -inset-px transform-gpu bg-cover bg-center transition-transform duration-300 will-change-transform [backface-visibility:hidden] group-hover:scale-[1.02]";
const CARD_TITLE_STRIP_CLASS = "absolute bottom-0 left-0 right-0 border-b border-white/85 bg-white/85";

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
      min_teilnehmer,
      max_teilnehmer,
      created_at,
      durchfuehrungen (
        id,
        created_at,
        termine (
          id,
          start_datetime,
          end_datetime
        ),
        anmeldungen (
          id,
          status
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
    .select("id, title, subtitle")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(3);

  return (
    <div>
      {/* Hero */}
      <div className="mx-auto max-w-6xl px-4 pt-12">
        <div className="relative h-80 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800 sm:h-96">
          <div
            className="absolute inset-0 bg-no-repeat"
            style={{
              backgroundImage:
                "url('/placeholders/gemini-image-2_this_man_sitting_in_front_of_the_concrete_wall_no_other_objects_on_wall-3.jpg')",
              backgroundSize: "145% auto",
              backgroundPosition: "59% 10%",
            }}
          />
          <div className="absolute inset-0 bg-stone-900/60" />
          <div className="absolute inset-0 flex flex-col items-start justify-center p-8 sm:p-12 text-white">
            <p className="text-2xl leading-snug sm:text-3xl sm:leading-snug">
              zweitsprache.ch | Marcel Allenspach
            </p>
            <h1 className="mt-4 text-4xl font-bold sm:text-5xl">
              DaZ einfach machen
            </h1>
            <p className="mt-4 text-2xl leading-snug sm:text-3xl sm:leading-snug">
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
              const allDurchfuehrungen = (workshop.durchfuehrungen ?? []) as {
                id: string;
                termine: { start_datetime: string; end_datetime: string }[];
                anmeldungen: { id: string; status: string }[];
              }[];

              // Find the next Durchführung (the one with the earliest upcoming Termin)
              const now = new Date();
              const nextDf = allDurchfuehrungen
                .map((df) => {
                  const nextTerminInDf = (df.termine ?? [])
                    .filter((t) => new Date(t.start_datetime) >= now)
                    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0];
                  return { df, nextTerminInDf };
                })
                .filter((x) => x.nextTerminInDf != null)
                .sort((a, b) =>
                  new Date(a.nextTerminInDf!.start_datetime).getTime() -
                  new Date(b.nextTerminInDf!.start_datetime).getTime()
                )[0];

              const nextTermin = nextDf?.nextTerminInDf as { start_datetime: string; end_datetime: string } | undefined;
              const dfCount = allDurchfuehrungen.length;

              const nextDfActiveCount = nextDf
                ? (nextDf.df.anmeldungen ?? []).filter((a) => a.status !== 'cancelled').length
                : 0;

              const garantiert = nextDf != null &&
                workshop.min_teilnehmer != null &&
                nextDfActiveCount >= workshop.min_teilnehmer;

              const ausgebucht = nextDf != null &&
                workshop.max_teilnehmer != null &&
                nextDfActiveCount >= workshop.max_teilnehmer;

              return (
                <Link
                  key={workshop.id}
                  href={`/workshops/${workshop.id}`}
                  className={CARD_LINK_CLASS}
                >
                  <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={CARD_MEDIA_CLASS}
                      style={{
                        backgroundImage:
                          "url('/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg')",
                      }}
                    />
                    {ausgebucht ? (
                      <span className="absolute top-0 left-0 z-10 rounded-br-md px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#A65A3E' }}>
                        Ausgebucht
                      </span>
                    ) : garantiert ? (
                      <span className="absolute top-0 left-0 z-10 rounded-br-md px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#5A6B3E' }}>
                        Durchführung garantiert
                      </span>
                    ) : null}
                    <div className={CARD_TITLE_STRIP_CLASS}>
                      <h3 className="block px-4 py-1.5 text-lg font-bold text-stone-700">
                        {workshop.title}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4">
                    {workshop.subtitle && (
                      <p className="text-base text-stone-700">{workshop.subtitle}</p>
                    )}
                    {nextTermin ? (
                      <p className="text-base text-stone-700">
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
                    <span className="mt-3 block rounded-md bg-stone-700 px-4 py-2 text-center text-sm font-medium text-white">
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
                return (
                  <Link
                    key={course.id}
                    href={`/kurse/${course.id}`}
                    className={CARD_LINK_CLASS}
                  >
                    <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={CARD_MEDIA_CLASS}
                        style={{
                          backgroundImage:
                            "url('/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg')",
                        }}
                      />
                      <div className={CARD_TITLE_STRIP_CLASS}>
                        <h3 className="block px-4 py-1.5 text-lg font-semibold text-stone-700">
                          {course.title}
                        </h3>
                      </div>
                    </div>
                    <div className="p-4">
                      {course.subtitle && (
                        <p className="text-base text-stone-700">{course.subtitle}</p>
                      )}
                      <span className="mt-3 block rounded-md bg-stone-700 px-4 py-2 text-center text-sm font-medium text-white">
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

      <div className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="mb-6 text-2xl font-bold">Miteinander in der Schweiz</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-zinc-200 px-1 py-2 dark:border-zinc-800">
              <div
                className="aspect-[3/4] overflow-hidden bg-cover bg-center"
                style={{
                  backgroundImage:
                    index === 0
                      ? "url('/miteinander/miteinander-in-der-schweiz-a1-1.jpeg')"
                      : index === 1
                        ? "url('/miteinander/miteinander-in-der-schweiz-a1-2.jpg')"
                        : index === 2
                          ? "url('/miteinander/miteinander-in-der-schweiz-a2-1.jpeg')"
                          : index === 3
                            ? "url('/miteinander/miteinander-in-der-schweiz-a2-2.jpeg')"
                            : index === 4
                              ? "url('/miteinander/miteinander-in-der-schweiz-b1-1.jpeg')"
                              : "url('/miteinander/miteinander-in-der-schweiz-b1-2.jpeg')",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
