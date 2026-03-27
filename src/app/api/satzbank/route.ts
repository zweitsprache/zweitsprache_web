import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const status = searchParams.get("status");

  const supabase = createClient(await cookies());

  let query = supabase
    .from("sentences")
    .select("id, text, level, attributes, status, batch_id, created_at")
    .order("created_at", { ascending: false });

  if (level) {
    query = query.eq("level", level);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    console.error("Sentences fetch error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden." },
      { status: 500 }
    );
  }

  return NextResponse.json({ sentences: data });
}
