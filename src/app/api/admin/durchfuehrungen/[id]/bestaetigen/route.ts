import { createClient } from "@/utils/supabase/server";
import { generateRechnungPdf } from "@/lib/pdf/rechnung";
import { RechnungEmail } from "@/emails/rechnung";
import { render } from "@react-email/render";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: durchfuehrungId } = await params;
  const supabase = createClient(await cookies());

  // Fetch durchfuehrung + workshop + anmeldungen
  const { data: durchfuehrung, error: dfErr } = await supabase
    .from("durchfuehrungen")
    .select(
      "id, ort, status, workshop_id, termine(start_datetime, end_datetime), workshops(id, title, subtitle, preis)"
    )
    .eq("id", durchfuehrungId)
    .single();

  if (dfErr || !durchfuehrung) {
    return NextResponse.json({ error: "Durchführung nicht gefunden." }, { status: 404 });
  }

  // Update status to bestätigt
  const { error: updateErr } = await supabase
    .from("durchfuehrungen")
    .update({ status: "bestätigt" })
    .eq("id", durchfuehrungId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const workshop = durchfuehrung.workshops as {
    id: string;
    title: string;
    subtitle: string | null;
    preis: number | null;
  } | null;

  const termine = (
    (durchfuehrung.termine as { start_datetime: string; end_datetime: string }[]) ?? []
  ).sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  // Fetch all anmeldungen for this durchfuehrung
  const { data: anmeldungen, error: anmErr } = await supabase
    .from("anmeldungen")
    .select(
      "id, anrede, vorname, name, email, strasse, plz_ort, rechnungsadresse_typ, firma, abteilung, rechnung_strasse, rechnung_plz_ort"
    )
    .eq("durchfuehrung_id", durchfuehrungId);

  if (anmErr) {
    return NextResponse.json({ error: anmErr.message }, { status: 500 });
  }

  if (!anmeldungen || anmeldungen.length === 0) {
    return NextResponse.json({ sent: 0, errors: [] });
  }

  const from = process.env.EMAIL_FROM ?? "noreply@zweitsprache.ch";
  const preis = workshop?.preis ?? 0;
  const today = new Date().toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const sent: string[] = [];
  const errors: string[] = [];

  for (const a of anmeldungen) {
    const rechnungsNr = `RG-${a.id.slice(0, 8).toUpperCase()}`;

    try {
      const [pdfBuffer, emailHtml] = await Promise.all([
        Promise.resolve(
          generateRechnungPdf({
            rechnungsNr,
            datum: today,
            anrede: a.anrede,
            vorname: a.vorname,
            name: a.name,
            strasse: a.strasse,
            plz_ort: a.plz_ort,
            firma: a.firma ?? null,
            abteilung: a.abteilung ?? null,
            rechnung_strasse: a.rechnung_strasse ?? null,
            rechnung_plz_ort: a.rechnung_plz_ort ?? null,
            rechnungsadresse_typ: a.rechnungsadresse_typ ?? "privat",
            workshopTitle: workshop?.title ?? "",
            workshopSubtitle: workshop?.subtitle ?? null,
            ort: durchfuehrung.ort ?? null,
            termine,
            preis,
          })
        ),
        render(
          RechnungEmail({
            anrede: a.anrede,
            vorname: a.vorname,
            name: a.name,
            workshopTitle: workshop?.title ?? "",
            workshopSubtitle: workshop?.subtitle ?? null,
            ort: durchfuehrung.ort ?? null,
            termine,
            preis,
            rechnungsNr,
            datum: today,
          })
        ),
      ]);

      const result = await resend.emails.send({
        from,
        to: a.email,
        subject: `Rechnung ${rechnungsNr} – ${workshop?.title ?? "Kurs"}`,
        html: emailHtml,
        attachments: [
          {
            filename: `Rechnung_${rechnungsNr}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      });

      if (result.error) {
        errors.push(`${a.email}: ${result.error.message}`);
        continue;
      }

      // Log the send
      await supabase.from("kommunikation_log").insert({
        anmeldung_id: a.id,
        durchfuehrung_id: durchfuehrungId,
        typ: "rechnung",
        email: a.email,
        betreff: `Rechnung ${rechnungsNr} – ${workshop?.title ?? "Kurs"}`,
      });

      sent.push(a.email);
    } catch (err) {
      errors.push(
        `${a.email}: ${err instanceof Error ? err.message : "Unbekannter Fehler"}`
      );
    }
  }

  return NextResponse.json({ sent: sent.length, errors });
}
