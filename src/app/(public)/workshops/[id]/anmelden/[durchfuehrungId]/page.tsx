import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Calendar, Clock8, CreditCard, MapPin, User } from "lucide-react";
import { AnmeldeForm } from "./anmelde-form";

const WEEKDAYS = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${WEEKDAYS[d.getDay()]} ${d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

export default async function AnmeldePage({
  params,
}: {
  params: Promise<{ id: string; durchfuehrungId: string }>;
}) {
  const { id, durchfuehrungId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: workshop } = await supabase
    .from("workshops")
    .select(`
      id, title, subtitle, max_teilnehmer, preis,
      durchfuehrungen (
        id, ort,
        termine ( id, start_datetime, end_datetime )
      )
    `)
    .eq("id", id)
    .single();

  if (!workshop) {
    notFound();
  }

  const { data: durchfuehrung } = await supabase
    .from("durchfuehrungen")
    .select("id, termine(id, start_datetime, end_datetime)")
    .eq("id", durchfuehrungId)
    .eq("workshop_id", id)
    .single();

  if (!durchfuehrung) {
    notFound();
  }

  const termine = (
    (durchfuehrung.termine as { id: string; start_datetime: string; end_datetime: string }[]) ?? []
  ).sort(
    (a, b) =>
      new Date(a.start_datetime).getTime() -
      new Date(b.start_datetime).getTime()
  );

  const weekdays = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
  const termineSubtitle = termine
    .map((t) => {
      const start = new Date(t.start_datetime);
      const end = new Date(t.end_datetime);
      return `${weekdays[start.getDay()]} ${start.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })} | ${start.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })} – ${end.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}`;
    })
    .join("  ·  ");

  type Durchfuehrung = { id: string; ort: string | null; termine: { id: string; start_datetime: string; end_datetime: string }[] };
  const andereDurchfuehrungen: Durchfuehrung[] = ((workshop.durchfuehrungen ?? []) as Durchfuehrung[])
    .filter((df) => df.id !== durchfuehrungId)
    .map((df) => ({
      ...df,
      termine: (df.termine ?? []).sort(
        (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      ),
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href={`/workshops/${id}`}
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zum Workshop
      </Link>

      <div className="relative h-48 w-full overflow-hidden rounded-lg bg-slate-700 sm:h-56 md:h-64">
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-slate-900/80 to-slate-900/20 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{workshop.title}</h1>
          {termineSubtitle && (
            <p className="mt-2 text-lg text-zinc-200">{termineSubtitle}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 py-12 lg:grid-cols-3">
        {/* Form — 2/3 */}
        <div className="lg:col-span-2">
          <AnmeldeForm workshopId={id} durchfuehrungId={durchfuehrungId} />
        </div>

        {/* Sidebar — 1/3 */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Weitere Termine</h2>
          {andereDurchfuehrungen.length === 0 ? (
            <p className="text-sm text-zinc-500">Keine weiteren Termine verfügbar.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {andereDurchfuehrungen.map((df) => {
                const upcoming = df.termine.filter(
                  (t) => new Date(t.start_datetime) >= new Date()
                );
                return (
                  <div key={df.id} className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
                    {df.termine.length === 0 ? (
                      <p className="text-sm text-zinc-400">Keine Termine</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {upcoming.map((t) => (
                          <div key={t.id} className="flex flex-col gap-1">
                            <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                              <Calendar className="h-4 w-4 shrink-0 text-zinc-400" />
                              <span className="font-bold">{formatDate(t.start_datetime)}</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                              <Clock8 className="h-4 w-4 shrink-0 text-zinc-400" />
                              <span className="text-zinc-500">{formatTime(t.start_datetime)} – {formatTime(t.end_datetime)}</span>
                            </div>
                            <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                              <MapPin className="h-4 w-4 shrink-0 text-zinc-400" />
                              <span className="text-zinc-500">{df.ort || '\u00A0'}</span>
                            </div>
                            {workshop.max_teilnehmer && (
                              <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                                <User className="h-4 w-4 shrink-0 text-zinc-400" />
                                <span className="text-zinc-500">Max. {workshop.max_teilnehmer} Teilnehmer</span>
                              </div>
                            )}
                            {workshop.preis != null && (
                              <div className="flex items-center gap-3 rounded-md bg-zinc-50 px-3 py-2 text-base dark:bg-zinc-900">
                                <CreditCard className="h-4 w-4 shrink-0 text-zinc-400" />
                                <span className="text-zinc-500">CHF {Number(workshop.preis).toFixed(2)}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-3">
                      <Link
                        href={`/workshops/${id}/anmelden/${df.id}`}
                        className="inline-flex w-full items-center justify-center rounded-md bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        Anmelden
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
