import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

  return NextResponse.json(data, { status: 201 });
}
