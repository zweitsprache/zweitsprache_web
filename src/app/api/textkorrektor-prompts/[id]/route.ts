import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const body = await req.json();
  const { name, prompt, additional_info, sort_order, attachment_base64, attachment_mime_type, remove_attachment } = body as {
    name: string;
    prompt: string;
    additional_info?: string;
    sort_order?: number;
    attachment_base64?: string;
    attachment_mime_type?: string;
    remove_attachment?: boolean;
  };
  if (!name?.trim() || !prompt?.trim()) {
    return NextResponse.json({ error: "name and prompt are required" }, { status: 400 });
  }
  const updateData: Record<string, unknown> = {
    name: name.trim(),
    prompt: prompt.trim(),
    additional_info: additional_info?.trim() ?? null,
    sort_order: sort_order ?? 0,
    updated_at: new Date().toISOString(),
  };
  if (attachment_base64 && attachment_mime_type) {
    updateData.attachment_base64 = attachment_base64;
    updateData.attachment_mime_type = attachment_mime_type;
  } else if (remove_attachment) {
    updateData.attachment_base64 = null;
    updateData.attachment_mime_type = null;
  }
  const { data, error } = await supabase
    .from("textkorrektor_prompts")
    .update(updateData)
    .eq("id", id)
    .select("id, name, prompt, additional_info, sort_order, attachment_mime_type, created_at, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase.from("textkorrektor_prompts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
