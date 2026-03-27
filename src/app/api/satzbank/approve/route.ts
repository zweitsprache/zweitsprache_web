import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/utils/supabase/server";

const openai = new OpenAI();

interface SentencePayload {
  text: string;
  level: string;
  attributes: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const { sentences, batchId } = (await request.json()) as {
      sentences: SentencePayload[];
      batchId: string;
    };

    if (!sentences?.length) {
      return NextResponse.json(
        { error: "Keine Sätze zum Speichern." },
        { status: 400 }
      );
    }

    // Embed all sentences in one batch call
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: sentences.map((s) => s.text),
    });

    const supabase = createClient(await cookies());

    const rows = sentences.map((sentence, i) => ({
      text: sentence.text,
      level: sentence.level,
      attributes: sentence.attributes,
      embedding: JSON.stringify(embeddingResponse.data[i].embedding),
      status: "approved",
      batch_id: batchId,
    }));

    const { data, error } = await supabase.from("sentences").insert(rows).select("id, text, level");

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        { error: "Fehler beim Speichern." },
        { status: 500 }
      );
    }

    return NextResponse.json({ approved: data });
  } catch (error) {
    console.error("Approve error:", error);
    return NextResponse.json(
      { error: "Fehler beim Genehmigen." },
      { status: 500 }
    );
  }
}
