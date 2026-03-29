import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { image: string; mimeType: string };
    const { image, mimeType } = body;

    if (!image || !mimeType) {
      return NextResponse.json({ error: "image and mimeType are required" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }

    if (image.length > 14_000_000) {
      return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: image,
              },
            },
            {
              type: "text",
              text: "Transkribiere den handgeschriebenen oder gedruckten deutschen Text in diesem Bild. Gib ausschliesslich den transkribierten Text zurück, ohne Kommentare oder Erklärungen. Behalte Zeilenumbrüche bei.",
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unerwartete Antwort vom OCR-Modell");

    const rawText = content.text.trim();

    if (!rawText) {
      return NextResponse.json({ error: "Kein Text im Bild erkannt" }, { status: 422 });
    }

    return NextResponse.json({ rawText, ocrEngine: "claude" });
  } catch (err) {
    console.error("[textkorrektor/ocr]", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
