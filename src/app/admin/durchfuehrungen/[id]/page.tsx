import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { DurchfuehrungHub, type DurchfuehrungDetail } from "./hub";

export default async function DurchfuehrungPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch durchfuehrung
  const { data: df } = await supabase
    .from("durchfuehrungen")
    .select(
      `id, ort, status,
       termine(start_datetime, end_datetime),
       workshops(id, title, subtitle, preis)`
    )
    .eq("id", id)
    .single();

  if (!df) notFound();

  const workshop = df.workshops as {
    id: string;
    title: string;
    subtitle: string | null;
    preis: number | null;
  } | null;

  if (!workshop) notFound();

  // Fetch anmeldungen
  const { data: anmeldungen } = await supabase
    .from("anmeldungen")
    .select("id, anrede, vorname, name, email, status, created_at")
    .eq("durchfuehrung_id", id)
    .order("created_at", { ascending: true });

  // Fetch kommunikation_log for this durchfuehrung
  const { data: logs } = await supabase
    .from("kommunikation_log")
    .select("anmeldung_id, typ, gesendet_at")
    .eq("durchfuehrung_id", id)
    .order("gesendet_at", { ascending: false }); // latest first per type

  // Build a map: anmeldungId → { typ → most recent send }
  type LogEntry = { anmeldung_id: string; typ: string; gesendet_at: string };
  const logMap = new Map<
    string,
    {
      rechnung: { gesendet_at: string } | null;
      vorbereitungsaufgabe: { gesendet_at: string } | null;
      teilnahmebestaetigung: { gesendet_at: string } | null;
    }
  >();

  for (const log of (logs ?? []) as LogEntry[]) {
    if (!logMap.has(log.anmeldung_id)) {
      logMap.set(log.anmeldung_id, {
        rechnung: null,
        vorbereitungsaufgabe: null,
        teilnahmebestaetigung: null,
      });
    }
    const entry = logMap.get(log.anmeldung_id)!;
    // Only set if not already set (we sorted latest-first, so first hit = latest)
    if (
      log.typ === "rechnung" ||
      log.typ === "vorbereitungsaufgabe" ||
      log.typ === "teilnahmebestaetigung"
    ) {
      if (!entry[log.typ as "rechnung" | "vorbereitungsaufgabe" | "teilnahmebestaetigung"]) {
        entry[log.typ as "rechnung" | "vorbereitungsaufgabe" | "teilnahmebestaetigung"] = {
          gesendet_at: log.gesendet_at,
        };
      }
    }
  }

  const anmeldungenWithKomm = (anmeldungen ?? []).map((a) => ({
    ...a,
    kommunikation: logMap.get(a.id) ?? {
      rechnung: null,
      vorbereitungsaufgabe: null,
      teilnahmebestaetigung: null,
    },
  }));

  const data: DurchfuehrungDetail = {
    id: df.id,
    ort: df.ort ?? null,
    status: df.status,
    workshop,
    termine: (df.termine as { start_datetime: string; end_datetime: string }[]) ?? [],
    anmeldungen: anmeldungenWithKomm,
  };

  return <DurchfuehrungHub data={data} />;
}
