import { createClient } from "@/utils/supabase/server";
import { generateTeilnahmebestaetigungPdf } from "@/lib/pdf/teilnahmebestaetigung";
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
  const { id: durchfuehrungId } = await params;
  const body = await req.json().catch(() => ({}));
  const { anmeldung_ids } = body as { anmeldung_ids?: string[] };

  const supabase = createClient(await cookies());

  // Fetch durchfuehrung + workshop
  const { data: durchfuehrung, error: dfErr } = await supabase
    .from("durchfuehrungen")
    .select(
      "id, ort, termine(start_datetime, end_datetime), workshops(id, title, subtitle)"
    )
    .eq("id", durchfuehrungId)
    .single();

  if (dfErr || !durchfuehrung) {
    return NextResponse.json({ error: "Durchführung nicht gefunden." }, { status: 404 });
  }

  const workshop = durchfuehrung.workshops as {
    id: string;
    title: string;
    subtitle: string | null;
  } | null;

  const termine = (
    (durchfuehrung.termine as { start_datetime: string; end_datetime: string }[]) ?? []
  ).sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  // Fetch anmeldungen (all or selected)
  let query = supabase
    .from("anmeldungen")
    .select("id, anrede, vorname, name, email")
    .eq("durchfuehrung_id", durchfuehrungId);

  if (anmeldung_ids && anmeldung_ids.length > 0) {
    query = query.in("id", anmeldung_ids);
  }

  const { data: anmeldungen, error: anmErr } = await query;

  if (anmErr) {
    return NextResponse.json({ error: anmErr.message }, { status: 500 });
  }

  if (!anmeldungen || anmeldungen.length === 0) {
    return NextResponse.json({ sent: 0, errors: [] });
  }

  const from = process.env.EMAIL_FROM ?? "noreply@zweitsprache.ch";
  const today = new Date().toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const sent: string[] = [];
  const errors: string[] = [];

  for (const a of anmeldungen) {
    try {
      const [pdfBuffer, emailHtml] = await Promise.all([
        Promise.resolve(
          generateTeilnahmebestaetigungPdf({
            anrede: a.anrede,
            vorname: a.vorname,
            name: a.name,
            workshopTitle: workshop?.title ?? "",
            workshopSubtitle: workshop?.subtitle ?? null,
            ort: durchfuehrung.ort ?? null,
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
            ort: durchfuehrung.ort ?? null,
            termine,
          })
        ),
      ]);

      const subject = `Teilnahmebestätigung – ${workshop?.title ?? "Kurs"}`;

      const result = await resend.emails.send({
        from,
        to: a.email,
        subject,
        html: emailHtml,
        attachments: [
          {
            filename: `Teilnahmebestaetigung_${a.vorname}_${a.name}.pdf`,
            content: pdfBuffer.toString("base64"),
          },
        ],
      });

      if (result.error) {
        errors.push(`${a.email}: ${result.error.message}`);
        continue;
      }

      await supabase.from("kommunikation_log").insert({
        anmeldung_id: a.id,
        durchfuehrung_id: durchfuehrungId,
        typ: "teilnahmebestaetigung",
        email: a.email,
        betreff: subject,
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
