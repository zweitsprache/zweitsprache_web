import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `Du bist ein Experte für deutsche Linguistik und CEFR-Niveaustufenklassifizierung (A1.1, A1.2, A2.1, A2.2, B1.1, B1.2).

Gegeben wird ein deutscher Text und ein Zielniveau. Deine Aufgabe:
1. Teile den Text in einzelne Sätze auf
2. Annotiere jeden Satz mit linguistischen Attributen

Für jeden Satz liefere ein JSON-Objekt mit:
- "text": der exakte Satztext
- "level": verwende IMMER exakt das angegebene Zielniveau
- "attributes":
  - "tense": Array der verwendeten deutschen Zeitformen (z.B. "Präsens", "Perfekt", "Präteritum", "Plusquamperfekt", "Futur I", "Futur II")
  - "sentence_type": einer von "Hauptsatz", "Nebensatz", "Fragesatz", "Imperativsatz", "Relativsatz"
  - "structures": Array bemerkenswerter grammatischer Strukturen (z.B. "Passiv", "Konjunktiv II", "zu + Infinitiv", "Partizipialkonstruktion", "Modalverb", "trennbares Verb", "reflexives Verb")
  - "vocabulary_band": einer von "basic", "intermediate", "advanced", "specialized"
  - "topics": Array von Themen-Tags auf Englisch (z.B. "shopping", "travel", "work", "food", "origin", "family", "health", "education")
  - "word_count": Anzahl der Wörter
  - "subordinate_clauses": Anzahl der Nebensätze
  - "level_reasoning": kurze deutsche Begründung, warum dieser Satz zum zugewiesenen Niveau passt

Antworte NUR mit einem validen JSON-Array. Keine Erklärungen, kein Markdown, kein Code-Block.`;

export async function POST(request: Request) {
  try {
    const { text, level } = await request.json();

    if (!text || !level) {
      return NextResponse.json(
        { error: "Text und Niveau sind erforderlich." },
        { status: 400 }
      );
    }

    const validLevels = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2"];
    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { error: "Ungültiges CEFR-Niveau." },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      messages: [
        {
          role: "user",
          content: `Zielniveau: ${level}\n\nText:\n${text}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unerwartete Antwort von Claude." },
        { status: 500 }
      );
    }

    if (message.stop_reason === "max_tokens") {
      return NextResponse.json(
        { error: "Text ist zu lang. Bitte kürzeren Text einfügen." },
        { status: 400 }
      );
    }

    let raw = content.text.trim();
    // Strip markdown code fences if present
    if (raw.startsWith("```")) {
      raw = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const sentences = JSON.parse(raw);

    // Enforce the teacher's selected level on all sentences
    const normalized = sentences.map((s: Record<string, unknown>) => ({
      ...s,
      level,
    }));

    return NextResponse.json({ sentences: normalized });
  } catch (error) {
    console.error("Annotation error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Analyse." },
      { status: 500 }
    );
  }
}
