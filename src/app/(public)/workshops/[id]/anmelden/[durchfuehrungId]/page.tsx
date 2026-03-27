import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { AnmeldeForm } from "./anmelde-form";

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
    .select("id, title, subtitle")
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href={`/workshops/${id}`}
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zum Workshop
      </Link>

      <h1 className="mb-1 text-3xl font-bold">Anmeldung</h1>
      <p className="mb-8 text-lg text-zinc-500">{workshop.title}</p>

      {termine.length > 0 && (
        <div className="mb-10 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Termine
          </p>
          <div className="flex flex-col gap-1">
            {termine.map((t) => {
              const start = new Date(t.start_datetime);
              const end = new Date(t.end_datetime);
              const weekdays = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];
              return (
                <p key={t.id} className="text-sm">
                  <span className="font-medium">
                    {weekdays[start.getDay()]}{" "}
                    {start.toLocaleDateString("de-CH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-zinc-500">
                    {" "}
                    |{" "}
                    {start.toLocaleTimeString("de-CH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {end.toLocaleTimeString("de-CH", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </p>
              );
            })}
          </div>
        </div>
      )}

      <AnmeldeForm workshopId={id} durchfuehrungId={durchfuehrungId} />
    </div>
  );
}
