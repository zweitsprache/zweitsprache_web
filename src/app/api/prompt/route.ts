import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("prompt_templates")
      .select("id, template, updated_at")
      .eq("id", "default")
      .single();

    if (error) {
      console.error("Prompt template error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden des Prompts." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Prompt template error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Prompts." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { template } = await request.json();

    if (!template) {
      return NextResponse.json(
        { error: "Prompt-Template ist erforderlich." },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("prompt_templates")
      .update({ template, updated_at: new Date().toISOString() })
      .eq("id", "default")
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Fehler beim Speichern des Prompts." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern des Prompts." },
      { status: 500 }
    );
  }
}
