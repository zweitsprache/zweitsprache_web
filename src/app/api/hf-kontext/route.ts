import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/utils/supabase/server";

type SubdomainEntry = {
  id: string;
  name: string;
};

type ContextJson = {
  handlungsfeld: {
    subdomains: SubdomainEntry[];
  };
};

export async function POST(request: Request) {
  try {
    const { hf_code, context_json } = (await request.json()) as {
      hf_code: string;
      context_json: ContextJson;
    };

    if (!hf_code || !context_json) {
      return NextResponse.json(
        { error: "hf_code und context_json sind erforderlich." },
        { status: 400 }
      );
    }

    const subdomains: SubdomainEntry[] = context_json.handlungsfeld?.subdomains ?? [];
    if (!subdomains.length) {
      return NextResponse.json(
        { error: "Keine Subdomains im context_json gefunden." },
        { status: 400 }
      );
    }

    const supabase = createClient(await cookies());
    const openai = new OpenAI();

    // 1. Store context_json on handlungsfelder
    const { error: updateError } = await supabase
      .from("handlungsfelder")
      .update({ context_json: context_json as unknown as Record<string, unknown> })
      .eq("code", hf_code);

    if (updateError) {
      console.error("HF update error:", updateError);
      return NextResponse.json(
        { error: "Fehler beim Speichern des context_json." },
        { status: 500 }
      );
    }

    // 2. Embed all subdomain names in a single batch call (text-embedding-3-small = 1536-dim,
    //    matching what the generate route already uses for topic embedding)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: subdomains.map((sd) => sd.name),
    });

    // 3. Delete old subdomains for this HF, then insert fresh ones
    const { error: deleteError } = await supabase
      .from("hf_subdomains")
      .delete()
      .eq("hf_code", hf_code);

    if (deleteError) {
      console.error("Subdomain delete error:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Löschen alter Subdomains." },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabase.from("hf_subdomains").insert(
      subdomains.map((sd, i) => ({
        id: sd.id,
        hf_code,
        name: sd.name,
        embedding: embeddingResponse.data[i].embedding,
        sort_order: i,
      }))
    );

    if (insertError) {
      console.error("Subdomain insert error:", insertError);
      return NextResponse.json(
        { error: "Fehler beim Speichern der Subdomains." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      subdomains: subdomains.length,
      ids: subdomains.map((sd) => sd.id),
    });
  } catch (error) {
    console.error("HF-Kontext error:", error);
    return NextResponse.json(
      { error: "Interner Fehler." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("hf_code");

    const supabase = createClient(await cookies());

    let query = supabase
      .from("hf_subdomains")
      .select("id, hf_code, name, sort_order")
      .order("hf_code")
      .order("sort_order");

    if (code) {
      query = query.eq("hf_code", code);
    }

    const { data, error } = await query;

    if (error) {
      console.error("HF subdomains fetch error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Subdomains." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("HF-Kontext GET error:", error);
    return NextResponse.json(
      { error: "Interner Fehler." },
      { status: 500 }
    );
  }
}
