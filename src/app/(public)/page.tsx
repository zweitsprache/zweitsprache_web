import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { User } from "lucide-react";

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

  const { data: angebote } = await supabase
    .from("angebote")
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

  const sorted = (angebote ?? []).sort((a, b) => {
    const getFirstStart = (ang: typeof a) => {
      const starts = (ang.durchfuehrungen ?? [])
        .flatMap((df: { termine: { start_datetime: string }[] }) => df.termine ?? [])
        .map((t: { start_datetime: string }) => new Date(t.start_datetime).getTime())
        .filter((ts: number) => ts >= Date.now());
      return starts.length > 0 ? Math.min(...starts) : Infinity;
    };
    return getFirstStart(a) - getFirstStart(b);
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-2 text-3xl font-bold">Angebote</h1>
      <p className="mb-8 text-zinc-500">Unsere aktuellen Kurse und Weiterbildungen</p>

      <div className="grid gap-6 sm:grid-cols-2">
        {sorted.map((angebot) => {
          const allTermine = (angebot.durchfuehrungen ?? [])
            .flatMap((df: { termine: { start_datetime: string; end_datetime: string }[] }) => df.termine ?? [])
            .sort(
              (a: { start_datetime: string }, b: { start_datetime: string }) =>
                new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
            );
          const upcoming = allTermine.filter(
            (t: { start_datetime: string }) => new Date(t.start_datetime) >= new Date()
          );
          const nextTermin = upcoming[0] as { start_datetime: string; end_datetime: string } | undefined;
          const dfCount = (angebot.durchfuehrungen ?? []).length;

          return (
            <Link
              key={angebot.id}
              href={`/angebote/${angebot.id}`}
              className="group rounded-lg border border-zinc-200 p-5 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="mb-1 text-lg font-semibold group-hover:underline">
                    {angebot.title}
                  </h2>
                  {angebot.subtitle && (
                    <p className="mb-2 text-sm text-zinc-500">{angebot.subtitle}</p>
                  )}
                </div>
                <div className="flex gap-px pt-0.5">
                  <User className="h-4 w-4 fill-zinc-300 text-zinc-300 dark:fill-zinc-600 dark:text-zinc-600" />
                  <User className="h-4 w-4 fill-zinc-300 text-zinc-300 dark:fill-zinc-600 dark:text-zinc-600" />
                  <User className="h-4 w-4 fill-zinc-300 text-zinc-300 dark:fill-zinc-600 dark:text-zinc-600" />
                </div>
              </div>
              <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
                <svg className="h-10 w-10 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
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
              <span className="mt-3 block rounded-md bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white group-hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:group-hover:bg-zinc-200">
                Details
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
