import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Lektion nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = createClient(await cookies());

  const body = await request.json();

  if (!body.data) {
    return NextResponse.json({ error: "Daten fehlen" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lessons")
    .update({ data: body.data })
    .eq("id", lessonId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
