import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase
    .from("textkorrektor_prompts")
    .select("id, name, prompt, additional_info, sort_order, attachment_mime_type, created_at, updated_at")
    .order("sort_order")
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const body = await req.json();
  const { name, prompt, additional_info, sort_order } = body as {
    name: string;
    prompt: string;
    additional_info?: string;
    sort_order?: number;
  };
  if (!name?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "name and prompt are required" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("textkorrektor_prompts")
    .insert({ name: name.trim(), prompt: prompt.trim(), additional_info: additional_info?.trim() ?? null, sort_order: sort_order ?? 0 })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
