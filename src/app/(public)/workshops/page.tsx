import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import Image from "next/image";

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

function getNextQuarterLabel() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const targetQuarter = (quarter + 2) % 4;
  const yearOffset = quarter + 2 >= 4 ? 1 : 0;
  return `Q${targetQuarter + 1}/${now.getFullYear() + yearOffset}`;
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
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-black/10 p-6 sm:p-8">
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
          const hasUpcomingDf = upcoming.length > 0;

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
                {!hasUpcomingDf && (
                  <span className="absolute top-0 left-0 z-10 rounded-br-md px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#B8893A' }}>
                    als Inhouse-Workshop verfügbar
                  </span>
                )}
                <div className={CARD_TITLE_STRIP_CLASS}>
                  <h2 className="block px-4 py-1.5 text-lg font-bold" style={{ color: '#3E5A6B' }}>
                    {workshop.title}
                  </h2>
                </div>
              </div>
              <div className="p-4">
              {workshop.subtitle && (
                <p className="text-base" style={{color:"#3E5A6B"}}>{workshop.subtitle}</p>
              )}
              {nextTermin ? (
                <p className="text-base text-zinc-600 dark:text-zinc-400">
                  {formatDate(nextTermin.start_datetime)} |{" "}
                  {formatTime(nextTermin.start_datetime)} –{" "}
                  {formatTime(nextTermin.end_datetime)}
                </p>
              ) : (
                <p className="text-base text-zinc-400">voraussichtliche Durchführung {getNextQuarterLabel()}</p>
              )}
              <p className="mt-2 text-xs text-zinc-400">
                {dfCount} Durchführung{dfCount !== 1 ? "en" : ""}
              </p>
              <span className="mt-3 block rounded-md px-4 py-2 text-center text-sm font-medium text-white" style={{backgroundColor:'#3E5A6B'}}>
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
