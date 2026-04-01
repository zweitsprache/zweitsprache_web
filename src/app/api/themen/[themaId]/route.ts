import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ themaId: string }> }
) {
  const { themaId } = await params;
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("themen")
    .select("*")
    .eq("id", themaId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Thema nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ themaId: string }> }
) {
  const { themaId } = await params;
  const supabase = createClient(await cookies());

  const body = await request.json();

  if (!body.data) {
    return NextResponse.json({ error: "Daten fehlen" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("themen")
    .update({ data: body.data })
    .eq("id", themaId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
