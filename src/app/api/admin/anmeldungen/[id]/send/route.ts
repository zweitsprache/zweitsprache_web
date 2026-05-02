import { createClient } from "@/utils/supabase/server";
import { generateRechnungPdf } from "@/lib/pdf/rechnung";
import { generateTeilnahmebestaetigungPdf } from "@/lib/pdf/teilnahmebestaetigung";
import { RechnungEmail } from "@/emails/rechnung";
import { VorbereitungsaufgabeEmail } from "@/emails/vorbereitungsaufgabe";
import { TeilnahmebestaetigungEmail } from "@/emails/teilnahmebestaetigung";
import { render } from "@react-email/render";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: anmeldungId } = await params;
  const body = await req.json();
  const { typ, subject, message } = body as {
    typ: "rechnung" | "vorbereitungsaufgabe" | "teilnahmebestaetigung";
    subject?: string;
    message?: string;
  };

  const validTypes = ["rechnung", "vorbereitungsaufgabe", "teilnahmebestaetigung"];
  if (!validTypes.includes(typ)) {
    return NextResponse.json({ error: "Ungültiger Typ." }, { status: 400 });
  }

  if (typ === "vorbereitungsaufgabe" && (!subject?.trim() || !message?.trim())) {
    return NextResponse.json(
      { error: "Betreff und Nachricht sind bei Vorbereitungsaufgabe erforderlich." },
      { status: 400 }
    );
  }

  const supabase = createClient(await cookies());

  // Fetch anmeldung with all related data
  const { data: a, error: anmErr } = await supabase
    .from("anmeldungen")
    .select(
      `id, anrede, vorname, name, email, strasse, plz_ort,
       rechnungsadresse_typ, firma, abteilung, rechnung_strasse, rechnung_plz_ort,
       durchfuehrung_id,
       durchfuehrungen(id, ort, termine(start_datetime, end_datetime),
         workshops(id, title, subtitle, preis)
       )`
    )
    .eq("id", anmeldungId)
    .single();

  if (anmErr || !a) {
    return NextResponse.json({ error: "Anmeldung nicht gefunden." }, { status: 404 });
  }

  const durchfuehrung = a.durchfuehrungen as {
    id: string;
    ort: string | null;
    termine: { start_datetime: string; end_datetime: string }[];
    workshops: { id: string; title: string; subtitle: string | null; preis: number | null } | null;
  } | null;

  const workshop = durchfuehrung?.workshops ?? null;

  const termine = (
    (durchfuehrung?.termine as { start_datetime: string; end_datetime: string }[]) ?? []
  ).sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  const from = process.env.EMAIL_FROM ?? "noreply@zweitsprache.ch";
  const today = new Date().toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  try {
    if (typ === "rechnung") {
      const rechnungsNr = `RG-${a.id.slice(0, 8).toUpperCase()}`;
      const preis = workshop?.preis ?? 0;

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
            ort: durchfuehrung?.ort ?? null,
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
            ort: durchfuehrung?.ort ?? null,
            termine,
            preis,
            rechnungsNr,
            datum: today,
          })
        ),
      ]);

      const emailSubject = `Rechnung ${rechnungsNr} – ${workshop?.title ?? "Kurs"}`;
      const result = await resend.emails.send({
        from,
        to: a.email,
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `Rechnung_${rechnungsNr}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      });

      if (result.error) throw new Error(result.error.message);

      await supabase.from("kommunikation_log").insert({
        anmeldung_id: a.id,
        durchfuehrung_id: a.durchfuehrung_id,
        typ: "rechnung",
        email: a.email,
        betreff: emailSubject,
      });
    } else if (typ === "vorbereitungsaufgabe") {
      const emailHtml = await render(
        VorbereitungsaufgabeEmail({
          anrede: a.anrede,
          vorname: a.vorname,
          name: a.name,
          workshopTitle: workshop?.title ?? "",
          workshopSubtitle: workshop?.subtitle ?? null,
          ort: durchfuehrung?.ort ?? null,
          termine,
          subject: subject!,
          message: message!,
        })
      );

      const result = await resend.emails.send({
        from,
        to: a.email,
        subject: subject!,
        html: emailHtml,
      });

      if (result.error) throw new Error(result.error.message);

      await supabase.from("kommunikation_log").insert({
        anmeldung_id: a.id,
        durchfuehrung_id: a.durchfuehrung_id,
        typ: "vorbereitungsaufgabe",
        email: a.email,
        betreff: subject!,
      });
    } else if (typ === "teilnahmebestaetigung") {
      const emailSubject = `Teilnahmebestätigung – ${workshop?.title ?? "Kurs"}`;

      const [pdfBuffer, emailHtml] = await Promise.all([
        Promise.resolve(
          generateTeilnahmebestaetigungPdf({
            anrede: a.anrede,
            vorname: a.vorname,
            name: a.name,
            workshopTitle: workshop?.title ?? "",
            workshopSubtitle: workshop?.subtitle ?? null,
            ort: durchfuehrung?.ort ?? null,
            termine,
            ausstellungsDatum: today,
          })
        ),
        render(
          TeilnahmebestaetigungEmail({
            anrede: a.anrede,
            vorname: a.vorname,
            name: a.name,
            workshopTitle: workshop?.title ?? "",
            workshopSubtitle: workshop?.subtitle ?? null,
            ort: durchfuehrung?.ort ?? null,
            termine,
          })
        ),
      ]);

      const result = await resend.emails.send({
        from,
        to: a.email,
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `Teilnahmebestaetigung_${a.vorname}_${a.name}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      });

      if (result.error) throw new Error(result.error.message);

      await supabase.from("kommunikation_log").insert({
        anmeldung_id: a.id,
        durchfuehrung_id: a.durchfuehrung_id,
        typ: "teilnahmebestaetigung",
        email: a.email,
        betreff: emailSubject,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unbekannter Fehler" },
      { status: 500 }
    );
  }
}
