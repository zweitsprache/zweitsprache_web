import { createClient } from "@/utils/supabase/server";
import { buildAnmeldungConfirmationHtml } from "@/emails/anmeldung-confirmation-html";
import { AdminNotification } from "@/emails/admin-notification";
import { render } from "@react-email/render";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Honeypot check (server-side)
  if (body.website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const {
    workshop_id,
    durchfuehrung_id,
    anrede,
    vorname,
    name,
    strasse,
    plz_ort,
    email,
    mobiltelefon,
    rechnungsadresse_typ,
    firma,
    abteilung,
    rechnung_strasse,
    rechnung_plz_ort,
    rechnung_email,
    bemerkungen,
    einwilligung,
    agb,
  } = body;

  // Validate required fields
  if (
    !workshop_id ||
    !durchfuehrung_id ||
    !anrede ||
    !vorname ||
    !name ||
    !strasse ||
    !plz_ort ||
    !email ||
    !einwilligung ||
    !agb
  ) {
    return NextResponse.json(
      { error: "Pflichtfelder fehlen." },
      { status: 400 }
    );
  }

  const supabase = createClient(await cookies());

  const { data, error } = await supabase.from("anmeldungen").insert({
    workshop_id,
    durchfuehrung_id,
    anrede,
    vorname,
    name,
    strasse,
    plz_ort,
    email,
    mobiltelefon: mobiltelefon || null,
    rechnungsadresse_typ: rechnungsadresse_typ || "privat",
    firma: firma || null,
    abteilung: abteilung || null,
    rechnung_strasse: rechnung_strasse || null,
    rechnung_plz_ort: rechnung_plz_ort || null,
    rechnung_email: rechnung_email || null,
    bemerkungen: bemerkungen || null,
    einwilligung,
    agb,
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch workshop + Durchführung details for emails
  const [workshopResult, durchfuehrungResult] = await Promise.all([
    supabase.from("workshops").select("title, subtitle, preis").eq("id", workshop_id).single(),
    supabase
      .from("durchfuehrungen")
      .select("ort, termine(start_datetime, end_datetime)")
      .eq("id", durchfuehrung_id)
      .single(),
  ]);

  const workshop = workshopResult.data;
  const durchfuehrung = durchfuehrungResult.data;

  const termine = (
    (durchfuehrung?.termine as { start_datetime: string; end_datetime: string }[] | null) ?? []
  ).sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  const firstTermin = termine[0];
  const firstDate = firstTermin
    ? new Date(firstTermin.start_datetime).toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";
  const timeRange = firstTermin
    ? `${new Date(firstTermin.start_datetime).toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${new Date(firstTermin.end_datetime).toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "";
  const preisLabel = workshop?.preis != null ? `CHF ${Number(workshop.preis).toFixed(2)}` : "";

  const from = process.env.EMAIL_FROM ?? "noreply@zweitsprache.ch";
  const adminEmail = process.env.ADMIN_EMAIL ?? "info@zweitsprache.ch";

  // Render email templates to HTML
  const [confirmationHtml, adminHtml] = await Promise.all([
    Promise.resolve(
      buildAnmeldungConfirmationHtml({
        vorname,
        name,
        workshopTitle: workshop?.title ?? "",
        workshopSubtitle: workshop?.subtitle ?? "",
        firstDate,
        timeRange,
        preisLabel,
      })
    ),
    render(AdminNotification({
      anrede,
      vorname,
      name,
      email,
      mobiltelefon: mobiltelefon ?? null,
      strasse,
      plz_ort,
      rechnungsadresse_typ: rechnungsadresse_typ ?? "privat",
      firma: firma ?? null,
      abteilung: abteilung ?? null,
      rechnung_strasse: rechnung_strasse ?? null,
      rechnung_plz_ort: rechnung_plz_ort ?? null,
      rechnung_email: rechnung_email ?? null,
      bemerkungen: bemerkungen ?? null,
      workshopTitle: workshop?.title ?? "",
      workshopSubtitle: workshop?.subtitle ?? null,
      ort: durchfuehrung?.ort ?? null,
      termine,
      anmeldungId: data.id,
    })),
  ]);

  // Send emails in parallel (don't block on failure)
  const emailResults = await Promise.allSettled([
    resend.emails.send({
      from,
      to: email,
      subject: `Anmeldebestätigung – ${workshop?.title ?? "Kurs"}`,
      html: confirmationHtml,
    }),
    resend.emails.send({
      from,
      to: adminEmail,
      subject: `Neue Anmeldung: ${vorname} ${name} – ${workshop?.title ?? "Kurs"}`,
      html: adminHtml,
    }),
  ]);

  for (const result of emailResults) {
    if (result.status === "rejected") {
      console.error("[anmeldungen] Email send failed:", result.reason);
    } else if (result.value.error) {
      console.error("[anmeldungen] Resend error:", result.value.error);
    }
  }

  return NextResponse.json(data, { status: 201 });
}
