import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text: string;
      promptId?: string;
      targetLanguage?: string;
      taskText?: string;
      taskImage?: { base64: string; mimeType: string };
      taskPdf?: { base64: string };
    };
    const { text, promptId, targetLanguage, taskText, taskImage, taskPdf } = body;

    if (!text?.trim()) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    if (text.length > 20_000) {
      return NextResponse.json({ error: "Text zu lang (max. 20.000 Zeichen)" }, { status: 400 });
    }

    // Load custom prompt if provided
    let systemPrompt =
      "Du bist ein DaZ-Lehrer (Deutsch als Zweitsprache) und korrigierst Texte von Lernenden.";

    type ContentBlock =
      | { type: "text"; text: string }
      | { type: "image"; source: { type: "base64"; media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp"; data: string } }
      | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

    const messageContent: ContentBlock[] = [];

    if (promptId) {
      const cookieStore = await cookies();
      const supabase = createClient(cookieStore);
      const { data } = await supabase
        .from("textkorrektor_prompts")
        .select("prompt, additional_info, attachment_base64, attachment_mime_type")
        .eq("id", promptId)
        .single();
      if (data) {
        systemPrompt = data.prompt;
        if (data.additional_info?.trim()) {
          systemPrompt += "\n\n" + data.additional_info.trim();
        }
        // Prompt-level attachment (e.g. scoring rubric) — added first as context
        if (data.attachment_base64 && data.attachment_mime_type) {
          if (data.attachment_mime_type === "application/pdf") {
            messageContent.push({
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: data.attachment_base64 },
            });
          } else {
            messageContent.push({
              type: "image",
              source: {
                type: "base64",
                media_type: data.attachment_mime_type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: data.attachment_base64,
              },
            });
          }
        }
      }
    }

    const languageInstruction = targetLanguage
      ? `Schreibe alle Erklärungen (explanation) und die Gesamtbewertung (summary) zweisprachig: zuerst auf Deutsch, dann auf ${targetLanguage}, getrennt durch " | ".`
      : "Schreibe alle Erklärungen und die Gesamtbewertung auf Deutsch.";

    const taskInstruction = taskText?.trim()
      ? `\nAufgabenstellung:\n${taskText.trim()}\n`
      : taskPdf || taskImage
      ? "\nDie Aufgabenstellung ist im beigefügten Dokument/Bild zu sehen.\n"
      : "";

    // Task-level attachment (specific assignment for this correction)
    if (taskPdf?.base64) {
      messageContent.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: taskPdf.base64 },
      });
    } else if (taskImage?.base64) {
      messageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: taskImage.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: taskImage.base64,
        },
      });
    }

    messageContent.push({
      type: "text",
      text: `${systemPrompt}
${taskInstruction}
Analysiere den folgenden deutschen Text und erstelle:
1. Eine korrigierte Version des Textes
2. Eine Liste aller Fehler mit Erklärungen
3. Eine kurze Gesamtbewertung

${languageInstruction}

Antworte ausschliesslich in diesem JSON-Format:
{
  "correctedText": "...",
  "annotations": [
    {
      "original": "falsches Wort/Phrase aus dem Original",
      "corrected": "korrekte Version",
      "explanation": "kurze Erklärung des Fehlers",
      "category": "Grammatik | Rechtschreibung | Zeichensetzung | Wortstellung | Ausdruck | Zeitform"
    }
  ],
  "summary": "Kurze Gesamtbewertung und wichtigste Hinweise zum Lernfortschritt"
}

TEXT:
${text}`,
    });

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: messageContent }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Unexpected response from Claude");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Konnte Antwort nicht verarbeiten");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[textkorrektor/correct]", err);
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
