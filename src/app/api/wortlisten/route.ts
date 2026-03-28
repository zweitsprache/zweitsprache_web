import fs from "fs";
import path from "path";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

const LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1", "B2.2"] as const;
const GROUP_FILES = ["A1", "A2", "B1", "B2"];

// Parse all grouped CSV files and return a count map: { "A1.1": 42, ... }
function countCsvWordsByLevel(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const group of GROUP_FILES) {
    const filePath = path.join(process.cwd(), "public", "sources", `wortliste_${group}.csv`);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    // Detect header
    // Auto-detect delimiter
    const delim = lines[0].includes(";") ? ";" : ",";
    const header = lines[0].toLowerCase().split(delim).map((h) => h.trim());
    const wordIdx = header.indexOf("word");
    const levelIdx = header.indexOf("level");
    const dataLines = header.includes("word") || header.includes("level") ? lines.slice(1) : lines;

    for (const line of dataLines) {
      const cols = line.split(delim).map((c) => c.trim());
      const lvl = levelIdx >= 0 ? cols[levelIdx] : null;
      const word = wordIdx >= 0 ? cols[wordIdx] : cols[0];
      if (!word || !lvl) continue;
      counts[lvl] = (counts[lvl] ?? 0) + 1;
    }
  }
  return counts;
}

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const fileCounts = countCsvWordsByLevel();

    // Use per-level count queries to avoid Supabase's default 1000-row pagination limit
    const stats = await Promise.all(
      LEVELS.map(async (level) => {
        const [{ count: db_count }, { count: scored_count }] = await Promise.all([
          supabase
            .from("wortlisten")
            .select("*", { count: "exact", head: true })
            .eq("level", level),
          supabase
            .from("wortlisten")
            .select("*, wortliste_relevanz!inner(word_id)", { count: "exact", head: true })
            .eq("level", level),
        ]);

        return {
          level,
          file_count: fileCounts[level] ?? 0,
          db_count: db_count ?? 0,
          scored_count: scored_count ?? 0,
        };
      })
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Wortlisten GET error:", error);
    return NextResponse.json({ error: "Fehler beim Laden der Wortlisten." }, { status: 500 });
  }
}
