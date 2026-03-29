import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import OpenAI from "openai";

import { createClient } from "@/utils/supabase/server";

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

const LENGTH_GUIDANCE: Record<string, string> = {
  "A1.1": "max. 3 Absätze; sehr kurze Texte (ca. 80–140 Wörter)",
  "A1.2": "max. 3–4 Absätze; kurze Texte (ca. 100–180 Wörter)",
  "A2.1": "max. 4 Absätze; kurze bis mittlere Texte (ca. 120–240 Wörter)",
  "A2.2": "max. 4–5 Absätze; mittlere Texte (ca. 150–320 Wörter)",
  "B1.1": "max. 5 Absätze; mittlere Texte (ca. 200–420 Wörter)",
  "B1.2": "max. 5–6 Absätze; mittlere bis längere Texte (ca. 250–520 Wörter)",
};

// --- Helpers to format DB niveauregeln into prompt text ---

function formatLevelDataForPrompt(level: string, data: Record<string, unknown>): string {
  const get = (key: string): string[] => {
    const v = data[key]; return Array.isArray(v) ? (v as string[]) : [];
  };
  const sub = (key: string): Record<string, string[]> => {
    const v = data[key];
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string[]>) : {};
  };
  const cmt = (key: string): Record<string, string> => {
    const v = data[key];
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, string>) : {};
  };
  const str = (key: string): string => { const v = data[key]; return typeof v === "string" ? v : ""; };

  const lines: string[] = [`NIVEAU ${level} – STRIKT EINHALTEN:`, ""];
  const push = (...args: string[]) => args.forEach((a) => lines.push(a));

  // Verbmorphologie
  const tempora = get("tempora");
  const temporaC = cmt("temporaComments");
  if (tempora.length) {
    const t = tempora.map((x) => (temporaC[x] ? `${x} (${temporaC[x]})` : x)).join("; ");
    const modiActive = get("modi");
    const genusVerbi = get("genusVerbi");
    push(`Verbmorphologie: ${t}`);
    const noTense = ["Präsens", "Präteritum", "Perfekt", "Plusquamperfekt", "Futur I", "Futur II"].filter((x) => !tempora.includes(x));
    if (noTense.length) push(`  → Tempora NICHT: ${noTense.join(", ")}`);
    const noModi = ["Konjunktiv I", "Konjunktiv II", "Imperativ"].filter((x) => !modiActive.includes(x));
    if (noModi.length) push(`  → Modi NICHT: ${noModi.join(", ")}`);
    if (!genusVerbi.includes("Vorgangspassiv") && !genusVerbi.includes("Zustandspassiv")) push("  → kein Passiv");
    push("");
  }

  // Verbklassen
  const vk = get("verbklassen");
  const vkSubs = sub("verbklassenSubs");
  const vkC = cmt("verbklassenComments");
  if (vk.length) {
    push("Verbklassen:");
    vk.forEach((k) => {
      const s = vkSubs[k] ?? [];
      const c = vkC[k] ?? "";
      push(`- ${k}${s.length ? `: ${s.join(", ")}` : ""}${c ? ` — ${c}` : ""}`);
    });
    push("");
  }

  // Kasus & Adjektiv
  const kasus = get("kasus");
  const kasusC = cmt("kasusComments");
  if (kasus.length) {
    const kt = kasus.map((k) => (kasusC[k] ? `${k} (${kasusC[k]})` : k)).join("; ");
    push(`Kasus: ${kt}`);
    const noKasus = ["Dativ", "Genitiv"].filter((k) => !kasus.includes(k));
    if (noKasus.length) push(`  → NICHT: ${noKasus.join(", ")}`);
  }
  const adjVerw = get("adjektivVerwendung");
  const adjVerwC = cmt("adjektivVerwendungComments");
  if (adjVerw.length) {
    const at = adjVerw.map((a) => (adjVerwC[a] ? `${a} (${adjVerwC[a]})` : a)).join(", ");
    push(`Adjektiv: ${at}`);
    if (!adjVerw.includes("attributiv")) push("  → KEIN attributives Adjektiv, keine Adjektivdeklination");
  }
  const steigerung = get("steigerung");
  if (steigerung.length) {
    const noSteig = ["Komparativ", "Superlativ", "Elativ"].filter((s) => !steigerung.includes(s));
    if (noSteig.length) push(`Steigerung: nur ${steigerung.join(", ")}; NICHT: ${noSteig.join(", ")}`);
  }
  push("");

  // Artikel
  const posArt = get("possessivartikel");
  const posKasus = sub("possessivartikelKasus");
  const posC = cmt("possessivartikelComments");
  const negArtC = cmt("negationsartikelComments");
  const artLines: string[] = [];
  if (get("bestimmterArtikel").length) artLines.push("bestimmter Artikel: der/die/das");
  if (get("unbestimmterArtikel").length) artLines.push(`unbestimmter Artikel: ${get("unbestimmterArtikel").join(", ")}`);
  if (get("negationsartikel").length) {
    artLines.push(`Negationsartikel: ${negArtC["erlaubt"] || "kein/keine"}`);
  } else {
    artLines.push("Negationsartikel: NICHT verwenden");
  }
  if (posArt.length) {
    posArt.forEach((pa) => {
      const k = posKasus[pa] ?? [];
      const c = posC[pa] ?? "";
      artLines.push(`Possessivartikel: nur ${k.join("/")}${c ? ` (${c})` : ""}`);
    });
  } else {
    artLines.push("Possessivartikel: NICHT verwenden");
  }
  const noArtikel: string[] = [];
  if (!get("demonstrativartikel").length) noArtikel.push("Demonstrativartikel");
  if (!get("indefinitartikel").length) noArtikel.push("Indefinitartikel");
  if (!get("interrogativartikel").length) noArtikel.push("Interrogativartikel");
  if (noArtikel.length) artLines.push(`NICHT: ${noArtikel.join(", ")}`);
  if (artLines.length) { push("Artikel:"); artLines.forEach((l) => push(`- ${l}`)); push(""); }

  // Pronomen
  const pp = get("personalpronomen");
  const ppKasus = sub("personalpronomenKasus");
  const ppC = cmt("personalpronomenComments");
  const pronLines: string[] = [];
  pp.forEach((p) => {
    const k = ppKasus[p] ?? [];
    const c = ppC[p] ?? "";
    pronLines.push(`Personalpronomen: ${k.length ? `nur ${k.join("/")}` : "alle Kasus"}${c ? ` — ${c}` : ""}`);
  });
  const noPron: string[] = [];
  if (!get("reflexivpronomen").length) noPron.push("Reflexivpronomen");
  if (!get("demonstrativpronomen").length) noPron.push("Demonstrativpronomen");
  if (!get("indefinitpronomen").length) noPron.push("Indefinitpronomen");
  if (!get("interrogativpronomen").length) noPron.push("Interrogativpronomen");
  if (!get("diversePronomen").length) noPron.push("Pronominaladverbien");
  if (pronLines.length || noPron.length) {
    push("Pronomen:");
    pronLines.forEach((l) => push(`- ${l}`));
    if (noPron.length) push(`  → NICHT: ${noPron.join(", ")}`);
    push("");
  }

  // Wortbildung
  const komp = get("komposition");
  const kompC = cmt("kompositionComments");
  const deriv = get("derivation");
  const derivSubs = sub("derivationSubs");
  const konv = get("konversion");
  const wbLines: string[] = [];
  if (komp.length) {
    wbLines.push(`Komposition: ${komp.map((k) => (kompC[k] ? `${k} (${kompC[k]})` : k)).join(", ")}`);
  }
  deriv.forEach((d) => {
    const s = derivSubs[d] ?? [];
    wbLines.push(`Derivation ${d}${s.length ? `: ${s.join(", ")}` : ""}`);
  });
  if (konv.length) wbLines.push(`Konversion: ${konv.join(", ")}`);
  if (!wbLines.length) wbLines.push("keine komplexe Wortbildung");
  push("Wortbildung:"); wbLines.forEach((l) => push(`- ${l}`)); push("");

  // Präpositionen
  const prSubs = sub("präpositionenSubs");
  const prC = cmt("präpositionenComments");
  const prEntries = Object.entries(prSubs).filter(([, v]) => v.length > 0);
  if (prEntries.length) {
    push("Präpositionen:");
    prEntries.forEach(([item, vs]) => {
      const c = prC[item] ?? "";
      push(`- ${item}: ${(vs as string[]).join(", ")}${c ? ` — ${c}` : ""}`);
    });
    push("");
  }

  // Partikeln
  const part = get("partikeln");
  const partSubs = sub("partikelSubs");
  const partC = cmt("partikelComments");
  if (part.length) {
    push("Partikeln:");
    part.forEach((p) => {
      const s = partSubs[p] ?? [];
      const c = partC[p] ?? "";
      push(`- ${p}${s.length ? `: ${s.join(", ")}` : ""}${c ? ` — ${c}` : ""}`);
    });
    push("");
  }

  // Adverbien
  const adv = get("adverbien");
  const advSubs = sub("adverbienSubs");
  const advC = cmt("adverbienComments");
  if (adv.length) {
    push("Adverbien:");
    adv.forEach((a) => {
      const s = advSubs[a] ?? [];
      const c = advC[a] ?? "";
      push(`- ${a}${s.length ? `: ${s.join(", ")}` : ""}${c ? ` — ${c}` : ""}`);
    });
    push("");
  }

  // Numeralia
  const num = get("numeralia");
  const numC = cmt("numeraliaComments");
  if (num.length) {
    push(`Zahlwörter: ${num.map((n) => (numC[n] ? `${n} (${numC[n]})` : n)).join(", ")}`, "");
  }

  // Negation
  const neg = get("negation");
  const negSubs = sub("negationSubs");
  const negC = cmt("negationComments");
  if (neg.length) {
    push("Negation:");
    neg.forEach((n) => {
      const s = negSubs[n] ?? [];
      const c = negC[n] ?? "";
      push(`- ${n}${s.length ? `: ${s.join(", ")}` : ""}${c ? ` — ${c}` : ""}`);
    });
    push("");
  }

  // Syntax
  const satz = get("satztypen");
  const satzC = cmt("satztypenComments");
  const hypo = get("hypotaxe");
  const hypoSubs = sub("hypotaxeSubs");
  const konnList = get("konnektoren");
  const konnSubs = sub("konnektorenSubs");
  const konnC = cmt("konnektorenComments");
  const para = get("parataxe");
  const paraSubs = sub("parataxeSubs");
  const maxLen = str("maximaleEmpfohleneSatzlaenge");
  const maxDepth = str("maximaleVerschachtelungstiefe");
  const komplChecks = get("satzkomplexitaetChecks");
  push("Syntax:");
  satz.forEach((s) => { const c = satzC[s] ?? ""; push(`- ${s}${c ? `: ${c}` : ""}`); });
  if (para.length) {
    push("- Parataxe (Beiordnung):");
    para.forEach((p) => { const s = paraSubs[p] ?? []; if (s.length) push(`  ${p}: ${(s as string[]).join(", ")}`); });
  }
  if (hypo.length) {
    push("- Hypotaxe (Nebensätze):");
    hypo.forEach((h) => { const s = hypoSubs[h] ?? []; push(`  ${h}${s.length ? `: ${(s as string[]).join(", ")}` : ""}`); });
  } else {
    push("- KEINE Nebensätze (Hypotaxe = 0)");
  }
  if (konnList.length) {
    push("- Konnektoren:");
    konnList.forEach((k) => {
      const s = konnSubs[k] ?? [];
      const c = konnC[k] ?? "";
      push(`  ${k}${s.length ? `: ${(s as string[]).join(", ")}` : ""}${c ? ` — ${c}` : ""}`);
    });
  }
  if (maxLen) push(`- Satzlänge: max. ${maxLen} Wörter`);
  if (maxDepth) push(`- Verschachtelungstiefe: max. ${maxDepth}`);
  if (komplChecks.length) push(`- Satzkomplexität erlaubt: ${komplChecks.join(", ")}`);
  else push("- Keine Parenthesen, keine Ellipsen");
  push("");

  return lines.join("\n").trim();
}

function formatWortliste(words: Array<{ wort: string; score: number }>): string {
  if (!words.length) return "";
  const high = words.filter((w) => w.score >= 0.6).map((w) => w.wort);
  const mid = words.filter((w) => w.score >= 0.35 && w.score < 0.6).map((w) => w.wort);
  const low = words.filter((w) => w.score >= 0.15 && w.score < 0.35).map((w) => w.wort);
  const parts: string[] = ["═══ VOKABULAR-LEITLISTE (Top-Wörter für dieses Handlungsfeld, nach Relevanz) ═══"];
  if (high.length) parts.push(`Kernvokabular: ${high.join(", ")}`);
  if (mid.length) parts.push(`Relevant: ${mid.join(", ")}`);
  if (low.length) parts.push(`Ergänzend: ${low.join(", ")}`);
  return parts.join("\n");
}

// TEXT_TYPE_RULES removed — now fetched from DB (textsorten table)

type TextsorteData = {
  is_personal: boolean;
  is_dialog: boolean;
  label: string | null;
  gruppe: string | null;
  register: string | null;
  funktion: string[] | null;
  perspektive: string | null;
  textaufbau: string[] | null;
  typische_sprachhandlungen: string[] | null;
  typische_konnektoren: string[] | null;
  textlaenge_richtwert: string | null;
  layout_merkmale: string[] | null;
  adressat: string | null;
  signalwoerter: string[] | null;
};

function buildTextsorteGuideline(data: TextsorteData | null, fallbackKey: string): string {
  if (!data) return `Textsorte «${fallbackKey}»: Schreibe einen Text dieser Textsorte mit stufengerechten Mitteln.`;

  const name = data.label || fallbackKey;
  const lines: string[] = [`Textsorte «${name}»${data.gruppe ? ` (${data.gruppe})` : ""}:`];

  if (data.register) lines.push(`- Register: ${data.register}`);
  if (data.funktion?.length) lines.push(`- Funktion: ${data.funktion.join(", ")}`);
  if (data.perspektive) lines.push(`- Perspektive/Stimme: ${data.perspektive}`);
  if (data.textaufbau?.length) lines.push(`- Textaufbau: ${data.textaufbau.join(" → ")}`);
  if (data.typische_sprachhandlungen?.length) lines.push(`- Sprachhandlungen: ${data.typische_sprachhandlungen.join(", ")}`);
  if (data.typische_konnektoren?.length) lines.push(`- Typische Konnektoren: ${data.typische_konnektoren.join(", ")}`);
  if (data.textlaenge_richtwert) lines.push(`- Typische Länge (Richtwert für diesen Texttyp, Niveauvorgaben haben Vorrang): ${data.textlaenge_richtwert}`);
  if (data.layout_merkmale?.length) lines.push(`- Layout/Formales: ${data.layout_merkmale.join(", ")}`);
  if (data.adressat) lines.push(`- Adressat: ${data.adressat}`);
  if (data.signalwoerter?.length) lines.push(`- Typische Phrasen/Signalwörter: ${data.signalwoerter.map((s) => `«${s}»`).join(", ")}`);

  return lines.join("\n");
}

// --- Types for structured HF context JSON ---

type SubdomainActor = { key: string; label: string; description: string };
type SubdomainInstitution = { key: string; label: string; role: string; url?: string | null };
type SubdomainTermEntry = { term: string; definition: string };
type SubdomainProcessData = {
  documents?: string[];
  costs?: string;
  legal_reference?: string | null;
};
type SubdomainProcess = { id: string; name: string; CH?: SubdomainProcessData; DE?: SubdomainProcessData };
type SubdomainData = {
  id: string;
  name: string;
  actors: { shared?: SubdomainActor[]; CH?: SubdomainActor[]; DE?: SubdomainActor[] };
  institutions: { CH?: SubdomainInstitution[]; DE?: SubdomainInstitution[] };
  processes?: SubdomainProcess[];
  terminology: { shared?: SubdomainTermEntry[]; CH?: SubdomainTermEntry[]; DE?: SubdomainTermEntry[] };
  common_mistakes_in_texts?: string[];
};
type HfContextJson = { handlungsfeld: { subdomains: SubdomainData[] } };

// --- Build structured context section for the prompt ---

function buildStrukturkontext(
  contextJson: HfContextJson | null,
  subdomainId: string | null,
  region: "ch" | "de"
): string {
  if (!contextJson) return "";

  const subdomains = contextJson.handlungsfeld?.subdomains ?? [];
  const subdomain =
    (subdomainId ? subdomains.find((sd) => sd.id === subdomainId) : null) ??
    subdomains[0];
  if (!subdomain) return "";

  const r = region.toUpperCase() as "CH" | "DE";
  const lines: string[] = [
    `═══ STRUKTURKONTEXT: «${subdomain.name}» ═══`,
    "Verbindliches Faktenwissen. Verwende korrekte Akteure, Dokumente und Terminologie für diesen Kontext.",
    "",
  ];

  // Actors: shared + region-specific
  const actors = [
    ...(subdomain.actors.shared ?? []),
    ...(subdomain.actors[r] ?? []),
  ];
  if (actors.length) {
    lines.push("AKTEURE:");
    actors.forEach((a) => lines.push(`- ${a.label}: ${a.description}`));
    lines.push("");
  }

  // Institutions: region-specific only
  const institutions = subdomain.institutions[r] ?? [];
  if (institutions.length) {
    lines.push(`INSTITUTIONEN (${r}):`)
    institutions.forEach((i) => lines.push(`- ${i.label}: ${i.role}`));
    lines.push("");
  }

  // Process data: documents, costs, legal reference
  const processData = subdomain.processes?.[0]?.[r];
  if (processData) {
    if (processData.documents?.length) {
      lines.push("DOKUMENTE:");
      processData.documents.forEach((d) => lines.push(`- ${d}`));
      lines.push("");
    }
    if (processData.costs) {
      lines.push(`KOSTEN: ${processData.costs}`, "");
    }
    if (processData.legal_reference) {
      lines.push(`RECHTLICHE GRUNDLAGE: ${processData.legal_reference}`, "");
    }
  }

  // Terminology: shared + region-specific
  const terms = [
    ...(subdomain.terminology.shared ?? []),
    ...(subdomain.terminology[r] ?? []),
  ];
  if (terms.length) {
    lines.push(`KORREKTE TERMINOLOGIE (${r}):`);
    terms.forEach((t) => lines.push(`- ${t.term}: ${t.definition}`));
    lines.push("");
  }

  // Common mistakes — most impactful: direct false/correct pairs
  if (subdomain.common_mistakes_in_texts?.length) {
    lines.push("HÄUFIGE FEHLER – DIESE AUSSAGEN SIND SACHLICH FALSCH – SO NICHT SCHREIBEN:");
    subdomain.common_mistakes_in_texts.forEach((m) => lines.push(`- ${m}`));
    lines.push("");
  }

  return lines.join("\n");
}

const fallbackPromptTemplate = `Du bist ein Experte für Deutsch als Fremdsprache. Du schreibst Texte für Sprachlerner auf exakt dem CEFR-Niveau {{NIVEAU}}.

═══ GLOBALE QUALITÄTSKRITERIEN ═══
- Flüssigkeit und Lesbarkeit: klare, natürliche Sätze; kein Telegrafstil; stimmiger Rhythmus.
- Kohäsion: thematische Fortschreibung, saubere Referenzen (Pronomen/Wiederaufnahmen), Konnektoren gemäss Niveau.
- Erwachsenenrelevanz: alltags-, berufs- oder gesellschaftsnah; respektvoll, inklusiv, kultursensibel.
- {{REGION}}
- Wortschatz: bevorzugt hochfrequente, konkrete Lexik; kein unnötiger Jargon.
- Fehlerfreiheit: Grammatik, Orthografie, Zeichensetzung korrekt.
- Inklusive Sprache: bevorzugt neutrale Formen («Mitarbeitende», «Lehrpersonen») oder Gender durch «:» («Mitarbeiter:innen»).
- Neutralität: keine bewertenden, romantisierenden, verniedlichenden oder moralisierenden Aussagen, es sei denn, vom Inhalt oder den Akteuren verlangt.
- WICHTIG: Der Inhalt muss logisch und realistisch sein. Vermeide widersprüchliche Aussagen. Bei Dialogen: Wer fragt, weiss die Antwort noch nicht. Wer antwortet, gibt neue Information.

═══ UMGANG MIT REALEN DATEN ═══
- Benutze ausschliesslich fiktive Firmen- und Personennamen, fiktive Adressen für Strassenangaben. Achte darauf, dass diese erwachsenengerecht und realistisch klingen.
- Du kannst reale Schweizer Ortschaften mit authentischen Postleitzahlen verwenden
- Wenn Du Mobilnummern generierst, benutze immer die Vorwahl 075 oder 074, für Festnetznummern die fiktiven Vorwahlen 036, 037, 038, 039, 042, 045, 046, 047, 048, 049, 053, 054, 057, 059

═══ {{ANSPRACHE}} ═══
{{HANDLUNGSFELD}}
{{STRUKTURKONTEXT}}
{{KONTEXTREGELN}}
═══ TEXTSORTE ═══
{{TEXTSORTE}}

═══ LÄNGENSTEUERUNG ═══
{{LAENGE}}

═══ {{NIVEAUREGELN}} ═══

{{WORTLISTE}}
═══ SPEZIFISCHE ANWEISUNGEN ═══
- Verwende Schweizer Anredeformat in Korrespondenz (Brief, E-Mail): [Anrede] Name ohne Komma, dann Leerzeile, dann Korrespondenzbeginn in Grossbuchstaben.
- Zulässige Korrespondenzanreden: «Hallo» (informell), «Guten Tag», «Guten Tag Frau [Name]…», «Guten Tag Herr [Name]…», «Hallo [Vorname]».
- Zulässige Grussformeln (angepasst an Inhalt): «Freundliche Grüsse», «Viele Grüsse», «Herzliche Grüsse», «Liebe Grüsse».

═══ KOHÄSION UND STIL ═══
- Referenz: konsistente Nennung/Ersetzung (Nomen → Pronomen/Synonym) ohne Ambiguität.
- Themenführung: pro Absatz ein klarer Fokus; am Ende kurzer Abschluss-/Ausblicksatz.
- Klang: natürliche Prosodie; keine übermässigen Wiederholungen; moderate Variation bei Satzanfängen.

═══ AUSGABEFORMAT ═══
- Titel (prägnant, 3–8 Wörter{{TITEL_NEUTRAL}})
- Untertitel/Teaser (1 Satz, max. 140 Zeichen)
- Haupttext in Absätzen (Länge passend zu Textsorte und Inhalt)
- Nur den Text liefern (keine Aufgaben, keine Meta-Erklärungen, kein Markdown)

═══ QUALITÄTSSICHERUNG (still, nicht ausgeben) ═══
- Niveau-Check: Jeder Satz erfüllt die Merkmale der Stufe (keine höheren Strukturen).
- Präteritum-Check: Bis und mit A2.2 KEINE Präteritumformen ausser «war» und «hatte». Andere Verben im Präteritum erst ab B1.1.
- Umfangs-Check: Textlänge realistisch für Textsorte und Inhalt; Richtwerte nicht überschreiten.
- Lexik-Check: seltene Wörter durch häufigere Synonyme ersetzen (Bedeutung wahren).
- DE-CH-Check: ss statt ß; Terminologie konsistent.
- Ansprache-Check: gewählte Leseransprache durchgehend, inkl. Titel und Teaser.

═══ REFERENZ-SÄTZE auf Niveau {{NIVEAU}} (als Stilvorlage) ═══
Diese Sätze dienen AUSSCHLIESSLICH als Stilvorlage für Satzbau, Wortschatz und Komplexität. Übernimm KEINE Eigennamen, Firmen- oder Markennamen daraus (z.B. Migros, Coop, Lidl, Aldi, IKEA, usw.). Verwende stattdessen fiktive Namen.
{{REFERENZSAETZE}}`;

export async function POST(request: Request) {
  const anthropic = new Anthropic();
  const openai = new OpenAI();
  try {
    const { level, topic, region, textType, handlungsfeld } = (await request.json()) as {
      level: string;
      topic: string;
      region?: "ch" | "de";
      textType?: string;
      handlungsfeld: string;
    };

    if (!level || !topic || !handlungsfeld) {
      return NextResponse.json(
        { error: "Niveau, Thema und Handlungsfeld sind erforderlich." },
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

    // Resolve Handlungsfeld name, kontextregeln, and prompt template
    let handlungsfeldName: string | null = null;
    let kontextregeln: string[] = [];
    const fetchPromises: Promise<void>[] = [];
    let promptTemplate: string | null = null;
    let textsorteData = null as TextsorteData | null;
    let niveauregelnLevelData: Record<string, unknown> | null = null;
    let topWords: Array<{ wort: string; score: number }> = [];
    let contextJson: HfContextJson | null = null;
    let matchedSubdomainId: string | null = null;

    // Fetch prompt template
    fetchPromises.push(
      Promise.resolve(
        supabase
          .from("prompt_templates")
          .select("template")
          .eq("id", "default")
          .single()
      ).then(({ data }) => {
        if (data) promptTemplate = data.template;
      })
    );

    // Fetch textsorte from DB
    const selectedTextType = textType ?? "email";
    fetchPromises.push(
      Promise.resolve(
        supabase
          .from("textsorten")
          .select("is_personal, is_dialog, label, gruppe, register, funktion, perspektive, textaufbau, typische_sprachhandlungen, typische_konnektoren, textlaenge_richtwert, layout_merkmale, adressat, signalwoerter")
          .eq("key", selectedTextType)
          .single()
      ).then(({ data }) => {
        if (data) textsorteData = data as unknown as TextsorteData;
      })
    );

    // Fetch niveauregeln from DB for this level
    fetchPromises.push(
      Promise.resolve(
        supabase
          .from("niveauregeln")
          .select("data")
          .eq("id", "default")
          .single()
      ).then(({ data }) => {
        if (data?.data && typeof data.data === "object") {
          const byLevel = data.data as Record<string, Record<string, unknown>>;
          const levelData = byLevel[level];
          if (levelData && typeof levelData === "object") niveauregelnLevelData = levelData;
        }
      })
    );

    if (handlungsfeld) {
      fetchPromises.push(
        Promise.all([
          Promise.resolve(
            supabase
              .from("handlungsfelder")
              .select("name, context_json")
              .eq("code", handlungsfeld)
              .single()
          ),
          Promise.resolve(
            supabase
              .from("kontextregeln")
              .select("regel")
              .eq("handlungsfeld_code", handlungsfeld)
              .order("sort_order")
          ),
          // Fetch top-60 scored words for this HF + level
          Promise.resolve(
            supabase
              .from("wortliste_relevanz")
              .select("score, wortlisten!inner(wort, level)")
              .eq("handlungsfeld_code", handlungsfeld)
              .eq("wortlisten.level", level)
              .order("score", { ascending: false })
              .limit(60)
          ),
        ]).then(([{ data: hf }, { data: regeln }, { data: words }]) => {
          if (hf) {
            handlungsfeldName = hf.name;
            if (hf.context_json) contextJson = hf.context_json as unknown as HfContextJson;
          }
          if (regeln?.length) kontextregeln = regeln.map((r: { regel: string }) => r.regel);
          if (Array.isArray(words)) {
            topWords = words.map((row) => {
              const w = row.wortlisten as unknown as { wort: string; level: string };
              return { wort: w.wort, score: Number(row.score) };
            });
          }
        })
      );
    }

    await Promise.all(fetchPromises);

    // Match topic embedding → closest subdomain within this HF (reuses already-computed embedding)
    if (contextJson && handlungsfeld) {
      const { data: subdomainMatch } = await supabase.rpc("match_hf_subdomain", {
        query_embedding: JSON.stringify(queryEmbedding),
        p_hf_code: handlungsfeld,
        match_threshold: 0.0,
        match_count: 1,
      });
      if (subdomainMatch?.[0]) matchedSubdomainId = subdomainMatch[0].id as string;
    }

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

    const regionRule = isSwiss
      ? "DE-CH-Standard: ss statt ß; CH-Varianz zulässig («Spital», «Tram», «Billett», «Velo», «Trottoir», «parkieren»)."
      : "Bundesdeutsches Hochdeutsch mit ß gemäss neuer Rechtschreibung.";

    // Use DB flags for personal/dialog, with regex fallback for freeform CSV values
    const personalPatterns = /dialog|erz[äa]hl|tagebuch|e-?mail|brief|nachricht|interview|gespr[äa]ch|chat|sms|messenger/i;
    const isPersonalTextType = textsorteData?.is_personal ?? personalPatterns.test(selectedTextType);
    const isDialog = textsorteData?.is_dialog ?? /dialog|interview|gespr[äa]ch/i.test(selectedTextType);

    const addressRule = isPersonalTextType
      ? `Leseransprache:
- Wähle die Perspektive, die zur Textsorte passt (Ich-Form für Tagebuch/E-Mail/Brief, Ich/Du/Er-Sie für Erzählung, Sprecherwechsel für Dialog usw.).
- Keine erzwungene «man»-Formulierung; natürliche Pronomen verwenden.
- A1.1/A1.2: kein Imperativ.`
      : `Leseransprache «neutral-man» (für Sachtexte, Beschreibungen, Berichte, Anleitungen):
- Pronomen/Beugung: man, Verbform 3. Person Singular («man kann…», «man bringt… zurück»).
- Possessiv auf A1: vermeide «sein/ihr» → nutze «die eigene …/das eigene …» oder Umschreibungen.
- Keine direkte Anrede, keine Leserfragen.
- A1.1/A1.2: kein Imperativ; bei «neutral-man» möglichst ohne Passiv, stattdessen «man + Modalverb».
- Durchgehend «man» in Titel, Teaser und Text.`;

    const textTypeRule = buildTextsorteGuideline(textsorteData, selectedTextType);
    // Use DB niveauregeln if available, otherwise fall back to hardcoded rules
    const niveauregelnText = niveauregelnLevelData
      ? formatLevelDataForPrompt(level, niveauregelnLevelData)
      : (LEVEL_RULES[level] ?? `NIVEAU ${level}: Bitte Niveauregeln im Admin konfigurieren.`);
    const wortlisteText = formatWortliste(topWords);
    const lengthRule = LENGTH_GUIDANCE[level];

    const handlungsfeldSection = handlungsfeldName
      ? `═══ HANDLUNGSFELD ═══\nDer Text bewegt sich im Handlungsfeld «${handlungsfeldName}». Wähle Situationen, Orte und Vokabular, die zu diesem Handlungsfeld passen.`
      : "";

    const kontextregelnSection = kontextregeln.length
      ? `═══ KONTEXTREGELN ═══\nDie folgenden Fakten sind Hintergrundwissen über die Schweiz. Sie informieren über Realität, aber alle Firmen-, Marken- und Institutionsnamen im generierten Text müssen trotzdem fiktiv sein (Ausnahme: Behörden, Verkehrsbetriebe, offizielle Stellen wie SBB, Post, RAV, Krankenkassen-Kategorie ohne Eigenname):\n${kontextregeln.map((r) => `- ${r}`).join("\n")}`
      : "";

    const strukturkontextSection = buildStrukturkontext(
      contextJson,
      matchedSubdomainId,
      (region ?? "ch") as "ch" | "de"
    );

    const lengthSection = isDialog
      ? "Für Dialoge gilt die Längensteuerung nicht – die Länge richtet sich nach dem natürlichen Dialogverlauf und der Pragmatik."
      : `Die Textlänge richtet sich primär nach Textsorte und Inhalt. Ein kurzes Anliegen (z. B. E-Mail wegen defekter Heizung) bleibt auch auf höheren Niveaus kurz – nur die sprachliche Komplexität steigt mit dem Niveau, nicht die Länge.\nRichtwerte für Niveau ${level}: ${lengthRule}.\nÜberschreite diese Richtwerte nicht, unterschreite sie aber gerne, wenn der Inhalt es verlangt.`;

    const titelNeutral = isPersonalTextType ? "" : "; neutral formulieren";

    // Resolve shortcodes in prompt template
    const shortcodes: Record<string, string> = {
      "{{NIVEAU}}": level,
      "{{REGION}}": regionRule,
      "{{ANSPRACHE}}": addressRule,
      "{{HANDLUNGSFELD}}": handlungsfeldSection,
      "{{STRUKTURKONTEXT}}": strukturkontextSection,
      "{{KONTEXTREGELN}}": kontextregelnSection,
      "{{TEXTSORTE}}": textTypeRule,
      "{{LAENGE}}": lengthSection,
      "{{NIVEAUREGELN}}": niveauregelnText,
      "{{WORTLISTE}}": wortlisteText,
      "{{REFERENZSAETZE}}": examples,
      "{{TITEL_NEUTRAL}}": titelNeutral,
    };

    // Use DB template or fall back to hardcoded default
    const template = promptTemplate ?? fallbackPromptTemplate;
    const resolvedPrompt = Object.entries(shortcodes).reduce(
      (prompt, [key, value]) => prompt.replaceAll(key, value),
      template
    );

    // Strip any existing UMGANG MIT REALEN DATEN section from the DB prompt (may be soft/outdated version)
    // and always replace with the hardened enforcement version containing the explicit VERBOTEN list
    const REALE_DATEN_RULE = `\n\n═══ UMGANG MIT REALEN DATEN ═══\n- Benutze ausschliesslich fiktive Firmen- und Personennamen, fiktive Adressen für Strassenangaben. Achte darauf, dass diese erwachsenengerecht und realistisch klingen.\n- VERBOTEN: echte Firmen- oder Markennamen wie Migros, Coop, Lidl, Aldi, Denner, Manor, H&M, Zara, IKEA, McDonald's, Starbucks, Volg, Spar oder ähnliche. Erfinde stattdessen zeitgemässe, glaubwürdige fiktive Namen – kurz, modern, wie echte heutige Marken. Keine Familiennamen als Firmennamen. Beispiele nach Branche: Lebensmittel: «Frischwerk», «Vivo», «Netto Frisch»; Kleidung: «Mode & Co.», «Colorit», «Fashpoint»; Bäckerei/Café: «Goldkorn», «Bäckerei Zeitlos», «Café Central»; Restaurant: «Zum Brunnen», «Trattoria Sole», «GoodBite»; Möbel/Einrichtung: «Wohnwelt», «Raumzeit», «Einrichtungshaus Nova».\n- Du kannst reale Schweizer Ortschaften mit authentischen Postleitzahlen verwenden.\n- Wenn Du Mobilnummern generierst, benutze immer die Vorwahl 075 oder 074, für Festnetznummern die fiktiven Vorwahlen 036, 037, 038, 039, 042, 045, 046, 047, 048, 049, 053, 054, 057, 059.`;
    const promptWithoutRealeData = resolvedPrompt.replace(
      /\n*═{3} UMGANG MIT REALEN DATEN ═{3}[\s\S]*?(?=\n═{3}|\n*$)/,
      ""
    );
    const systemPrompt = promptWithoutRealeData + REALE_DATEN_RULE;

    const userMessage = `Schreibe einen Text auf Niveau ${level} zum Thema «${topic}»${handlungsfeldName ? ` im Handlungsfeld «${handlungsfeldName}»` : ""}. Erfinde einen kreativen, passenden Titel für den Text. Gib ausschliesslich den Titel in der ersten Zeile und danach den Text zurück – ohne Einleitung, Erklärung, Kommentar oder sonstige Zusätze.`;

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

    const rawText = content.text.trim();
    const newlineIndex = rawText.indexOf("\n");
    const title = newlineIndex !== -1 ? rawText.slice(0, newlineIndex).trim() : "";
    const text = newlineIndex !== -1 ? rawText.slice(newlineIndex + 1).trim() : rawText;

    // 5. Persist the generation (best-effort, non-blocking)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("textgenerator_generations").insert({
        user_id: user.id,
        level,
        topic,
        region: region ?? "ch",
        text_type: textType ?? "",
        handlungsfeld,
        title: title || null,
        text,
        match_count: matches.length,
        prompt_system: systemPrompt,
        prompt_user: userMessage,
      });
    }

    return NextResponse.json({
      title,
      text,
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
