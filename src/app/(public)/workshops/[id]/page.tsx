import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Clock8, CreditCard, MapPin, User } from "lucide-react";

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

export default async function WorkshopPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: workshop } = await supabase
    .from("workshops")
    .select(
      `
      id,
      title,
      subtitle,
      about,
      max_teilnehmer,
      preis,
      created_at,
      lernziele (
        id,
        text,
        sort_order
      ),
      inhalte (
        id,
        text,
        sort_order
      ),
      voraussetzungen (
        id,
        text,
        sort_order
      ),
      workshop_stimmen (
        id,
        name,
        text,
        sort_order
      ),
      durchfuehrungen (
        id,
        created_at,
        ort,
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

  if (!workshop) {
    notFound();
  }

  const lernziele = (workshop.lernziele ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  const inhalte = (workshop.inhalte ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  const voraussetzungen = (workshop.voraussetzungen ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  const stimmen = (workshop.workshop_stimmen ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  const durchfuehrungen = (workshop.durchfuehrungen ?? []).map(
    (df: {
      id: string;
      created_at: string;
      ort: string | null;
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
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero */}
      <div className="relative h-48 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:h-56 md:h-64">
        <Image
          src="/placeholders/nano-banana-2_artistic_portrait_photography_of_A_cool-toned_artistic_portrait_photography_feat-3.jpg"
          alt={workshop.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 to-slate-900/20 p-6 sm:p-8">
            <Link
              href="/workshops"
              className="mb-4 inline-block text-sm text-zinc-300 hover:text-white"
            >
              ← Alle Workshops
            </Link>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {workshop.title}
            </h1>
            {workshop.subtitle && (
              <p className="mt-2 text-lg text-zinc-200">{workshop.subtitle}</p>
            )}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2">
      {workshop.about && (
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Über den Workshop</h2>
          <p className="whitespace-pre-wrap text-base text-zinc-700 dark:text-zinc-300">{workshop.about}</p>
        </div>
      )}
      {lernziele.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Lernziele</h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {lernziele.map((lz: { id: string; text: string }) => (
              <li key={lz.id} className="flex items-center gap-3 py-3 text-base text-zinc-700 dark:text-zinc-300">
                <ArrowRight className="h-4 w-4 shrink-0" />
                {lz.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {inhalte.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Inhalte</h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {inhalte.map((item: { id: string; text: string }) => (
              <li key={item.id} className="flex items-center gap-3 py-3 text-base text-zinc-700 dark:text-zinc-300">
                <ArrowRight className="h-4 w-4 shrink-0" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}
      {voraussetzungen.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Voraussetzungen</h2>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {voraussetzungen.map((item: { id: string; text: string }) => (
              <li key={item.id} className="flex items-center gap-3 py-3 text-base text-zinc-700 dark:text-zinc-300">
                <ArrowRight className="h-4 w-4 shrink-0" />
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      )}
        </div>

        {/* Right column (1/3) */}
        <div>
      <h2 className="mb-4 text-xl font-semibold">Nächste Termine</h2>
      {durchfuehrungen.length === 0 ? (
        <p className="text-zinc-500">
          Für diesen Workshop sind noch keine Durchführungen geplant.
        </p>
      ) : (
        <div className="mb-8 flex flex-col gap-6">
          {durchfuehrungen.map(
            (
              df: {
                id: string;
                ort: string | null;
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
                  {df.termine.length === 0 ? (
                    <p className="text-sm text-zinc-400">Keine Termine</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {upcoming.map((t) => (
                        <div key={t.id} className="flex flex-col gap-1">
                          <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                            <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                            <span className="font-bold">
                              {formatDate(t.start_datetime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                            <Clock8 className="h-4 w-4 shrink-0 text-zinc-400" />
                            <span className="text-zinc-500">
                              {formatTime(t.start_datetime)} – {formatTime(t.end_datetime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                            <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                            <span className="text-zinc-500">
                              {df.ort || '\u00A0'}
                            </span>
                          </div>
                          {workshop.max_teilnehmer && (
                          <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                            <User className="h-4 w-4 shrink-0 text-zinc-400" />
                            <span className="text-zinc-500">
                              Max. {workshop.max_teilnehmer} Teilnehmer
                            </span>
                          </div>
                          )}
                          {workshop.preis != null && (
                          <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                            <CreditCard className="h-4 w-4 shrink-0 text-zinc-400" />
                            <span className="text-zinc-500">
                              CHF {Number(workshop.preis).toFixed(2)}
                            </span>
                          </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3">
                    <Link
                      href={`/workshops/${id}/anmelden/${df.id}`}
                      className="inline-flex w-full items-center justify-center rounded-md px-5 py-2 text-sm font-medium text-white transition-colors" style={{backgroundColor:'#3E5A6B'}}
                    >
                      Anmelden
                    </Link>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <p className="mb-3 text-base text-zinc-700 dark:text-zinc-300">
          Dieser Workshop ist auch als Inhouse-Veranstaltung durchführbar.
        </p>
        <Link
          href={`/workshops/${id}/anmelden/${durchfuehrungen[0]?.id ?? ''}`}
          className="inline-flex w-full items-center justify-center rounded-md px-5 py-2 text-sm font-medium text-white transition-colors" style={{backgroundColor:'#3E5A6B'}}
        >
          Anfrage
        </Link>
      </div>

      <h2 className="mt-8 text-xl font-semibold">Teilnehmer:innen-Stimmen</h2>
      {stimmen.length > 0 ? (
        <div className="mt-4 flex flex-col gap-4">
          {stimmen.map((stimme: { id: string; name: string | null; text: string }) => (
            <div key={stimme.id} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="text-base text-zinc-700 dark:text-zinc-300">{stimme.text}</p>
              {stimme.name && (
                <p className="mt-2 text-sm font-medium text-zinc-500">— {stimme.name}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">Noch keine Stimmen vorhanden.</p>
      )}
        </div>
      </div>
    </div>
  );
}
