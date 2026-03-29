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

export default async function WorkshopsPage() {
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="relative h-48 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-56 md:h-64">
        <Image
          src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
          alt="Workshops"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-black/20 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Workshops
          </h1>
          <p className="mt-2 text-lg text-zinc-200">
            Unsere aktuellen Kurse und Weiterbildungen
          </p>
        </div>
      </div>

      {/* Workshop Grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((workshop) => {
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
                  className="object-cover"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h2 className="text-lg font-semibold text-white group-hover:underline">
                    {workshop.title}
                  </h2>
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
  );
}
