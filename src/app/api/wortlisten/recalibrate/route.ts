import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

// POST: recompute `score` from stored `cosine_raw` — no API calls needed.
// Uses per-word relative (min-max) normalization across all 20 HF rows per word,
// matching the logic in score/route.ts. Skips function word rows (cosine_raw = 1).
// Accepts optional ?level=A1.1 to limit scope.
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");

  try {
    const supabase = createClient(await cookies());

    // Fetch all content-word rows (cosine_raw < 1) that have a stored cosine
    let query = supabase
      .from("wortliste_relevanz")
      .select("word_id, handlungsfeld_code, cosine_raw, wortlisten!inner(level)")
      .lt("cosine_raw", 1.0)
      .not("cosine_raw", "is", null);

    if (level) {
      query = query.eq("wortlisten.level", level);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Recalibrate fetch error:", error);
      return NextResponse.json({ error: "Fehler beim Laden der Scores." }, { status: 500 });
    }

    if (!data?.length) {
      return NextResponse.json({ updated: 0 });
    }

    // Group rows by word_id so we can normalize per word across all 20 HF
    const wordMap = new Map<string, { word_id: string; handlungsfeld_code: string; cosine_raw: number }[]>();
    for (const row of data) {
      if (!wordMap.has(row.word_id)) wordMap.set(row.word_id, []);
      wordMap.get(row.word_id)!.push({
        word_id: row.word_id,
        handlungsfeld_code: row.handlungsfeld_code,
        cosine_raw: Number(row.cosine_raw),
      });
    }

    // Per-word min-max normalization
    const now = new Date().toISOString();
    const updates: { word_id: string; handlungsfeld_code: string; cosine_raw: number; score: number; computed_at: string }[] = [];

    for (const rows of wordMap.values()) {
      const cosines = rows.map((r) => r.cosine_raw);
      const min = Math.min(...cosines);
      const max = Math.max(...cosines);
      const range = max - min;

      for (const r of rows) {
        const score = range === 0 ? 0 : (r.cosine_raw - min) / range;
        updates.push({
          word_id: r.word_id,
          handlungsfeld_code: r.handlungsfeld_code,
          cosine_raw: r.cosine_raw,
          score: Math.round(score * 100) / 100,
          computed_at: now,
        });
      }
    }

    // Upsert in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const batch = updates.slice(i, i + BATCH_SIZE);
      const { error: upsertError } = await supabase
        .from("wortliste_relevanz")
        .upsert(batch, { onConflict: "word_id,handlungsfeld_code" });

      if (upsertError) {
        console.error("Recalibrate upsert error:", upsertError);
        return NextResponse.json({ error: "Fehler beim Aktualisieren der Scores." }, { status: 500 });
      }
    }

    return NextResponse.json({ updated: updates.length });
  } catch (error) {
    console.error("Recalibrate error:", error);
    return NextResponse.json({ error: "Fehler beim Rekalibrieren." }, { status: 500 });
  }
}
