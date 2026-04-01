import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const VALID_LOCALES = new Set(["en", "uk"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const locale = request.nextUrl.searchParams.get("locale") ?? "de";
  const supabase = createClient(await cookies());

  // For the base language always return lessons.data directly
  if (!VALID_LOCALES.has(locale)) {
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

  // For a learner locale: return lesson_translations row (or empty data if not yet translated)
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, title, sort_order")
    .eq("id", lessonId)
    .single();

  if (lessonError || !lesson) {
    return NextResponse.json({ error: "Lektion nicht gefunden" }, { status: 404 });
  }

  const { data: translation } = await supabase
    .from("lesson_translations")
    .select("data")
    .eq("lesson_id", lessonId)
    .eq("locale", locale)
    .single();

  return NextResponse.json({
    ...lesson,
    data: translation?.data ?? null,
    locale,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params;
  const supabase = createClient(await cookies());

  const body = await request.json();
  const locale: string = body.locale ?? "de";

  if (!body.data) {
    return NextResponse.json({ error: "Daten fehlen" }, { status: 400 });
  }

  // Base (DE) — update lessons.data directly
  if (!VALID_LOCALES.has(locale)) {
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

  // Learner locale — upsert lesson_translations
  const { data, error } = await supabase
    .from("lesson_translations")
    .upsert(
      { lesson_id: lessonId, locale, data: body.data },
      { onConflict: "lesson_id,locale" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
