import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("textsorten")
      .select("id, key, label, gruppe, anweisung, is_personal, is_dialog, sort_order")
      .order("sort_order");

    if (error) {
      console.error("Textsorten error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Textsorten." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Textsorten error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Textsorten." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, label, gruppe, anweisung, is_personal, is_dialog, sort_order } = body;

    if (!key || !label || !gruppe) {
      return NextResponse.json(
        { error: "Key, Label und Gruppe sind erforderlich." },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("textsorten")
      .insert({
        key,
        label,
        gruppe,
        anweisung: anweisung ?? "",
        is_personal: is_personal ?? false,
        is_dialog: is_dialog ?? false,
        sort_order: sort_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Textsorte." },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Insert error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Textsorte." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID ist erforderlich." },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("textsorten")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Fehler beim Aktualisieren der Textsorte." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Textsorte." },
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
      .from("textsorten")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Fehler beim Löschen der Textsorte." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Textsorte." },
      { status: 500 }
    );
  }
}
