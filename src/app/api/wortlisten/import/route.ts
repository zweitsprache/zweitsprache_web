import fs from "fs";
import path from "path";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

const VALID_LEVELS = new Set(["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2", "B2.1", "B2.2"]);
const GROUP_FILES = ["A1", "A2", "B1", "B2"];

type WordRow = { wort: string; level: string };

// Parse a grouped CSV file (word,level columns) into rows
function parseGroupedCsv(group: string): WordRow[] {
  const filePath = path.join(process.cwd(), "public", "sources", `wortliste_${group}.csv`);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect header row and delimiter
  const delim = lines[0].includes(";") ? ";" : ",";
  const firstCols = lines[0].toLowerCase().split(delim).map((h) => h.trim());
  const wordIdx = firstCols.indexOf("word");
  const levelIdx = firstCols.indexOf("level");
  const hasHeader = wordIdx >= 0 || levelIdx >= 0;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const rows: WordRow[] = [];
  for (const line of dataLines) {
    const cols = line.split(delim).map((c) => c.trim());
    const wort = wordIdx >= 0 ? cols[wordIdx] : cols[0];
    const level = levelIdx >= 0 ? cols[levelIdx] : cols[1];
    if (!wort || !level || !VALID_LEVELS.has(level)) continue;
    rows.push({ wort, level });
  }
  return rows;
}

export async function POST() {
  try {
    const supabase = createClient(await cookies());
    const results: Record<string, number> = {};

    for (const group of GROUP_FILES) {
      const rows = parseGroupedCsv(group);
      if (rows.length === 0) continue;

      const { error } = await supabase
        .from("wortlisten")
        .upsert(rows.map((r) => ({ wort: r.wort, level: r.level })), {
          onConflict: "wort,level",
          ignoreDuplicates: true,
        });

      if (error) {
        console.error(`Import error for group ${group}:`, error);
        return NextResponse.json(
          { error: `Fehler beim Importieren für ${group}: ${error.message}` },
          { status: 500 }
        );
      }

      // Count per sub-level
      for (const row of rows) {
        results[row.level] = (results[row.level] ?? 0) + 1;
      }
    }

    return NextResponse.json({ imported: results });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Fehler beim Importieren." }, { status: 500 });
  }
}
