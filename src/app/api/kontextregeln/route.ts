import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("handlungsfeld");

    const supabase = createClient(await cookies());

    let query = supabase
      .from("kontextregeln")
      .select("id, handlungsfeld_code, regel, sort_order")
      .order("handlungsfeld_code")
      .order("sort_order");

    if (code) {
      query = query.eq("handlungsfeld_code", code);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Kontextregeln error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Kontextregeln." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Kontextregeln error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Kontextregeln." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { handlungsfeld_code, regel, sort_order } = await request.json();

    if (!handlungsfeld_code || !regel) {
      return NextResponse.json(
        { error: "Handlungsfeld und Regel sind erforderlich." },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("kontextregeln")
      .insert({ handlungsfeld_code, regel, sort_order: sort_order ?? 0 })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Regel." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Regel." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, regel, sort_order } = await request.json();

    if (!id || !regel) {
      return NextResponse.json(
        { error: "ID und Regel sind erforderlich." },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("kontextregeln")
      .update({ regel, sort_order })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der Regel." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Regel." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "ID ist erforderlich." },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { error } = await supabase
      .from("kontextregeln")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Fehler beim Löschen der Regel." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Regel." },
      { status: 500 }
    );
  }
}
