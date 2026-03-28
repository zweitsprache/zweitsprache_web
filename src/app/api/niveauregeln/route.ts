import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("niveauregeln")
      .select("id, data, updated_at")
      .eq("id", "default")
      .maybeSingle();

    if (error) {
      console.error("Niveauregeln error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Niveauregeln." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      data ?? { id: "default", data: {}, updated_at: null }
    );
  } catch (error) {
    console.error("Niveauregeln error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Niveauregeln." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const rulesData = body?.data;

    if (!rulesData || typeof rulesData !== "object" || Array.isArray(rulesData)) {
      return NextResponse.json(
        { error: "Niveauregeln-Daten sind erforderlich." },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("niveauregeln")
      .upsert(
        {
          id: "default",
          data: rulesData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select("id, data, updated_at")
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Fehler beim Speichern der Niveauregeln." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern der Niveauregeln." },
      { status: 500 }
    );
  }
}