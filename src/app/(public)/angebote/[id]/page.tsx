import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

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

export default async function AngebotPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: angebot } = await supabase
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
    .eq("id", id)
    .single();

  if (!angebot) {
    notFound();
  }

  const durchfuehrungen = (angebot.durchfuehrungen ?? []).map(
    (df: {
      id: string;
      created_at: string;
      termine: { id: string; start_datetime: string; end_datetime: string }[];
    }) => ({
      ...df,
      termine: (df.termine ?? []).sort(
        (a, b) =>
          new Date(a.start_datetime).getTime() -
          new Date(b.start_datetime).getTime()
      ),
    })
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Alle Angebote
      </Link>

      <h1 className="mb-2 text-3xl font-bold">{angebot.title}</h1>
      {angebot.subtitle && (
        <p className="mb-8 text-lg text-zinc-500">{angebot.subtitle}</p>
      )}
      {!angebot.subtitle && <div className="mb-8" />}

      {durchfuehrungen.length === 0 ? (
        <p className="text-zinc-500">
          Für dieses Angebot sind noch keine Durchführungen geplant.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {durchfuehrungen.map(
            (
              df: {
                id: string;
                termine: {
                  id: string;
                  start_datetime: string;
                  end_datetime: string;
                }[];
              },
              i: number
            ) => {
              const upcoming = df.termine.filter(
                (t) => new Date(t.start_datetime) >= new Date()
              );
              const past = df.termine.filter(
                (t) => new Date(t.start_datetime) < new Date()
              );

              return (
                <div
                  key={df.id}
                  className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
                >
                  <h2 className="mb-3 text-lg font-semibold">
                    Durchführung {i + 1}
                  </h2>

                  {df.termine.length === 0 ? (
                    <p className="text-sm text-zinc-400">Keine Termine</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {upcoming.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-900"
                        >
                          <span className="font-medium">
                            {formatDate(t.start_datetime)}
                          </span>
                          <span className="text-zinc-500">
                            | {formatTime(t.start_datetime)} –{" "}
                            {formatTime(t.end_datetime)}
                          </span>
                        </div>
                      ))}
                      {past.length > 0 && (
                        <p className="mt-1 text-xs text-zinc-400">
                          + {past.length} vergangene{" "}
                          {past.length === 1 ? "Termin" : "Termine"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
