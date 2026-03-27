import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/utils/supabase/server";

const anthropic = new Anthropic();
const openai = new OpenAI();

const VALID_LEVELS = ["A1.1", "A1.2", "A2.1", "A2.2", "B1.1", "B1.2"];

// --- Level-specific rules (cumulative) ---

const LEVEL_RULES: Record<string, string> = {
  "A1.1": `NIVEAU A1.1 – STRIKT EINHALTEN:
Grammatik: Präsens (regelmässige Verben; sein, haben); Personalpronomen (ich/du/er/sie/es/wir/ihr/sie); Artikel Singular (bestimmt/unbestimmt) im Nominativ und sehr einfacher Akkusativ; Plural (Basis); keine Nebensätze.
Konnektoren: und, oder, aber.
Syntax und Stil: Aussagesatz (Verb-zweit), Ja/Nein-Frage (Verb-erst), W-Frage (W-Wort + Verb-zweit); Satzlänge Ø 5–8 Wörter; keine Inversion.
Wortschatz: sehr hoher Alltagsbezug (Familie, Arbeit, Wohnen, Wege, Zeitwörter heute/jetzt/morgen); Ortsangaben ohne komplexe Präpositionalketten. 85–90 % sehr hochfrequente Wörter; neue Wörter sofort kontextualisieren.
NICHT VERWENDEN: Perfekt, Modalverben, Nebensätze, komplexe Dativ/Genitiv-Strukturen, trennbare Verben, Imperativ.`,

  "A1.2": `NIVEAU A1.2 (kumulativ: A1.1 + A1.2) – STRIKT EINHALTEN:
Grammatik: Präsens + Perfekt (häufige Verben); Modalverben im Präsens (können, müssen, wollen, dürfen, sollen, mögen) mit Infinitiv am Satzende; trennbare Verben (Präsens/Perfekt); einfache Dativ-Phrase mit «mit»; Kontraktionen im/am/zum/zur.
Konnektoren: und, oder, aber, denn; Zeitmarker: zuerst, dann, danach, später; am Morgen/Abend; um X Uhr; oft/manchmal/immer/nie.
Syntax und Stil: Inversion nach Vorfeld möglich (Dann gehe ich…); Satzlänge Ø 6–12 Wörter.
Wortschatz: Routinen (Arbeit/Alltag/Spital/ÖV/Einkauf), Grundzahlen/Uhrzeit, einfache Mengen/Preise. 85–90 % sehr hochfrequente Wörter.
NICHT VERWENDEN: weil/dass/ob/Relativsätze, Präteritum (ausser war/hatte optional), Passiv, Konjunktiv II, Imperativ.`,

  "A2.1": `NIVEAU A2.1 (kumulativ: A1.1 + A1.2 + A2.1) – STRIKT EINHALTEN:
Grammatik: Nebensatz mit weil (Verb am Ende); Inversion nach Voranstellung; Präteritum von sein, haben und Modalverben; Wechselpräpositionen in einfachen Mustern (in + Akk/Dat), keine Ketten.
Konnektoren: weil, deshalb/deswegen, zuerst, dann, danach, später, also, ausserdem (sparsam).
Syntax und Stil: Satzlänge Ø 8–14 Wörter; max. 1 Nebensatz pro Satz; klare Chronologie.
Wortschatz: einfache Vergleichs-/Zweckangaben auf Wortgruppenebene (kein zu-Infinitiv!); berufsnahe Termini behutsam. 75–85 % hochfrequent.
NICHT VERWENDEN: dass/ob/wenn-Sätze, Relativsätze, zu-Infinitiv, Komparativ/Superlativ als Struktur, Passiv, Konjunktiv II.`,

  "A2.2": `NIVEAU A2.2 (kumulativ: A1.1–A2.2) – STRIKT EINHALTEN:
Grammatik: Nebensätze mit dass, wenn (temporal/konditional), ob; Komparativ/Superlativ; trennbar/untrennbar erweitert; Konjunktiv II (Höflichkeit/Wünsche): würde + Inf, könnte, sollte.
Konnektoren: ausserdem, jedoch, trotzdem, während (als Präposition).
Syntax und Stil: Satzlänge Ø 10–16 Wörter; 1–2 Nebensätze pro Satz; einfache indirekte Rede mit dass.
Wortschatz: breiter Arbeits-/Gesellschaftskontext, einfache Abstrakta («Regel», «Kosten», «Termin»). 75–85 % hochfrequent.
NICHT VERWENDEN: Passiv, Plusquamperfekt, komplexe Relativketten, Partizipialattribute.`,

  "B1.1": `NIVEAU B1.1 (kumulativ: A1.1–B1.1) – STRIKT EINHALTEN:
Grammatik: Relativsatz (der/die/das; Subjekt/Objekt, einfach); zu-Infinitiv und um … zu; Passiv Präsens (wird + Partizip II) einfach; Plusquamperfekt in linearen Zeitbezügen; obwohl, damit als Nebensätze; erweiterte Objekt-/Präpositionalgruppen.
Konnektoren: trotzdem, daher/deshalb, allerdings, jedoch, einerseits … andererseits (einfach).
Syntax und Stil: Satzlänge Ø 12–18 Wörter; bis 2 Nebensätze, klar strukturiert; indirekte Rede mit dass.
Wortschatz: moderat abstrakt («Verantwortung», «Massnahme»), vorsichtige Bewertungssprache. 65–75 % hochfrequent.
NICHT VERWENDEN: Futur I als Pflichtform, Passiv Perfekt, partizipiale Verdichtungen, verschachtelte Relativketten, exzessiver Nominalstil.`,

  "B1.2": `NIVEAU B1.2 (kumulativ: A1.1–B1.2) – STRIKT EINHALTEN:
Grammatik: Relativsätze mit Präposition (einfach, nur wenn nötig); obwohl, bevor, nachdem, seit/seitdem; Zustandspassiv (sein + Partizip II), Passiv Präsens weiterhin möglich; behutsame Partizip-Attribute (die geöffnete Datei).
Konnektoren: folglich, somit, hingegen, ausserdem, darüber hinaus (massvoll).
Syntax und Stil: Satzlänge Ø 12–22 Wörter; Variation der Satzanfänge; klare Informationsgliederung (Thema–Rhema).
Wortschatz: breitere Abstrakta, einfache Nominalisierungen (die Entscheidung, die Verbesserung), dennoch allgemeinverständlich. 65–75 % hochfrequent.
NICHT VERWENDEN: Passiv Perfekt/Plusquamperfekt, komplexe Partizipialketten, unnötiger Fachjargon.`,
};

const LENGTH_RULES: Record<string, string> = {
  "A1.1": "90–140 Wörter, 3 Absätze",
  "A1.2": "130–180 Wörter, 3–4 Absätze",
  "A2.1": "170–240 Wörter, 4 Absätze",
  "A2.2": "220–320 Wörter, 4–5 Absätze",
  "B1.1": "300–420 Wörter, 5 Absätze",
  "B1.2": "380–520 Wörter, 5–6 Absätze",
};

const TEXT_TYPE_RULES: Record<string, string> = {
  erzaehlung: "Erzählung/Blog: einfache Chronologie; klare Zeitmarker gemäss Niveau; Ich- oder Er/Sie-Form.",
  dialog: "Interview/Dialog: Sprecherwechsel mit «Person A», «Person B» oder Namen; stufengerechte Fragen/Antworten. Für Dialoge gilt die Längensteuerung nicht – die Länge richtet sich nach dem natürlichen Dialogverlauf und der Pragmatik.",
  email: "E-Mail: mit Anrede, Text und Gruss; informell bis neutral.",
  brief: "Brief: mit Anrede, Text und Gruss; etwas formeller als eine E-Mail.",
  tagebuch: "Tagebucheintrag: persönlich, in der Ich-Form, mit Datum; einfache Chronologie.",
  beschreibung: "Sachtext/Beschreibung: klarer Lead; Absätze mit Themensätzen; neutrale Tonalität; Beispiele/Daten einfach; keine direkte Leseransprache.",
  anleitung: "Anleitung: Schritt-für-Schritt, mit Imperativ oder man-Sätzen.",
  nachricht: "Nachricht/Meldung: Beantwortung von W-Fragen (Wer/Was/Wo/Wann/Wie/Warum) in den ersten Sätzen, sachlich. Keine direkte Leseransprache.",
  bericht: "Bericht: sachlicher Lead; Absätze mit Themensätzen; neutrale Tonalität; in der Vergangenheit. Keine direkte Leseransprache.",
  inserat: "Inserat/Anzeige: kurz, prägnant, mit Stichpunkten.",
  portraet: "Porträt: Person, Kontext, charakteristische Details; indirekte Rede erst ab A2.2.",
  kommentar: "Kommentar (empfohlen ab B1.1): These – Begründung – Fazit; vorsichtige Bewertung, einfache Argumentationsmarker.",
};

export async function POST(request: Request) {
  try {
    const { level, topic, region, textType, address } = (await request.json()) as {
      level: string;
      topic: string;
      region?: "ch" | "de";
      textType?: string;
      address?: "sie" | "man";
    };

    if (!level || !topic) {
      return NextResponse.json(
        { error: "Niveau und Thema sind erforderlich." },
        { status: 400 }
      );
    }

    if (!VALID_LEVELS.includes(level)) {
      return NextResponse.json(
        { error: "Ungültiges CEFR-Niveau." },
        { status: 400 }
      );
    }

    // 1. Embed the topic query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: topic,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 2. Retrieve matching sentences from the bank
    const supabase = createClient(await cookies());
    const { data: matches, error: matchError } = await supabase.rpc(
      "match_sentences",
      {
        query_embedding: JSON.stringify(queryEmbedding),
        match_level: level,
        match_threshold: 0.3,
        match_count: 20,
      }
    );

    if (matchError) {
      console.error("Match error:", matchError);
      return NextResponse.json(
        { error: "Fehler bei der Satzsuche." },
        { status: 500 }
      );
    }

    if (!matches?.length) {
      return NextResponse.json(
        { error: `Keine Sätze für ${level} zum Thema «${topic}» gefunden. Bitte zuerst Sätze in der Satzbank annotieren.` },
        { status: 404 }
      );
    }

    // 3. Build the prompt
    const examples = matches
      .map(
        (s: { text: string; attributes: { tense: string[]; sentence_type: string; structures: string[]; vocabulary_band: string } }) =>
          `- "${s.text}" [${s.attributes.tense.join(", ")}; ${s.attributes.sentence_type}; Wortschatz: ${s.attributes.vocabulary_band}]`
      )
      .join("\n");

    const isSwiss = (region ?? "ch") === "ch";
    const selectedAddress = address ?? "man";
    const selectedTextType = textType ?? "erzaehlung";

    const regionRule = isSwiss
      ? "DE-CH-Standard: ss statt ß; CH-Varianz zulässig («Spital», «Tram», «Billett», «Velo», «Trottoir», «parkieren»)."
      : "Bundesdeutsches Hochdeutsch mit ß gemäss neuer Rechtschreibung.";

    const addressRule = selectedAddress === "sie"
      ? `Leseransprache «direkt-sie»:
- Pronomen/Beugung: Sie/Ihnen/Ihr(e), Verbform 3. Person Plural («Sie können…», «Sie bringen… zurück»).
- Stil: höflich, zugewandt; auf A1.1 kein Imperativ (stattdessen Aussagesätze/Ja-Nein-Fragen).
- Durchgehend «Sie» in Titel, Teaser, Text und Glossar.`
      : `Leseransprache «neutral-man»:
- Pronomen/Beugung: man, Verbform 3. Person Singular («man kann…», «man bringt… zurück»).
- Possessiv auf A1: vermeide «sein/ihr» → nutze «die eigene …/das eigene …» oder Umschreibungen.
- Keine direkte Anrede, keine Leserfragen.
- A1.1/A1.2: kein Imperativ; bei «neutral-man» möglichst ohne Passiv, stattdessen «man + Modalverb».
- Durchgehend «man» in Titel, Teaser, Text und Glossar.`;

    const textTypeRule = TEXT_TYPE_RULES[selectedTextType] ?? TEXT_TYPE_RULES.erzaehlung;
    const levelRule = LEVEL_RULES[level];
    const lengthRule = LENGTH_RULES[level];
    const isDialog = selectedTextType === "dialog";

    const systemPrompt = `Du bist ein Experte für Deutsch als Fremdsprache. Du schreibst Texte für Sprachlerner auf exakt dem CEFR-Niveau ${level}.

═══ GLOBALE QUALITÄTSKRITERIEN ═══
- Flüssigkeit und Lesbarkeit: klare, natürliche Sätze; kein Telegrafstil; stimmiger Rhythmus.
- Kohäsion: thematische Fortschreibung, saubere Referenzen (Pronomen/Wiederaufnahmen), Konnektoren gemäss Niveau.
- Erwachsenenrelevanz: alltags-, berufs- oder gesellschaftsnah; respektvoll, inklusiv, kultursensibel.
- ${regionRule}
- Wortschatz: bevorzugt hochfrequente, konkrete Lexik; kein unnötiger Jargon.
- Fehlerfreiheit: Grammatik, Orthografie, Zeichensetzung korrekt.
- Inklusive Sprache: bevorzugt neutrale Formen («Mitarbeitende», «Lehrpersonen») oder Gender durch «:» («Mitarbeiter:innen»).
- Neutralität: keine bewertenden, romantisierenden, verniedlichenden oder moralisierenden Aussagen, es sei denn, vom Inhalt oder den Akteuren verlangt.
- WICHTIG: Der Inhalt muss logisch und realistisch sein. Vermeide widersprüchliche Aussagen. Bei Dialogen: Wer fragt, weiss die Antwort noch nicht. Wer antwortet, gibt neue Information.

═══ ${addressRule} ═══

═══ TEXTSORTE ═══
${textTypeRule}

═══ LÄNGENSTEUERUNG ═══
${isDialog ? "Für Dialoge gilt die Längensteuerung nicht – die Länge richtet sich nach dem natürlichen Dialogverlauf und der Pragmatik." : `${lengthRule}.`}

═══ ${levelRule} ═══

═══ KOHÄSION UND STIL ═══
- Referenz: konsistente Nennung/Ersetzung (Nomen → Pronomen/Synonym) ohne Ambiguität.
- Themenführung: pro Absatz ein klarer Fokus; am Ende kurzer Abschluss-/Ausblicksatz.
- Klang: natürliche Prosodie; keine übermässigen Wiederholungen; moderate Variation bei Satzanfängen.

═══ AUSGABEFORMAT ═══
- Titel (prägnant, 3–8 Wörter${selectedAddress === "man" ? "; neutral formulieren" : ""})
- Untertitel/Teaser (1 Satz, max. 140 Zeichen)
- Haupttext in Absätzen gemäss Längensteuerung
- Miniglossar mit 6–12 stufengerechten Einträgen (Lemma – einfache Erklärung/Beispiel)
- Nur den Text liefern (keine Aufgaben, keine Meta-Erklärungen, kein Markdown)

═══ QUALITÄTSSICHERUNG (still, nicht ausgeben) ═══
- Niveau-Check: Jeder Satz erfüllt die Merkmale der Stufe (keine höheren Strukturen).
- Präteritum-Check: Bis und mit A2.2 KEINE Präteritumformen ausser «war» und «hatte». Andere Verben im Präteritum erst ab B1.1.
- Umfangs-Check: Wortzahl/Absatzzahl gemäss Längensteuerung.
- Lexik-Check: seltene Wörter durch häufigere Synonyme ersetzen (Bedeutung wahren).
- DE-CH-Check: ss statt ß; Terminologie konsistent.
- Ansprache-Check: gewählte Leseransprache durchgehend, inkl. Titel/Teaser/Glossar.

═══ REFERENZ-SÄTZE auf Niveau ${level} (als Stilvorlage) ═══
${examples}`;

    const userMessage = `Schreibe einen Text auf Niveau ${level} zum Thema «${topic}».`;

    // 4. Generate text with Claude
    const message = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return NextResponse.json(
        { error: "Unerwartete Antwort von Claude." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      text: content.text,
      level,
      topic,
      matchCount: matches.length,
      prompt: { system: systemPrompt, user: userMessage },
    });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Textgenerierung." },
      { status: 500 }
    );
  }
}
