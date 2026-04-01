import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("courses")
    .select("available_languages")
    .eq("id", courseId)
    .single();

  if (error || !data) {
    return NextResponse.json({ available_languages: [] });
  }

  return NextResponse.json({ available_languages: data.available_languages ?? [] });
}
