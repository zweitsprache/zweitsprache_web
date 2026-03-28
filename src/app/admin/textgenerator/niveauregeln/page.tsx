"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMounted } from "@/hooks/use-mounted";

const LEVELS = [
  "A1.1",
  "A1.2",
  "A2.1",
  "A2.2",
  "B1.1",
  "B1.2",
  "B2.1",
  "B2.2",
] as const;

type Level = (typeof LEVELS)[number];

const SATZTYPEN = [
  "Aussagesatz: Verb-Zweit-Stellung",
  "Fragesatz: Entscheidungsfrage",
  "Fragesatz: Ergänzungsfrage",
  "Fragesatz: rhetorische Frage",
  "Aufforderungssatz",
  "Wunschsatz",
  "Ausrufesatz",
] as const;

const FELDERMODELL = [
  "Vorfeld",
  "Linke Satzklammer",
  "Mittelfeld",
  "Rechte Satzklammer",
  "Nachfeld",
] as const;

const FELDERMODELL_SUBOPTIONS: Record<string, readonly string[]> = {
  Vorfeld: ["Subjekt", "Adverbial", "Objekt", "Korrelat"],
  "Linke Satzklammer": ["finites Verb", "Hilfsverb", "Modalverb"],
  Mittelfeld: ["Anordnung der Satzglieder", "Wackernagel-Position", "Thema-Rhema-Gliederung"],
  "Rechte Satzklammer": ["infinite Verbteile", "Verbpartikel"],
  Nachfeld: ["Extraposition", "Relativsätze", "Vergleiche", "schwere Konstituenten"],
};

const SATZGLIEDER = [
  "Subjekt",
  "Prädikat",
  "Objekte",
  "Adverbialbestimmungen",
  "Prädikativ",
  "Attribute",
] as const;

const SATZGLIEDER_SUBOPTIONS: Record<string, readonly string[]> = {
  Prädikat: ["einteilig", "mehrteilig"],
  Objekte: ["Akkusativobjekt", "Dativobjekt", "Genitivobjekt", "Präpositionalobjekt"],
  Adverbialbestimmungen: [
    "temporal",
    "kausal",
    "modal",
    "lokal",
    "konzessiv",
    "konditional",
    "final",
    "konsekutiv",
  ],
  Prädikativ: ["Subjektsprädikativ", "Objektsprädikativ"],
  Attribute: [
    "Adjektivattribut",
    "Genitivattribut",
    "Präpositionalattribut",
    "Relativsatz als Attribut",
    "Apposition",
  ],
};

const PARATAXE = [
  "Kopulativ",
  "Disjunktiv",
  "Adversativ",
  "Kausal: denn",
  "Konsekutiv (Konjunktionaladverbien)",
] as const;

const PARATAXE_SUBOPTIONS: Record<string, readonly string[]> = {
  Kopulativ: ["sowie", "sowohl … als auch", "und"],
  Disjunktiv: ["entweder … oder", "oder"],
  Adversativ: ["aber", "allerdings", "doch", "jedoch", "sondern"],
  "Konsekutiv (Konjunktionaladverbien)": ["also", "daher", "deshalb", "folglich", "infolgedessen"],
};

const HYPOTAXE = [
  "Temporalsätze",
  "Kausalsätze",
  "Konditionalsätze",
  "Konzessivsätze",
  "Finalsätze",
  "Konsekutivsätze",
  "Modalsätze",
  "Adversativsätze",
  "Komparativsätze",
  "Relativsätze",
  "Subjekt- und Objektsätze",
] as const;

const HYPOTAXE_SUBOPTIONS: Record<string, readonly string[]> = {
  Temporalsätze: ["als", "bevor", "bis", "ehe", "nachdem", "seitdem", "sobald", "solange", "während", "wenn"],
  Kausalsätze: ["da", "weil", "zumal"],
  Konditionalsätze: ["falls", "sofern", "soweit", "wenn"],
  Konzessivsätze: ["auch wenn", "obgleich", "obschon", "obwohl", "wenn auch", "wenngleich"],
  Finalsätze: ["auf dass", "damit", "um … zu"],
  Konsekutivsätze: ["so … dass", "sodass"],
  Modalsätze: ["anstatt dass", "dadurch dass", "indem", "ohne dass"],
  Adversativsätze: ["während", "wohingegen"],
  Komparativsätze: ["als", "als ob", "als wenn", "je … desto/umso", "wie"],
  Relativsätze: ["der/die/das", "was", "welcher", "wer", "wo"],
  "Subjekt- und Objektsätze": ["dass", "ob", "Infinitiv mit zu", "indirekte Fragen"],
};

const SATZKOMPLEXITAET_CHECKS = ["Parenthesen / Einschübe", "Ellipsen"] as const;

const KONNEKTOREN = [
  "Konjunktionen",
  "Konjunktionaladverbien",
  "Mehrteilige Konnektoren",
  "Textorganisierende Konnektoren",
] as const;

const KONNEKTOREN_SUBOPTIONS: Record<string, readonly string[]> = {
  Konjunktionen: [
    "aber",
    "allein",
    "beziehungsweise",
    "denn",
    "doch",
    "jedoch",
    "oder",
    "sondern",
    "und",
  ],
  Konjunktionaladverbien: [
    "allerdings",
    "also",
    "anschliessend",
    "ausserdem",
    "dagegen",
    "daher",
    "danach",
    "dann",
    "darüber hinaus",
    "darum",
    "demnach",
    "demzufolge",
    "dennoch",
    "deshalb",
    "deswegen",
    "ferner",
    "folglich",
    "gleichwohl",
    "hingegen",
    "immerhin",
    "indessen",
    "infolgedessen",
    "nichtsdestotrotz",
    "nichtsdestoweniger",
    "schliesslich",
    "somit",
    "stattdessen",
    "trotzdem",
    "überdies",
    "vielmehr",
    "währenddessen",
    "zudem",
    "zuletzt",
    "zunächst",
  ],
  "Mehrteilige Konnektoren": [
    "einerseits … andererseits",
    "entweder … oder",
    "je … desto/umso",
    "nicht nur … sondern auch",
    "sowohl … als auch",
    "teils … teils",
    "weder … noch",
    "zwar … aber",
  ],
  "Textorganisierende Konnektoren": [
    "abschliessend",
    "ebenso",
    "erstens / zweitens / drittens",
    "gleichfalls",
    "im Gegensatz dazu",
    "insgesamt",
    "zusammenfassend",
    "zum einen / zum anderen",
  ],
};

const TEMPORA = [
  "Präsens",
  "Präteritum",
  "Perfekt",
  "Plusquamperfekt",
  "Futur I",
  "Futur II",
] as const;

const MODI = [
  "Indikativ",
  "Konjunktiv I",
  "Konjunktiv II",
  "Imperativ",
] as const;

const GENUS_VERBI = [
  "Aktiv",
  "Vorgangspassiv",
  "Zustandspassiv",
  "Rezipientenpassiv",
] as const;

const KASUS = ["Nominativ", "Akkusativ", "Dativ", "Genitiv"] as const;

const DEKLINATIONSKLASSEN = [
  "stark",
  "schwach",
  "gemischt",
] as const;

const ADJEKTIV_DEKLINATION = [
  "starke Deklination",
  "schwache Deklination",
  "gemischte Deklination",
] as const;

const STEIGERUNG = ["Positiv", "Komparativ", "Superlativ", "Elativ"] as const;

const ADJEKTIV_VERWENDUNG = ["attributiv", "prädikativ", "adverbial"] as const;

const BESTIMMTER_ARTIKEL = [
  "bestimmt",
  "unbestimmt",
  "Negationsartikel",
  "kontextgebundene Nullartikel",
] as const;

const UNBESTIMMTER_ARTIKEL = ["ein", "eine"] as const;

const NEGATIONSARTIKEL = ["erlaubt"] as const;

const DEMONSTRATIVARTIKEL = ["dieser", "jener", "derjenige", "derselbe"] as const;

const POSSESSIVARTIKEL = ["Possessivartikel"] as const;

const INDEFINITARTIKEL = ["mancher", "jeder", "alle", "einige", "kein", "irgendein"] as const;

const INTERROGATIVARTIKEL = ["welcher", "was für ein"] as const;

const PRONOMEN_KASUS = ["Nominativ", "Akkusativ", "Dativ", "Genitiv"] as const;

const DIVERSE_PRONOMEN = ["Reziprokpronomen", "Pronominaladverbien"] as const;

const KOMPOSITION = [
  "Determinativkomposita",
  "Kopulativkomposita",
  "Zusammenrückungen",
] as const;

const DERIVATION = [
  "Präfixbildung",
  "Suffixbildung",
  "Zirkumfixbildung",
] as const;

const DERIVATION_SUBOPTIONS: Record<string, readonly string[]> = {
  Präfixbildung: ["un-", "ver-", "be-", "zer-"],
  Suffixbildung: ["-ung", "-heit", "-keit", "-lich", "-bar", "-isch"],
  Zirkumfixbildung: ["ge-…-t", "ge-…-en"],
};

const KONVERSION = [
  "Substantivierung",
  "Verbalisierung",
] as const;

const KONVERSION_SUBOPTIONS: Record<string, readonly string[]> = {
  Substantivierung: ["Verben", "Adjektive"],
};

const FUGENMORPHEME = ["-s-", "-n-", "-en-", "-er-", "-e-"] as const;

const INFINITE_VERBFORMEN = [
  "Partizip I",
  "Infinitiv mit zu",
  "erweiterter Infinitiv",
] as const;

const VERBKLASSEN = [
  "syntaktische Funktion",
  "Valenz / Wertigkeit",
  "Trennbarkeit / Verbpartikeln",
  "Flexionsklasse",
  "Reflexivität",
  "Aktionsart (lexikalischer Aspekt)",
] as const;

const VERBKLASSEN_SUBOPTIONS: Record<string, readonly string[]> = {
  "syntaktische Funktion": [
    "Vollverben",
    "Hilfsverben",
    "Modalverben",
    "Modalitätsverben",
    "Kopulaverben",
    "Funktionsverben",
  ],
  "Valenz / Wertigkeit": [
    "avalent",
    "intransitiv",
    "transitiv",
    "mit Präpositionalobjekt",
    "mit Genitivobjekt",
  ],
  "Trennbarkeit / Verbpartikeln": [
    "trennbar",
    "untrennbar",
    "ambig",
  ],
  "Flexionsklasse": [
    "stark",
    "schwach",
    "gemischt",
    "unregelmässig",
  ],
  "Reflexivität": [
    "echt",
    "unecht",
    "reziprok",
  ],
  "Aktionsart (lexikalischer Aspekt)": [
    "Durativ / atelisch",
    "Telisch / resultativ",
    "Inchoativ / ingressiv",
    "Terminativ / egressiv",
    "Iterativ / frequentativ",
    "Semelfaktiv / punktuell",
    "Kausativ",
  ],
};

const PRÄPOSITIONEN_GROUPS: Record<string, readonly string[]> = {
  "Nach regiertem Kasus": [
    "Akkusativpräpositionen",
    "Dativpräpositionen",
    "Genitivpräpositionen",
    "Wechselpräpositionen (Dativ/Akkusativ)",
  ],
  "Nach semantischer Funktion": [
    "Lokal",
    "Temporal",
    "Kausal",
    "Modal",
    "Final",
    "Konzessiv",
    "Konditional",
    "Substitutiv/Adversativ",
  ],
  "Nach Stellung": [
    "Vorangestellt (Präposition)",
    "Nachgestellt (Postposition)",
    "Umklammernd (Zirkumposition)",
  ],
  "Morphologische Struktur": [
    "Primär",
    "Sekundäre (abgeleitete) Präpositionen",
    "Präpositionale Mehrworteinheiten",
  ],
};

const PRÄPOSITIONEN_SUBOPTIONS: Record<string, readonly string[]> = {
  "Akkusativpräpositionen": ["bis", "durch", "entlang", "für", "gegen", "ohne", "um", "wider"],
  "Dativpräpositionen": ["ab", "aus", "ausser", "bei", "entsprechend", "fern", "gemäss", "gegenüber", "mit", "mitsamt", "nach", "nahe", "nebst", "samt", "seit", "von", "zu", "zufolge", "zuliebe"],
  "Genitivpräpositionen": ["(an)statt", "abzüglich", "angesichts", "anlässlich", "aufgrund", "ausschliesslich", "ausserhalb", "beiderseits", "bezüglich", "diesseits", "einschliesslich", "halber", "hinsichtlich", "infolge", "inmitten", "innerhalb", "jenseits", "kraft", "laut", "mangels", "mithilfe", "mittels", "oberhalb", "seitens", "trotz", "um … willen", "unbeschadet", "ungeachtet", "unterhalb", "unweit", "vermöge", "vorbehaltlich", "während", "wegen", "zugunsten", "zulasten", "zuungunsten", "zuzüglich"],
  "Wechselpräpositionen (Dativ/Akkusativ)": ["an", "auf", "hinter", "in", "neben", "über", "unter", "vor", "zwischen"],
  "Lokal": ["an", "auf", "aus", "ausserhalb", "bei", "bis", "durch", "diesseits", "entlang", "gegen", "gegenüber", "hinter", "in", "innerhalb", "jenseits", "nach", "neben", "über", "um", "unter", "unterhalb", "unweit", "von", "vor", "zu", "zwischen", "oberhalb"],
  "Temporal": ["ab", "an", "auf", "aus", "bei", "binnen", "bis", "gegen", "in", "innerhalb", "nach", "seit", "über", "um", "von", "vor", "während", "zwischen"],
  "Kausal": ["angesichts", "aufgrund", "aus", "dank", "halber", "infolge", "kraft", "mangels", "ob", "vor", "wegen", "zufolge"],
  "Modal": ["auf", "aus", "ausser", "bis auf", "durch", "für", "gemäss", "gegen", "in", "laut", "mit", "mittels", "mithilfe", "nach", "ohne", "samt", "unter", "von", "wider", "zu"],
  "Final": ["für", "um … willen", "zu", "zugunsten"],
  "Konzessiv": ["trotz", "unbeschadet", "ungeachtet"],
  "Konditional": ["bei", "ohne", "unter"],
  "Substitutiv/Adversativ": ["anstatt", "anstelle", "für", "gegen", "statt"],
  "Vorangestellt (Präposition)": ["für", "mit", "von", "zu"],
  "Nachgestellt (Postposition)": ["entlang", "gegenüber", "halber", "nach", "wegen", "zufolge", "zuliebe"],
  "Umklammernd (Zirkumposition)": ["um … herum", "um … willen", "von … an", "von … aus", "von … wegen"],
  "Primär": ["an", "auf", "aus", "bei", "durch", "für", "in", "mit", "nach", "um", "von", "vor", "zu"],
  "Sekundäre (abgeleitete) Präpositionen": ["anhand", "anstelle", "aufgrund", "infolge", "mithilfe", "zugunsten"],
  "Präpositionale Mehrworteinheiten": ["auf der Grundlage von", "im Gegensatz zu", "im Hinblick auf", "im Vergleich zu", "im Zuge", "in Anbetracht", "in Bezug auf", "mit Ausnahme von"],
};

const PARTIKELN = [
  "Modalpartikeln / Abtönungspartikeln",
  "Gradpartikeln",
  "Fokuspartikeln",
  "Intensivpartikeln",
  "Gesprächspartikeln / Responsive",
] as const;

const PARTIKELN_SUBOPTIONS: Record<string, readonly string[]> = {
  "Modalpartikeln / Abtönungspartikeln": ["bloss", "denn", "doch", "eben", "eigentlich", "etwa", "halt", "ja", "mal", "ruhig", "schon", "vielleicht", "wohl"],
  "Gradpartikeln": ["äusserst", "besonders", "ein bisschen", "etwas", "fast", "genug", "höchst", "kaum", "sehr", "ziemlich", "zu"],
  "Fokuspartikeln": ["auch", "ausgerechnet", "bereits", "erst", "gerade", "nicht einmal", "noch", "nur", "selbst", "sogar"],
  "Intensivpartikeln": ["absolut", "echt", "mega", "richtig", "super", "total"],
  "Gesprächspartikeln / Responsive": ["ach so", "doch", "genau", "ja", "na ja", "nein", "okay", "tja"],
};

const ADVERBIEN = [
  "Temporaladverbien",
  "Lokaladverbien",
  "Modaladverbien",
  "Kausaladverbien",
  "Kommentaradverbien",
] as const;

const ADVERBIEN_SUBOPTIONS: Record<string, readonly string[]> = {
  "Temporaladverbien": ["bereits", "bald", "damals", "danach", "dann", "gestern", "gerade", "heute", "immer", "inzwischen", "jetzt", "manchmal", "meistens", "morgen", "nie", "nun", "noch", "oft", "schliesslich", "schon", "selten", "vorher", "zuerst"],
  "Lokaladverbien": ["da", "dahin", "dorthin", "dort", "drinnen", "draussen", "her", "hier", "hierher", "hin", "hinten", "irgendwo", "links", "nirgends", "oben", "rechts", "unten", "überall", "vorne", "weg"],
  "Modaladverbien": ["allein", "anders", "gern(e)", "irgendwie", "so", "umsonst", "vergeblich", "zusammen"],
  "Kausaladverbien": ["daher", "darum", "deshalb", "deswegen"],
};

const NUMERALIA = [
  "Kardinalzahlen",
  "Ordinalzahlen",
  "Bruchzahlen",
  "Vervielfältigungszahlen",
  "Unbestimmte Zahlwörter",
] as const;

const NEGATION_ITEMS = [
  "Negationsmittel",
  "Stellung von nicht",
] as const;

const NEGATION_SUBOPTIONS: Record<string, readonly string[]> = {
  "Negationsmittel": ["kein", "keinesfalls", "keineswegs", "nicht", "nichts", "nie/niemals", "niemand", "nirgends/nirgendwo", "weder … noch"],
  "Stellung von nicht": ["Satznegation", "Sondernegation", "relative Position"],
};

type CategoryKey =
  | "tempora"
  | "modi"
  | "genusVerbi"
  | "infiniteVerbformen"
  | "kasus"
  | "deklinationsklassen"
  | "adjektivDeklination"
  | "steigerung"
  | "adjektivVerwendung"
  | "bestimmterArtikel"
  | "unbestimmterArtikel"
  | "negationsartikel"
  | "demonstrativartikel"
  | "possessivartikel"
  | "indefinitartikel"
  | "interrogativartikel"
  | "personalpronomen"
  | "reflexivpronomen"
  | "demonstrativpronomen"
  | "indefinitpronomen"
  | "interrogativpronomen"
  | "possessivpronomen"
  | "diversePronomen"
  | "komposition"
  | "derivation"
  | "konversion"
  | "fugenmorpheme"
  | "satztypen"
  | "feldermodell"
  | "satzglieder"
  | "parataxe"
  | "hypotaxe"
  | "satzkomplexitaetChecks"
  | "konnektoren"
  | "verbklassen"
  | "präpositionen"
  | "partikeln"
  | "adverbien"
  | "numeralia"
  | "negation";

type NumberFieldKey =
  | "maximaleVerschachtelungstiefe"
  | "maximaleEmpfohleneSatzlaenge";

type CommentKey =
  | "temporaComments"
  | "modiComments"
  | "genusVerbiComments"
  | "infiniteVerbformenComments"
  | "kasusComments"
  | "deklinationsklassenComments"
  | "adjektivDeklinationComments"
  | "steigerungComments"
  | "adjektivVerwendungComments"
  | "bestimmterArtikelComments"
  | "unbestimmterArtikelComments"
  | "negationsartikelComments"
  | "demonstrativartikelComments"
  | "possessivartikelComments"
  | "indefinitartikelComments"
  | "interrogativartikelComments"
  | "personalpronomenComments"
  | "reflexivpronomenComments"
  | "demonstrativpronomenComments"
  | "indefinitpronomenComments"
  | "interrogativpronomenComments"
  | "possessivpronomenComments"
  | "diversePronomenComments"
  | "kompositionComments"
  | "derivationComments"
  | "konversionComments"
  | "fugenmorphemeComments"
  | "satztypenComments"
  | "feldermodellComments"
  | "satzgliederComments"
  | "parataxeComments"
  | "hypotaxeComments"
  | "satzkomplexitaetComments"
  | "konnektorenComments"
  | "verbklassenComments"
  | "präpositionenComments"
  | "partikelComments"
  | "adverbienComments"
  | "numeraliaComments"
  | "negationComments";

type KasusGroupCategoryKey =
  | "personalpronomen"
  | "reflexivpronomen"
  | "demonstrativpronomen"
  | "indefinitpronomen"
  | "interrogativpronomen"
  | "possessivpronomen";

type KasusGroupMapKey =
  | "personalpronomenKasus"
  | "reflexivpronomenKasus"
  | "demonstrativpronomenKasus"
  | "indefinitpronomenKasus"
  | "interrogativpronomenKasus"
  | "possessivpronomenKasus";

type ArtikelCategoryKey =
  | "demonstrativartikel"
  | "possessivartikel"
  | "indefinitartikel"
  | "interrogativartikel";

type ArtikelKasusMapKey =
  | "demonstrativartikelKasus"
  | "possessivartikelKasus"
  | "indefinitartikelKasus"
  | "interrogativartikelKasus";

type LevelData = {
  tempora: string[];
  temporaComments: Record<string, string>;
  modi: string[];
  modiComments: Record<string, string>;
  genusVerbi: string[];
  genusVerbiComments: Record<string, string>;
  infiniteVerbformen: string[];
  infiniteVerbformenComments: Record<string, string>;
  kasus: string[];
  kasusComments: Record<string, string>;
  deklinationsklassen: string[];
  deklinationsklassenComments: Record<string, string>;
  adjektivDeklination: string[];
  adjektivDeklinationComments: Record<string, string>;
  steigerung: string[];
  steigerungComments: Record<string, string>;
  adjektivVerwendung: string[];
  adjektivVerwendungComments: Record<string, string>;
  bestimmterArtikel: string[];
  bestimmterArtikelComments: Record<string, string>;
  unbestimmterArtikel: string[];
  unbestimmterArtikelComments: Record<string, string>;
  negationsartikel: string[];
  negationsartikelComments: Record<string, string>;
  demonstrativartikel: string[];
  demonstrativartikelKasus: Record<string, string[]>;
  demonstrativartikelComments: Record<string, string>;
  possessivartikel: string[];
  possessivartikelKasus: Record<string, string[]>;
  possessivartikelComments: Record<string, string>;
  indefinitartikel: string[];
  indefinitartikelKasus: Record<string, string[]>;
  indefinitartikelComments: Record<string, string>;
  interrogativartikel: string[];
  interrogativartikelKasus: Record<string, string[]>;
  interrogativartikelComments: Record<string, string>;
  personalpronomen: string[];
  personalpronomenKasus: Record<string, string[]>;
  personalpronomenComments: Record<string, string>;
  reflexivpronomen: string[];
  reflexivpronomenKasus: Record<string, string[]>;
  reflexivpronomenComments: Record<string, string>;
  demonstrativpronomen: string[];
  demonstrativpronomenKasus: Record<string, string[]>;
  demonstrativpronomenComments: Record<string, string>;
  indefinitpronomen: string[];
  indefinitpronomenKasus: Record<string, string[]>;
  indefinitpronomenComments: Record<string, string>;
  interrogativpronomen: string[];
  interrogativpronomenKasus: Record<string, string[]>;
  interrogativpronomenComments: Record<string, string>;
  possessivpronomen: string[];
  possessivpronomenKasus: Record<string, string[]>;
  possessivpronomenComments: Record<string, string>;
  diversePronomen: string[];
  diversePronomenComments: Record<string, string>;
  komposition: string[];
  kompositionComments: Record<string, string>;
  derivation: string[];
  derivationSubs: Record<string, string[]>;
  derivationComments: Record<string, string>;
  konversion: string[];
  konversionSubs: Record<string, string[]>;
  konversionComments: Record<string, string>;
  fugenmorpheme: string[];
  fugenmorphemeComments: Record<string, string>;
  verbklassen: string[];
  verbklassenSubs: Record<string, string[]>;
  verbklassenComments: Record<string, string>;
  präpositionen: string[];
  präpositionenSubs: Record<string, string[]>;
  präpositionenComments: Record<string, string>;
  partikeln: string[];
  partikelSubs: Record<string, string[]>;
  partikelComments: Record<string, string>;
  adverbien: string[];
  adverbienSubs: Record<string, string[]>;
  adverbienComments: Record<string, string>;
  numeralia: string[];
  numeraliaSubs: Record<string, string[]>;
  numeraliaComments: Record<string, string>;
  negation: string[];
  negationSubs: Record<string, string[]>;
  negationComments: Record<string, string>;
  satztypen: string[];
  satztypenComments: Record<string, string>;
  feldermodell: string[];
  feldermodellSubs: Record<string, string[]>;
  feldermodellComments: Record<string, string>;
  satzglieder: string[];
  satzgliederSubs: Record<string, string[]>;
  satzgliederComments: Record<string, string>;
  parataxe: string[];
  parataxeSubs: Record<string, string[]>;
  parataxeComments: Record<string, string>;
  hypotaxe: string[];
  hypotaxeSubs: Record<string, string[]>;
  hypotaxeComments: Record<string, string>;
  maximaleVerschachtelungstiefe: string;
  maximaleEmpfohleneSatzlaenge: string;
  satzkomplexitaetChecks: string[];
  satzkomplexitaetComments: Record<string, string>;
  konnektoren: string[];
  konnektorenSubs: Record<string, string[]>;
  konnektorenComments: Record<string, string>;
};

const createEmptyLevelData = (): LevelData => ({
  tempora: [],
  temporaComments: {},
  modi: [],
  modiComments: {},
  genusVerbi: [],
  genusVerbiComments: {},
  infiniteVerbformen: [],
  infiniteVerbformenComments: {},
  kasus: [],
  kasusComments: {},
  deklinationsklassen: [],
  deklinationsklassenComments: {},
  adjektivDeklination: [],
  adjektivDeklinationComments: {},
  steigerung: [],
  steigerungComments: {},
  adjektivVerwendung: [],
  adjektivVerwendungComments: {},
  bestimmterArtikel: [],
  bestimmterArtikelComments: {},
  unbestimmterArtikel: [],
  unbestimmterArtikelComments: {},
  negationsartikel: [],
  negationsartikelComments: {},
  demonstrativartikel: [],
  demonstrativartikelKasus: {},
  demonstrativartikelComments: {},
  possessivartikel: [],
  possessivartikelKasus: {},
  possessivartikelComments: {},
  indefinitartikel: [],
  indefinitartikelKasus: {},
  indefinitartikelComments: {},
  interrogativartikel: [],
  interrogativartikelKasus: {},
  interrogativartikelComments: {},
  personalpronomen: [],
  personalpronomenKasus: {},
  personalpronomenComments: {},
  reflexivpronomen: [],
  reflexivpronomenKasus: {},
  reflexivpronomenComments: {},
  demonstrativpronomen: [],
  demonstrativpronomenKasus: {},
  demonstrativpronomenComments: {},
  indefinitpronomen: [],
  indefinitpronomenKasus: {},
  indefinitpronomenComments: {},
  interrogativpronomen: [],
  interrogativpronomenKasus: {},
  interrogativpronomenComments: {},
  possessivpronomen: [],
  possessivpronomenKasus: {},
  possessivpronomenComments: {},
  diversePronomen: [],
  diversePronomenComments: {},
  komposition: [],
  kompositionComments: {},
  derivation: [],
  derivationSubs: {},
  derivationComments: {},
  konversion: [],
  konversionSubs: {},
  konversionComments: {},
  fugenmorpheme: [],
  fugenmorphemeComments: {},
  verbklassen: [],
  verbklassenSubs: {},
  verbklassenComments: {},
  präpositionen: [],
  präpositionenSubs: {},
  präpositionenComments: {},
  partikeln: [],
  partikelSubs: {},
  partikelComments: {},
  adverbien: [],
  adverbienSubs: {},
  adverbienComments: {},
  numeralia: [],
  numeraliaSubs: {},
  numeraliaComments: {},
  negation: [],
  negationSubs: {},
  negationComments: {},
  satztypen: [],
  satztypenComments: {},
  feldermodell: [],
  feldermodellSubs: {},
  feldermodellComments: {},
  satzglieder: [],
  satzgliederSubs: {},
  satzgliederComments: {},
  parataxe: [],
  parataxeSubs: {},
  parataxeComments: {},
  hypotaxe: [],
  hypotaxeSubs: {},
  hypotaxeComments: {},
  maximaleVerschachtelungstiefe: "",
  maximaleEmpfohleneSatzlaenge: "",
  satzkomplexitaetChecks: [],
  satzkomplexitaetComments: {},
  konnektoren: [],
  konnektorenSubs: {},
  konnektorenComments: {},
});

const A1_1_SEED_DATA: Partial<LevelData> = {
  // Verbmorphologie
  tempora: ["Präsens", "Perfekt"],
  temporaComments: {
    "Perfekt": "mit haben (transitive + die meisten intransitiven) und sein (Bewegungsverben: gehen, fahren, kommen; auch: bleiben, werden)",
  },
  modi: ["Indikativ"],
  genusVerbi: ["Aktiv"],
  infiniteVerbformen: [],

  // Kasus & Deklination
  kasus: ["Nominativ", "Akkusativ"],
  kasusComments: {
    "Akkusativ": "formal nur bei Maskulin Singular sichtbar: den/einen/keinen/meinen; ab L6",
  },
  deklinationsklassen: ["stark", "schwach", "gemischt"],
  deklinationsklassenComments: {
    "stark": "die meisten Maskulina und Neutra: der Mann, das Kind",
    "schwach": "n-Deklination (Maskulina: der Herr, der Name) – passiv bekannt, noch nicht explizit thematisiert",
    "gemischt": "z. B. der Name – kommt vor, aber noch nicht explizit behandelt",
  },

  // Adjektiv
  adjektivVerwendung: ["prädikativ", "adverbial"],
  adjektivVerwendungComments: {
    "adverbial": "unveränderliche Form (gut, schnell, schön)",
  },
  adjektivDeklination: [],
  steigerung: ["Positiv"],

  // Artikel
  bestimmterArtikel: ["bestimmt"],
  unbestimmterArtikel: ["ein", "eine"],
  negationsartikel: ["erlaubt"],
  negationsartikelComments: {
    "erlaubt": "kein/keine – Nominativ; keinen – Akkusativ Maskulin; ab L3",
  },
  demonstrativartikel: [],
  indefinitartikel: [],
  interrogativartikel: [],
  possessivartikel: ["Possessivartikel"],
  possessivartikelKasus: { "Possessivartikel": ["Nominativ"] },
  possessivartikelComments: {
    "Possessivartikel": "mein/e, dein/e, Ihr/e – nur Nominativ (L2)",
  },

  // Pronomen
  personalpronomen: ["Personalpronomen"],
  personalpronomenKasus: { "Personalpronomen": ["Nominativ"] },
  personalpronomenComments: {
    "Personalpronomen": "ich, du, er/sie/es, wir, ihr, sie/Sie – nur Nominativ (L1/L2)",
  },
  reflexivpronomen: [],
  demonstrativpronomen: [],
  indefinitpronomen: [],
  interrogativpronomen: [],
  possessivpronomen: [],
  diversePronomen: [],

  // Wortbildung
  komposition: ["Determinativkomposita"],
  kompositionComments: {
    "Determinativkomposita": "einfache Zusammensetzungen wie Wohnzimmer, Kühlschrank, Telefonnummer (Schritte Band 1)",
  },
  derivation: [],
  konversion: [],
  fugenmorpheme: [],

  // Verbklassen
  verbklassen: ["syntaktische Funktion", "Valenz / Wertigkeit", "Trennbarkeit / Verbpartikeln", "Flexionsklasse"],
  verbklassenSubs: {
    "syntaktische Funktion": ["Vollverben", "Hilfsverben", "Modalverben"],
    "Valenz / Wertigkeit": ["intransitiv", "transitiv"],
    "Trennbarkeit / Verbpartikeln": ["trennbar"],
    "Flexionsklasse": ["schwach", "stark", "unregelmässig"],
  },
  verbklassenComments: {
    "syntaktische Funktion": "Vollverben (regelmässige und unregelmässige), Hilfsverben (haben, sein – Konjugation und Perfektbildung), Modalverben (möchte L3; können, wollen L7)",
    "Trennbarkeit / Verbpartikeln": "aufräumen, aufstehen, einkaufen, anrufen, fernsehen, anfangen, abholen (L5)",
    "Flexionsklasse": "Schwache: leben, wohnen, lernen, kommen; Starke mit Vokalwechsel: sprechen/spricht, essen/isst, schlafen/schläft, fahren/fährt; Unregelmässige: sein, haben",
  },

  // Präpositionen
  präpositionen: [],
  präpositionenSubs: {
    "Dativpräpositionen": ["aus", "bei", "mit", "nach", "von", "zu"],
    "Wechselpräpositionen (Dativ/Akkusativ)": ["an", "auf", "in"],
    "Lokal": ["an", "auf", "aus", "bei", "in", "nach", "von", "zu"],
    "Temporal": ["ab", "an", "bis", "um", "von"],
    "Vorangestellt (Präposition)": ["für", "mit", "von", "zu"],
    "Primär": ["an", "auf", "aus", "bei", "in", "mit", "nach", "um", "von", "zu"],
  },
  präpositionenComments: {
    "Dativpräpositionen": "als feste Ausdrücke gelernt; Kasusrektion noch nicht explizit thematisiert (L1–L6)",
    "Wechselpräpositionen (Dativ/Akkusativ)": "an/auf/in als Ortsangaben (Wo?); Akkusativ-Richtung noch nicht explizit",
    "Lokal": "in, an, auf, bei, nach, von, zu – Ortsangaben (L1–L6)",
    "Temporal": "am (Wochentag), um (Uhrzeit), von … bis, ab – Zeitangaben (L5)",
  },

  // Partikeln
  partikeln: ["Modalpartikeln / Abtönungspartikeln", "Gradpartikeln", "Gesprächspartikeln / Responsive"],
  partikelSubs: {
    "Modalpartikeln / Abtönungspartikeln": ["doch", "mal", "ja"],
    "Gradpartikeln": ["sehr", "ein bisschen"],
    "Gesprächspartikeln / Responsive": ["ja", "nein", "doch", "genau", "okay"],
  },
  partikelComments: {
    "Gesprächspartikeln / Responsive": "doch als positive Antwort auf negierte Ja-/Nein-Frage (L6)",
  },

  // Adverbien
  adverbien: ["Temporaladverbien", "Lokaladverbien"],
  adverbienSubs: {
    "Temporaladverbien": ["jetzt", "nun", "heute", "morgen", "gestern", "dann", "danach", "vorher", "bald", "gerade", "oft", "manchmal", "immer", "nie", "selten", "meistens", "zuerst", "schliesslich"],
    "Lokaladverbien": ["hier", "dort", "da"],
  },
  adverbienComments: {
    "Temporaladverbien": "besonders: jetzt, heute, morgen, gestern, dann, danach, vorher, oft, manchmal, immer, nie (L5–L6)",
    "Lokaladverbien": "hier, dort, da – zur Raumangabe (L4)",
  },

  // Numeralia
  numeralia: ["Kardinalzahlen"],
  numeraliaComments: {
    "Kardinalzahlen": "0–20 (L2); bis 1 Mio. (L4); Uhrzeiten (L5) und Preise (L3)",
  },

  // Negation
  negation: ["Negationsmittel", "Stellung von nicht"],
  negationSubs: {
    "Negationsmittel": ["nicht", "kein"],
    "Stellung von nicht": ["Satznegation"],
  },
  negationComments: {
    "Negationsmittel": "nicht ab L4; kein als Negativartikel ab L3",
    "Stellung von nicht": "Das stimmt nicht. / Ich gehe nicht. / Nein, nicht so gut.",
  },

  // Satztypen
  satztypen: ["Aussagesatz: Verb-Zweit-Stellung", "Fragesatz: Entscheidungsfrage", "Fragesatz: Ergänzungsfrage"],
  satztypenComments: {
    "Aussagesatz: Verb-Zweit-Stellung": "Subjekt oder Adverbial im Vorfeld (L1 und L5)",
    "Fragesatz: Entscheidungsfrage": "Verb an Position 1; Antwort: ja / nein / doch (L3/L6)",
    "Fragesatz: Ergänzungsfrage": "W-Pronomen: wer, was, wo, woher, wie, wann, wie viel (L1)",
  },

  // Feldermodell
  feldermodell: ["Vorfeld", "Linke Satzklammer", "Mittelfeld", "Rechte Satzklammer"],
  feldermodellSubs: {
    "Vorfeld": ["Subjekt", "Adverbial"],
    "Rechte Satzklammer": ["infinite Verbteile", "Verbpartikel"],
  },
  feldermodellComments: {
    "Linke Satzklammer": "finite Verbform an Position 2 (Aussage) oder Position 1 (Entscheidungsfrage)",
    "Rechte Satzklammer": "infinite Verbteile: Partizip II (Perfekt L7), Infinitiv (Modalverb L7); Verbpartikel: trennbare Verben (L5)",
  },

  // Satzglieder
  satzglieder: ["Subjekt", "Prädikat", "Objekte", "Adverbialbestimmungen"],
  satzgliederSubs: {
    "Prädikat": ["einteilig", "mehrteilig"],
    "Objekte": ["Akkusativobjekt"],
    "Adverbialbestimmungen": ["temporal", "lokal", "modal"],
  },
  satzgliederComments: {
    "Prädikat": "mehrteilig: Modalverb + Infinitiv (L7), haben/sein + Partizip II (L7), trennbare Verben (L5)",
    "Adverbialbestimmungen": "temporal: am Montag, um 10 Uhr (L5); lokal: in der Schweiz (L1); modal: gut, ein bisschen (L1)",
  },

  // Parataxe
  parataxe: ["Kopulativ", "Disjunktiv", "Adversativ"],
  parataxeSubs: {
    "Kopulativ": ["und"],
    "Disjunktiv": ["oder"],
    "Adversativ": ["aber"],
  },

  // Hypotaxe (keine auf A1.1)
  hypotaxe: [],

  // Satzkomplexität
  satzkomplexitaetChecks: [],
  maximaleVerschachtelungstiefe: "0",
  maximaleEmpfohleneSatzlaenge: "8",

  // Konnektoren
  konnektoren: ["Konjunktionen"],
  konnektorenSubs: {
    "Konjunktionen": ["und", "oder", "aber"],
  },
  konnektorenComments: {
    "Konjunktionen": "koordinierende Konjunktionen ohne Stellungsveränderung des Finitums",
  },
};

const A1_2_SEED_DATA: Partial<LevelData> = {
  // Verbmorphologie — kumulativ A1.1 + A1.2
  tempora: ["Präsens", "Perfekt", "Präteritum", "Futur I"],
  temporaComments: {
    "Perfekt": "mit haben/sein – wie A1.1; bleibt Hauptvergangenheitsform",
    "Präteritum": "NUR war/hatte; alle anderen Verben im Perfekt (L8)",
    "Futur I": "werden + Infinitiv (Zukunftsaussagen, Vermutungen) – vereinzelt ab L14",
  },
  modi: ["Indikativ", "Imperativ", "Konjunktiv II"],
  modiComments: {
    "Imperativ": "du/ihr/Sie-Form; Achtung: sein → sei / seid / Seien Sie (L9)",
    "Konjunktiv II": "nur könnte/würde + Infinitiv für höfliche Bitten; KEIN konjunktivischer Gebrauch (L12)",
  },
  genusVerbi: ["Aktiv"],
  infiniteVerbformen: [],

  // Kasus & Deklination
  kasus: ["Nominativ", "Akkusativ", "Dativ"],
  kasusComments: {
    "Akkusativ": "bei transitiven Verben und Akkusativpräpositionen",
    "Dativ": "mit Dativpräpositionen (vor, nach, seit, bei, mit, von, zu, für [temp.]) und Verben mit Dativ (L13)",
  },
  deklinationsklassen: ["stark", "schwach", "gemischt"],

  // Adjektiv
  adjektivVerwendung: ["prädikativ", "adverbial"],
  adjektivVerwendungComments: {
    "adverbial": "unveränderliche Form (gut, schnell, schön, besser, lieber) – noch kein attributives Adjektiv",
  },
  adjektivDeklination: [],
  steigerung: ["Positiv", "Komparativ"],
  steigerungComments: {
    "Komparativ": "NUR unregelmässige Formen: gut/besser, viel/mehr, gern/lieber (L13); reguläre Komparativformen noch nicht thematisiert",
  },

  // Artikel
  bestimmterArtikel: ["bestimmt"],
  unbestimmterArtikel: ["ein", "eine"],
  negationsartikel: ["erlaubt"],
  negationsartikelComments: {
    "erlaubt": "kein/keine + Akkusativ; keinem/keiner im Dativ (als feste Ausdrücke)",
  },
  demonstrativartikel: ["dieser"],
  demonstrativartikelKasus: { "dieser": ["Nominativ", "Akkusativ"] },
  demonstrativartikelComments: {
    "dieser": "dieser/dieses/diese; Akkusativ Maskulin: diesen – als Deiktikum (L13)",
  },
  interrogativartikel: ["welcher"],
  interrogativartikelKasus: { "welcher": ["Nominativ", "Akkusativ"] },
  interrogativartikelComments: {
    "welcher": "Welcher/welches/welche + Nom/Akk; in Fragen und Relativverweis (L13)",
  },
  possessivartikel: ["Possessivartikel"],
  possessivartikelKasus: { "Possessivartikel": ["Nominativ", "Akkusativ", "Dativ"] },
  possessivartikelComments: {
    "Possessivartikel": "mein/dein/sein/ihr/unser/euer/ihr/Ihr – Nom, Akk, Dat Singular; Dativ erst in festen Ausdrücken",
  },
  indefinitartikel: [],

  // Pronomen
  personalpronomen: ["Personalpronomen"],
  personalpronomenKasus: { "Personalpronomen": ["Nominativ", "Akkusativ", "Dativ"] },
  personalpronomenComments: {
    "Personalpronomen": "Nom: ich/du/er/sie/es/wir/ihr/sie/Sie; Akk: mich/dich/ihn/sie/es/uns/euch/sie/Sie (L14); Dat: mir/dir/ihm/ihr/uns/euch/ihnen/Ihnen (L13)",
  },
  reflexivpronomen: [],
  demonstrativpronomen: ["dieser"],
  demonstrativpronomenKasus: { "dieser": ["Nominativ", "Akkusativ"] },
  demonstrativpronomenComments: {
    "dieser": "als Pronomen zur Verdeutlichung (Welcher Koffer? – Dieser.) (L13)",
  },
  indefinitpronomen: [],
  interrogativpronomen: [],
  possessivpronomen: [],
  diversePronomen: [],

  // Wortbildung
  komposition: ["Determinativkomposita"],
  kompositionComments: {
    "Determinativkomposita": "wie A1.1 – produktiver Bestandteil des Berufs- und Alltagswortschatzes",
  },
  derivation: ["Suffixbildung"],
  derivationSubs: {
    "Suffixbildung": ["-ung", "-heit", "-keit", "-lich", "-bar", "-isch"],
  },
  derivationComments: {
    "Suffixbildung": "-in zur Feminisierung von Berufsbezeichnungen: der Arzt → die Ärztin, der Mechatroniker → die Mechatronikerin (L8)",
  },
  konversion: [],
  fugenmorpheme: [],

  // Verbklassen
  verbklassen: ["syntaktische Funktion", "Valenz / Wertigkeit", "Trennbarkeit / Verbpartikeln", "Flexionsklasse"],
  verbklassenSubs: {
    "syntaktische Funktion": ["Vollverben", "Hilfsverben", "Modalverben", "Kopulaverben"],
    "Valenz / Wertigkeit": ["intransitiv", "transitiv"],
    "Trennbarkeit / Verbpartikeln": ["trennbar"],
    "Flexionsklasse": ["schwach", "stark", "unregelmässig"],
  },
  verbklassenComments: {
    "syntaktische Funktion": "Vollverben; Hilfsverben (haben/sein/werden); Modalverben: können, müssen, dürfen, sollen, wollen, mögen/möchte (L9/10); werden als Vollverb + Futurbildung (L14)",
    "Trennbarkeit / Verbpartikeln": "wie A1.1; trennbare Verben im Imperativ (Hör zu!) und Perfekt (aufgeräumt)",
    "Flexionsklasse": "Schwache: regelmässig; Starke: Vokalwechsel (helfen/hilft, fahren/fährt); Unregelmässige: sein/haben/werden",
  },

  // Präpositionen
  präpositionen: [],
  präpositionenSubs: {
    "Dativpräpositionen": ["ab", "aus", "bei", "mit", "nach", "seit", "von", "zu"],
    "Akkusativpräpositionen": ["für"],
    "Wechselpräpositionen (Dativ/Akkusativ)": ["an", "auf", "hinter", "in", "neben", "über", "unter", "vor", "zwischen"],
    "Lokal": ["an", "auf", "aus", "bei", "hinter", "in", "nach", "neben", "über", "unter", "vor", "von", "zu", "zwischen"],
    "Temporal": ["ab", "bei", "bis", "für", "in", "nach", "seit", "um", "von", "vor"],
    "Modal": ["als", "mit"],
    "Vorangestellt (Präposition)": ["an", "auf", "aus", "bei", "für", "in", "mit", "nach", "seit", "um", "von", "vor", "zu"],
    "Primär": ["ab", "an", "auf", "aus", "bei", "für", "hinter", "in", "mit", "nach", "neben", "seit", "über", "um", "unter", "von", "vor", "zu", "zwischen"],
  },
  präpositionenComments: {
    "Dativpräpositionen": "seit (L8: seit wann?), vor/nach/bei + Dativ temporal (L11/12), mit + Dativ modal Verkehrsmittel (L11), zu/zum/zur lokal (L11)",
    "Akkusativpräpositionen": "für + Akkusativ temporal (für einen Monat) – L8",
    "Wechselpräpositionen (Dativ/Akkusativ)": "Wo? → Dativ (Ort); Wohin? → Akkusativ (Richtung) – L11; Kontraktionen: am, beim, im, zum, zur",
    "Modal": "mit dem Zug/Auto/Bus/Velo (Verkehrsmittel L11); als Hauswart/Ärztin (Berufsangabe L8)",
  },

  // Partikeln
  partikeln: ["Modalpartikeln / Abtönungspartikeln", "Gradpartikeln", "Gesprächspartikeln / Responsive"],
  partikelSubs: {
    "Modalpartikeln / Abtönungspartikeln": ["denn", "doch", "eigentlich", "halt", "mal", "ja"],
    "Gradpartikeln": ["sehr", "ein bisschen", "fast", "genug", "zu"],
    "Gesprächspartikeln / Responsive": ["ja", "nein", "doch", "genau", "okay", "na ja", "ach so"],
  },
  partikelComments: {
    "Modalpartikeln / Abtönungspartikeln": "denn in Fragen (Wie heisst du denn?); halt/eigentlich passiv bekannt (L10–L12)",
    "Gradpartikeln": "zu (Das ist zu teuer!) und fast ergänzend ab L11",
  },

  // Adverbien
  adverbien: ["Temporaladverbien", "Lokaladverbien", "Modaladverbien"],
  adverbienSubs: {
    "Temporaladverbien": ["bereits", "bald", "dann", "danach", "damals", "früher", "gestern", "gerade", "heute", "immer", "inzwischen", "jetzt", "manchmal", "meistens", "morgen", "nie", "noch", "nun", "oft", "schliesslich", "schon", "selten", "vorher", "zuerst"],
    "Lokaladverbien": ["da", "dahin", "dort", "dorthin", "her", "hier", "hierher", "hin", "weit"],
    "Modaladverbien": ["allein", "gern(e)", "lieber", "zusammen"],
  },
  adverbienComments: {
    "Temporaladverbien": "früher/damals als Vergangenheitsbezug (L8); schon/noch als Aspektanzeiger (L10)",
    "Modaladverbien": "gern/lieber im Komparationskontext (L13)",
  },

  // Numeralia
  numeralia: ["Kardinalzahlen", "Ordinalzahlen"],
  numeraliaComments: {
    "Kardinalzahlen": "wie A1.1 (0–1 Mio.); Jahreszahlen (L8)",
    "Ordinalzahlen": "Datum: 1.–31. (der erste … der einundzwanzigste); Kombination mit am/vom … bis (L14)",
  },

  // Negation
  negation: ["Negationsmittel", "Stellung von nicht"],
  negationSubs: {
    "Negationsmittel": ["nicht", "kein", "nichts", "nie/niemals"],
    "Stellung von nicht": ["Satznegation", "Sondernegation"],
  },
  negationComments: {
    "Negationsmittel": "gar nicht (Verstärkung); nichts als Pronomen (L10)",
    "Stellung von nicht": "Sondernegation: nicht so gut, nicht zu teuer (L13)",
  },

  // Satztypen
  satztypen: ["Aussagesatz: Verb-Zweit-Stellung", "Fragesatz: Entscheidungsfrage", "Fragesatz: Ergänzungsfrage", "Aufforderungssatz"],
  satztypenComments: {
    "Aussagesatz: Verb-Zweit-Stellung": "auch mit Inversion nach Adverbial (Dann gehe ich…) – L8",
    "Fragesatz: Entscheidungsfrage": "Verb an Pos. 1; Antwort: ja/nein/doch",
    "Fragesatz: Ergänzungsfrage": "W-Fragen: wie lange?, seit wann?, wohin?, welcher?, welches? – erweitert (L8–L14)",
    "Aufforderungssatz": "Imperativ du/ihr/Sie + höfliche Bitte mit könnte/würde (L9/L12)",
  },

  // Feldermodell
  feldermodell: ["Vorfeld", "Linke Satzklammer", "Mittelfeld", "Rechte Satzklammer"],
  feldermodellSubs: {
    "Vorfeld": ["Subjekt", "Adverbial"],
    "Rechte Satzklammer": ["infinite Verbteile", "Verbpartikel"],
  },
  feldermodellComments: {
    "Linke Satzklammer": "finite Verbform an Pos. 2 (Aussage/Inversion) oder Pos. 1 (Entscheidungsfrage/Imperativ)",
    "Rechte Satzklammer": "Infinitiv bei Modalverben (L9); Partizip II im Perfekt; Verbpartikel trennbarer Verben",
  },

  // Satzglieder
  satzglieder: ["Subjekt", "Prädikat", "Objekte", "Adverbialbestimmungen"],
  satzgliederSubs: {
    "Prädikat": ["einteilig", "mehrteilig"],
    "Objekte": ["Akkusativobjekt", "Dativobjekt"],
    "Adverbialbestimmungen": ["temporal", "lokal", "modal"],
  },
  satzgliederComments: {
    "Prädikat": "mehrteilig: Modalverb + Inf (L9), haben/sein + Part. II, werden + Inf (L14), trennbare Verben (L5)",
    "Objekte": "Dativobjekt bei Verben wie gefallen, gehören, passen, stehen, schmecken (L13)",
    "Adverbialbestimmungen": "temporal: seit einem Monat, vor einer Woche (L8); modal: mit dem Zug, als Ärztin (L8/L11)",
  },

  // Parataxe
  parataxe: ["Kopulativ", "Disjunktiv", "Adversativ", "Kausal: denn"],
  parataxeSubs: {
    "Kopulativ": ["und"],
    "Disjunktiv": ["oder"],
    "Adversativ": ["aber"],
    "Kausal: denn": [],
  },
  parataxeComments: {
    "Kausal: denn": "denn als koordinierende Konjunktion ohne Inversion (L14): Sie feiern, denn Lara reist.",
  },

  // Hypotaxe (noch keine)
  hypotaxe: [],

  // Satzkomplexität
  satzkomplexitaetChecks: [],
  maximaleVerschachtelungstiefe: "0",
  maximaleEmpfohleneSatzlaenge: "12",

  // Konnektoren
  konnektoren: ["Konjunktionen"],
  konnektorenSubs: {
    "Konjunktionen": ["und", "oder", "aber", "denn"],
  },
  konnektorenComments: {
    "Konjunktionen": "und/oder/aber wie A1.1; denn (kausal, koordinierend) neu ab L14",
  },
};

const A2_1_SEED_DATA: Partial<LevelData> = {
  // Verbmorphologie — kumulativ bis A2.1
  tempora: ["Präsens", "Perfekt", "Präteritum", "Futur I"],
  temporaComments: {
    "Perfekt": "bleibt Hauptvergangenheitsform in gesprochener Sprache; trennbar (kennengelernt), nicht-trennbar (erlebt), -ieren (telefoniert) – L1",
    "Präteritum": "NUR Modalverben (musste, konnte, wollte, durfte, sollte) + war/hatte – L6",
    "Futur I": "werden + Infinitiv – vereinzelt für Planungen/Vermutungen",
  },
  modi: ["Indikativ", "Imperativ", "Konjunktiv II"],
  modiComments: {
    "Imperativ": "du/ihr/Sie-Form wie A1.2",
    "Konjunktiv II": "sollte (Ratschlag, L4): Du solltest Detektiv werden; werden + Inf für Höflichkeit",
  },
  genusVerbi: ["Aktiv"],
  infiniteVerbformen: [],

  // Kasus & Deklination
  kasus: ["Nominativ", "Akkusativ", "Dativ"],
  kasusComments: {
    "Dativ": "als Objekt (Possessivartikel + Dativ L7: meinem Mann, meiner Nachbarin); von + Dativ als Genitiversatz (L1/L7)",
  },
  deklinationsklassen: ["stark", "schwach", "gemischt"],

  // Adjektiv
  adjektivVerwendung: ["prädikativ", "adverbial"],
  adjektivVerwendungComments: {
    "adverbial": "unveränderliche Form; kein attributives Adjektiv in diesem Band",
  },
  adjektivDeklination: [],
  steigerung: ["Positiv", "Komparativ"],
  steigerungComments: {
    "Komparativ": "unregelmässig wie A1.2; reguläre Formen noch nicht eingeführt",
  },

  // Artikel
  bestimmterArtikel: ["bestimmt"],
  unbestimmterArtikel: ["ein", "eine"],
  negationsartikel: ["erlaubt"],
  demonstrativartikel: [],
  interrogativartikel: [],
  possessivartikel: ["Possessivartikel"],
  possessivartikelKasus: { "Possessivartikel": ["Nominativ", "Akkusativ", "Dativ"] },
  possessivartikelComments: {
    "Possessivartikel": "Dativ: meinem/meiner/meinen + Nomen als indirektes Objekt (L7)",
  },
  indefinitartikel: [],

  // Pronomen
  personalpronomen: ["Personalpronomen"],
  personalpronomenKasus: { "Personalpronomen": ["Nominativ", "Akkusativ", "Dativ"] },
  personalpronomenComments: {
    "Personalpronomen": "Dat-Pronomen als Stellvertreter des Dativobjekts: ihm/ihr/ihnen (L7: Ich gebe ihm Konzertkarten.)",
  },
  reflexivpronomen: ["echt"],
  reflexivpronomenKasus: { "echt": ["Akkusativ"] },
  reflexivpronomenComments: {
    "echt": "echte Reflexivverben: sich bewegen, sich verabreden, sich ausruhen, sich ärgern, sich beeilen, sich anziehen usw. (L5)",
  },
  demonstrativpronomen: [],
  indefinitpronomen: ["Indefinitpronomen"],
  indefinitpronomenKasus: { "Indefinitpronomen": ["Nominativ", "Akkusativ"] },
  indefinitpronomenComments: {
    "Indefinitpronomen": "einer/eins/eine (Nom) → einen/eins/eine (Akk); welche/keine (Pl); auch meiner/keiner (L3)",
  },
  interrogativpronomen: [],
  possessivpronomen: [],
  diversePronomen: ["Pronominaladverbien"],
  diversePronomenComments: {
    "Pronominaladverbien": "dafür/darauf/daran/darüber/damit/davon als Stellvertreter von Präp+Sache (L5); Fragewörter: Wofür?, Worauf? usw.",
  },

  // Wortbildung
  komposition: ["Determinativkomposita"],
  derivation: ["Suffixbildung"],
  derivationSubs: {
    "Suffixbildung": ["-ung", "-heit", "-keit", "-lich", "-bar", "-isch"],
  },
  konversion: [],
  fugenmorpheme: [],

  // Verbklassen
  verbklassen: ["syntaktische Funktion", "Valenz / Wertigkeit", "Trennbarkeit / Verbpartikeln", "Flexionsklasse", "Reflexivität"],
  verbklassenSubs: {
    "syntaktische Funktion": ["Vollverben", "Hilfsverben", "Modalverben", "Kopulaverben"],
    "Valenz / Wertigkeit": ["intransitiv", "transitiv", "mit Präpositionalobjekt"],
    "Trennbarkeit / Verbpartikeln": ["trennbar", "untrennbar"],
    "Flexionsklasse": ["schwach", "stark", "unregelmässig"],
    "Reflexivität": ["echt"],
  },
  verbklassenComments: {
    "syntaktische Funktion": "Verben mit Präpositionen (L5): warten auf, sich verabreden mit, sich freuen auf, sich erinnern an usw.",
    "Trennbarkeit / Verbpartikeln": "nicht-trennbare Verben im Perfekt ohne ge- (erleben → erlebt, bemerken → bemerkt) – L1",
    "Flexionsklasse": "Verben auf -ieren im Perfekt ohne ge- (telefoniert, passiert) – L1",
  },

  // Präpositionen
  präpositionen: [],
  präpositionenSubs: {
    "Dativpräpositionen": ["ab", "aus", "bei", "mit", "nach", "seit", "von", "zu"],
    "Akkusativpräpositionen": ["durch", "für", "ohne", "um"],
    "Wechselpräpositionen (Dativ/Akkusativ)": ["an", "auf", "hinter", "in", "neben", "über", "unter", "vor", "zwischen"],
    "Lokal": ["an", "auf", "aus", "bei", "durch", "hinter", "in", "neben", "über", "um", "unter", "vor", "von", "zu", "zwischen"],
    "Temporal": ["ab", "bei", "bis", "für", "in", "nach", "seit", "um", "von", "vor"],
    "Modal": ["als", "mit", "ohne"],
    "Vorangestellt (Präposition)": ["an", "auf", "aus", "bei", "durch", "für", "in", "mit", "nach", "ohne", "seit", "über", "um", "von", "vor", "zu"],
    "Primär": ["an", "auf", "aus", "bei", "durch", "für", "in", "mit", "nach", "neben", "ohne", "seit", "über", "um", "unter", "von", "vor", "zu", "zwischen"],
  },
  präpositionenComments: {
    "Wechselpräpositionen (Dativ/Akkusativ)": "Wo? → Dativ (stehen/liegen/hängen); Wohin? → Akkusativ (stellen/legen/hängen) – L2; Direktionaladverbien: hier/hierhin, dort/dorthin, her.../hin... (L2)",
    "Dativpräpositionen": "von + Dativ als Genitiversatz (L1, L7): Annas Mutter = die Mutter von Anna",
  },

  // Partikeln
  partikeln: ["Modalpartikeln / Abtönungspartikeln", "Gradpartikeln", "Gesprächspartikeln / Responsive"],
  partikelSubs: {
    "Modalpartikeln / Abtönungspartikeln": ["dann", "denn", "doch", "eigentlich", "halt", "ja", "mal"],
    "Gradpartikeln": ["sehr", "ein bisschen", "fast", "genug", "zu"],
    "Gesprächspartikeln / Responsive": ["ja", "nein", "doch", "genau", "okay", "na ja", "ach so"],
  },

  // Adverbien
  adverbien: ["Temporaladverbien", "Lokaladverbien", "Modaladverbien", "Kausaladverbien"],
  adverbienSubs: {
    "Temporaladverbien": ["bereits", "bald", "dann", "damals", "danach", "früher", "gestern", "gerade", "heute", "immer", "inzwischen", "jetzt", "manchmal", "meistens", "morgen", "nie", "noch", "nun", "oft", "schliesslich", "schon", "selten", "zuerst"],
    "Lokaladverbien": ["da", "dahin", "dort", "dorthin", "her", "herein", "heraus", "herauf", "herunter", "hin", "hinein", "hinaus", "hinauf", "hinunter", "hier", "hierhin"],
    "Modaladverbien": ["allein", "gern(e)", "lieber", "zusammen"],
    "Kausaladverbien": ["deshalb", "deswegen"],
  },
  adverbienComments: {
    "Lokaladverbien": "Direktionaladverbien: her.../hin... (L2: herein/hinaus/herauf/hinunter usw.); dahin/dorthin",
    "Kausaladverbien": "deshalb/deswegen als Konjunktionaladverbien mit V2-Stellung – erst im nächsten Band explizit, aber rezeptiv bekannt",
  },

  // Numeralia
  numeralia: ["Kardinalzahlen", "Ordinalzahlen"],
  numeraliaComments: {
    "Kardinalzahlen": "wie A1.x",
    "Ordinalzahlen": "Datum, Reihenfolge (L7: der erste, der zweite...)",
  },

  // Negation
  negation: ["Negationsmittel", "Stellung von nicht"],
  negationSubs: {
    "Negationsmittel": ["nicht", "kein", "nichts", "nie/niemals", "niemand"],
    "Stellung von nicht": ["Satznegation", "Sondernegation"],
  },

  // Satztypen
  satztypen: ["Aussagesatz: Verb-Zweit-Stellung", "Fragesatz: Entscheidungsfrage", "Fragesatz: Ergänzungsfrage", "Aufforderungssatz"],
  satztypenComments: {
    "Fragesatz: Ergänzungsfrage": "Worauf?/Wovon?/Wobei? (Präpositionalfragewörter, L5)",
  },

  // Feldermodell
  feldermodell: ["Vorfeld", "Linke Satzklammer", "Mittelfeld", "Rechte Satzklammer"],
  feldermodellSubs: {
    "Vorfeld": ["Subjekt", "Adverbial"],
    "Rechte Satzklammer": ["infinite Verbteile", "Verbpartikel"],
  },

  // Satzglieder
  satzglieder: ["Subjekt", "Prädikat", "Objekte", "Adverbialbestimmungen"],
  satzgliederSubs: {
    "Prädikat": ["einteilig", "mehrteilig"],
    "Objekte": ["Akkusativobjekt", "Dativobjekt"],
    "Adverbialbestimmungen": ["temporal", "lokal", "modal"],
  },
  satzgliederComments: {
    "Objekte": "Stellung der Objekte: Dat-Pron vor Akk-Pron; Dat-Nomen vor Akk-Nomen (L7)",
  },

  // Parataxe
  parataxe: ["Kopulativ", "Disjunktiv", "Adversativ", "Kausal: denn"],
  parataxeSubs: {
    "Kopulativ": ["und"],
    "Disjunktiv": ["oder"],
    "Adversativ": ["aber"],
    "Kausal: denn": [],
  },

  // Hypotaxe
  hypotaxe: ["Kausalsätze", "Konditionalsätze", "Subjekt- und Objektsätze"],
  hypotaxeSubs: {
    "Kausalsätze": ["weil"],
    "Konditionalsätze": ["wenn"],
    "Subjekt- und Objektsätze": ["dass"],
  },
  hypotaxeComments: {
    "Kausalsätze": "weil-Satz (L1); Verb ans Ende des Nebensatzes",
    "Konditionalsätze": "wenn-Satz (L4); NS vor oder nach HS; bei NS-Erststellung folgt Inversion im HS",
    "Subjekt- und Objektsätze": "dass-Satz (L6): Es ist wichtig, dass…; Ich denke/finde, dass…",
  },

  // Satzkomplexität
  satzkomplexitaetChecks: [],
  maximaleVerschachtelungstiefe: "1",
  maximaleEmpfohleneSatzlaenge: "14",

  // Konnektoren
  konnektoren: ["Konjunktionen"],
  konnektorenSubs: {
    "Konjunktionen": ["und", "oder", "aber", "denn"],
  },
  konnektorenComments: {
    "Konjunktionen": "koordinierende Konjunktionen mit V2; unterordnende: weil, wenn, dass (Nebensatz mit Verb am Ende)",
  },
};

const A2_2_SEED_DATA: Partial<LevelData> = {
  // Verbmorphologie — kumulativ bis A2.2
  tempora: ["Präsens", "Perfekt", "Präteritum", "Futur I"],
  temporaComments: {
    "Präteritum": "Vollverben jetzt systematisch im Präteritum: regelmässig (tankte), stark (fuhr), gemischt (brachte) – L1; Modalverben + war/hatte wie bisher",
    "Perfekt": "Wiederholung: trennbar/nicht-trennbar/-ieren – L14",
    "Futur I": "wird + Inf.; auch Präsens + Zeitangabe für Zukünftiges (L11/CH6-Vorgriff)",
  },
  modi: ["Indikativ", "Imperativ", "Konjunktiv II"],
  modiComments: {
    "Konjunktiv II": "wäre/hätte (Wunsch, L8: Ich wäre gern am Meer.); würde + Inf. (L8); könnte (Vorschlag L8); sollte (Ratschlag); irreale Bedingungen noch nicht systematisch",
  },
  genusVerbi: ["Aktiv", "Vorgangspassiv"],
  genusVerbiComments: {
    "Vorgangspassiv": "Passiv Präsens: wird + Partizip II (L10: Das wird hineingeschrieben = Man schreibt das hinein.)",
  },
  infiniteVerbformen: [],

  // Kasus & Deklination
  kasus: ["Nominativ", "Akkusativ", "Dativ"],
  kasusComments: {
    "Akkusativ": "auch nach was für ein (L10); Adjektivdeklination indef./def./ohne Artikel",
    "Dativ": "wie A2.1; Lokalprep. mit Dativ (Woher?: aus + Dat, von + Dat – L11)",
  },
  deklinationsklassen: ["stark", "schwach", "gemischt"],

  // Adjektiv
  adjektivVerwendung: ["attributiv", "prädikativ", "adverbial"],
  adjektivVerwendungComments: {
    "attributiv": "Deklination nach indef. Artikel (L9), def. Artikel (L10), ohne Artikel (L12)",
  },
  adjektivDeklination: ["starke Deklination", "schwache Deklination", "gemischte Deklination"],
  adjektivDeklinationComments: {
    "schwache Deklination": "nach def. Artikel: nom./akk. -e, Rest -en (L10)",
    "gemischte Deklination": "nach indef. Artikel / Possessivartikel / kein-: nom. -er/-es/-e, Rest wie schwach (L9)",
    "starke Deklination": "ohne Artikel: starke Endungen (L12)",
  },
  steigerung: ["Positiv", "Komparativ", "Superlativ"],
  steigerungComments: {
    "Komparativ": "regulär: schöner, interessanter; Umlaut: grösser, länger; als im Vergleich (L9)",
    "Superlativ": "am schönsten, am grössten, am höchsten; als Attribut: der schönste (L9)",
  },

  // Artikel
  bestimmterArtikel: ["bestimmt"],
  unbestimmterArtikel: ["ein", "eine"],
  negationsartikel: ["erlaubt"],
  demonstrativartikel: [],
  interrogativartikel: ["was für ein"],
  interrogativartikelKasus: { "was für ein": ["Nominativ", "Akkusativ"] },
  interrogativartikelComments: {
    "was für ein": "Was für ein Zettel? – nominativ/akkusativ (L10)",
  },
  possessivartikel: ["Possessivartikel"],
  possessivartikelKasus: { "Possessivartikel": ["Nominativ", "Akkusativ", "Dativ"] },
  indefinitartikel: [],

  // Pronomen
  personalpronomen: ["Personalpronomen"],
  personalpronomenKasus: { "Personalpronomen": ["Nominativ", "Akkusativ", "Dativ"] },
  reflexivpronomen: ["echt"],
  reflexivpronomenKasus: { "echt": ["Akkusativ"] },
  demonstrativpronomen: [],
  indefinitpronomen: ["Indefinitpronomen"],
  indefinitpronomenKasus: { "Indefinitpronomen": ["Nominativ", "Akkusativ"] },
  interrogativpronomen: [],
  possessivpronomen: [],
  diversePronomen: ["Pronominaladverbien"],
  diversePronomenComments: {
    "Pronominaladverbien": "wie A2.1; erweitert (L5 CH5)",
  },

  // Wortbildung
  komposition: ["Determinativkomposita"],
  kompositionComments: {
    "Determinativkomposita": "Nomen+Nomen: der Arbeitskollege (L10/L14)",
  },
  derivation: ["Suffixbildung", "Präfixbildung"],
  derivationSubs: {
    "Suffixbildung": ["-ung", "-heit", "-keit", "-lich", "-bar", "-isch", "-ig", "-los"],
    "Präfixbildung": ["un-"],
  },
  derivationComments: {
    "Suffixbildung": "-los (arbeitslos), -isch (stürmisch), -ig (eisig), -bar (fahrbar) – L9/11",
    "Präfixbildung": "un- (unmöglich) – L10",
  },
  konversion: ["Substantivierung"],
  konversionSubs: {
    "Substantivierung": ["Verben", "Adjektive"],
  },
  konversionComments: {
    "Substantivierung": "Verb → Nomen (Befragung); Diminutiv: das Bärli, das Spätzchen – L14",
  },
  fugenmorpheme: [],

  // Verbklassen
  verbklassen: ["syntaktische Funktion", "Valenz / Wertigkeit", "Trennbarkeit / Verbpartikeln", "Flexionsklasse", "Reflexivität"],
  verbklassenSubs: {
    "syntaktische Funktion": ["Vollverben", "Hilfsverben", "Modalverben", "Kopulaverben"],
    "Valenz / Wertigkeit": ["intransitiv", "transitiv", "mit Präpositionalobjekt"],
    "Trennbarkeit / Verbpartikeln": ["trennbar", "untrennbar"],
    "Flexionsklasse": ["schwach", "stark", "gemischt", "unregelmässig"],
    "Reflexivität": ["echt"],
  },
  verbklassenComments: {
    "syntaktische Funktion": "lassen + Inf. (Kausativkonstruktion, L13: Sie lässt ihr Konto prüfen.)",
    "Flexionsklasse": "Präteritum der starken/gemischten Verben systematisch (L1)",
  },

  // Präpositionen
  präpositionen: [],
  präpositionenSubs: {
    "Dativpräpositionen": ["ab", "aus", "ausser", "bei", "gegenüber", "mit", "nach", "seit", "von", "zu"],
    "Akkusativpräpositionen": ["bis", "durch", "entlang", "für", "gegen", "ohne", "um"],
    "Wechselpräpositionen (Dativ/Akkusativ)": ["an", "auf", "hinter", "in", "neben", "über", "unter", "vor", "zwischen"],
    "Lokal": ["an", "auf", "aus", "bei", "durch", "entlang", "gegenüber", "hinter", "in", "neben", "über", "um", "unter", "bis", "von", "vor", "zu", "zwischen"],
    "Temporal": ["ab", "an", "bei", "bis", "für", "in", "nach", "seit", "um", "über", "von", "während"],
    "Modal": ["als", "mit", "ohne"],
    "Vorangestellt (Präposition)": ["an", "auf", "aus", "bei", "durch", "entlang", "für", "gegenüber", "gegen", "in", "mit", "nach", "ohne", "seit", "über", "um", "unter", "von", "vor", "zu"],
    "Primär": ["an", "auf", "aus", "bei", "durch", "für", "in", "mit", "nach", "neben", "ohne", "seit", "über", "um", "unter", "von", "vor", "zu", "zwischen"],
  },
  präpositionenComments: {
    "Lokal": "Woher? aus + Dat. / von + Dat. (L11); Bewegungsverb + über/durch/entlang/um...herum (L11); Wo? an/auf/in + Dat. für Landschaft (L12)",
    "Temporal": "über + Akk. (über eine Stunde – L12); von … an + Dat. (Von August an – L12)",
    "Modal": "ohne + Akk. (ohne lauten Verkehr – L12)",
  },

  // Partikeln
  partikeln: ["Modalpartikeln / Abtönungspartikeln", "Gradpartikeln", "Gesprächspartikeln / Responsive"],
  partikelSubs: {
    "Modalpartikeln / Abtönungspartikeln": ["denn", "doch", "eigentlich", "halt", "ja", "mal", "ruhig"],
    "Gradpartikeln": ["sehr", "ein bisschen", "fast", "genug", "zu", "ziemlich"],
    "Gesprächspartikeln / Responsive": ["ja", "nein", "doch", "genau", "okay", "na ja", "ach so"],
  },

  // Adverbien
  adverbien: ["Temporaladverbien", "Lokaladverbien", "Modaladverbien", "Kausaladverbien"],
  adverbienSubs: {
    "Temporaladverbien": ["bereits", "bald", "dann", "damals", "danach", "früher", "gestern", "gerade", "heute", "immer", "inzwischen", "jetzt", "manchmal", "meistens", "morgen", "nie", "noch", "nun", "oft", "schliesslich", "schon", "selten", "zuerst"],
    "Lokaladverbien": ["da", "dahin", "dort", "dorthin", "her", "herein", "heraus", "hin", "im Süden", "vorne", "hinten", "oben", "unten"],
    "Modaladverbien": ["allein", "gern(e)", "lieber", "zusammen"],
    "Kausaladverbien": ["deshalb", "deswegen", "trotzdem"],
  },
  adverbienComments: {
    "Kausaladverbien": "deshalb (L11): Tobi liebt Tiger. Deshalb möchte er…; trotzdem (L8): Eva hat keine Zeit. Trotzdem soll sie hereinkommen. – Konjunktionaladverbien mit V2-Inversion",
  },

  // Numeralia
  numeralia: ["Kardinalzahlen", "Ordinalzahlen"],

  // Negation
  negation: ["Negationsmittel", "Stellung von nicht"],
  negationSubs: {
    "Negationsmittel": ["nicht", "kein", "nichts", "nie/niemals", "niemand"],
    "Stellung von nicht": ["Satznegation", "Sondernegation"],
  },

  // Satztypen
  satztypen: ["Aussagesatz: Verb-Zweit-Stellung", "Fragesatz: Entscheidungsfrage", "Fragesatz: Ergänzungsfrage", "Aufforderungssatz"],
  satztypenComments: {
    "Fragesatz: Ergänzungsfrage": "auch indirekte Fragen (L13): Können Sie mir sagen, was ich tun muss? / ob Sie Ihren Ausweis dabeihaben?",
  },

  // Feldermodell
  feldermodell: ["Vorfeld", "Linke Satzklammer", "Mittelfeld", "Rechte Satzklammer"],
  feldermodellSubs: {
    "Vorfeld": ["Subjekt", "Adverbial", "Konjunktionaladverb"],
    "Rechte Satzklammer": ["infinite Verbteile", "Verbpartikel"],
  },
  feldermodellComments: {
    "Vorfeld": "Konjunktionaladverbien (deshalb, trotzdem) im Vorfeld → Inversion (L8/L11)",
  },

  // Satzglieder
  satzglieder: ["Subjekt", "Prädikat", "Objekte", "Adverbialbestimmungen"],
  satzgliederSubs: {
    "Prädikat": ["einteilig", "mehrteilig"],
    "Objekte": ["Akkusativobjekt", "Dativobjekt"],
    "Adverbialbestimmungen": ["temporal", "lokal", "modal"],
  },

  // Parataxe
  parataxe: ["Kopulativ", "Disjunktiv", "Adversativ", "Kausal: denn", "Konsekutiv (Konjunktionaladverbien)"],
  parataxeSubs: {
    "Kopulativ": ["und"],
    "Disjunktiv": ["oder"],
    "Adversativ": ["aber"],
    "Kausal: denn": [],
    "Konsekutiv (Konjunktionaladverbien)": ["deshalb", "deswegen", "trotzdem"],
  },
  parataxeComments: {
    "Konsekutiv (Konjunktionaladverbien)": "deshalb/deswegen/trotzdem mit V2-Inversion (L8/L11)",
  },

  // Hypotaxe
  hypotaxe: ["Kausalsätze", "Konditionalsätze", "Subjekt- und Objektsätze"],
  hypotaxeSubs: {
    "Kausalsätze": ["weil"],
    "Konditionalsätze": ["wenn"],
    "Subjekt- und Objektsätze": ["dass", "ob", "indirekte Fragen"],
  },
  hypotaxeComments: {
    "Subjekt- und Objektsätze": "indirekte Fragen mit W-Wort (L13) und ob (L13)",
  },

  // Satzkomplexität
  satzkomplexitaetChecks: [],
  maximaleVerschachtelungstiefe: "1",
  maximaleEmpfohleneSatzlaenge: "16",

  // Konnektoren
  konnektoren: ["Konjunktionen", "Konjunktionaladverbien"],
  konnektorenSubs: {
    "Konjunktionen": ["und", "oder", "aber", "denn"],
    "Konjunktionaladverbien": ["deshalb", "deswegen", "trotzdem"],
  },
};

const B1_1_SEED_DATA: Partial<LevelData> = {
  // Verbmorphologie — kumulativ bis B1.1
  tempora: ["Präsens", "Perfekt", "Präteritum", "Plusquamperfekt", "Futur I"],
  temporaComments: {
    "Präteritum": "alle Typen (schwach, stark, gemischt); systematisches Schreiben + Nachrichten/Berichte (L1)",
    "Plusquamperfekt": "hatte/war + Part. II für Vorzeitigkeit in Narrationen (L1: Er hatte sich den Fuss gebrochen.)",
    "Futur I": "wird + Inf. für Vorhersage, Versprechen, Vorsatz, Aufforderung (L11/CH6-Vorgriff)",
  },
  modi: ["Indikativ", "Imperativ", "Konjunktiv II"],
  modiComments: {
    "Konjunktiv II": "irreale Bedingungen (L4: Wenn ich ihn toll finden würde, hätte ich…); Konjunktiv II Vergangenheit: hätte/wäre + Part. II (L7: Hätte ich nur nichts gesagt!); wäre/hätte/würde/könnte/sollte wie bisher",
  },
  genusVerbi: ["Aktiv", "Vorgangspassiv"],
  genusVerbiComments: {
    "Vorgangspassiv": "Passiv Präsens + Modalverben (L3: Auf Bewegung sollte geachtet werden.); alle einfachen Passivformen im Präsens",
  },
  infiniteVerbformen: ["Infinitiv mit zu"],
  infiniteVerbformenComments: {
    "Infinitiv mit zu": "nach anfangen, aufhören, vergessen, sich vorstellen, versuchen, erwarten; nach Es ist toll/leicht/…; nach Hast du Lust? (L5)",
  },

  // Kasus & Deklination
  kasus: ["Nominativ", "Akkusativ", "Dativ", "Genitiv"],
  kasusComments: {
    "Genitiv": "def. Artikel (des Rückens, der Fitness); indef. Artikel (eines Fachmanns); wegen + Gen. (L4); während + Gen. (L5); trotz + Gen. (L7)",
  },
  deklinationsklassen: ["stark", "schwach", "gemischt"],

  // Adjektiv
  adjektivVerwendung: ["attributiv", "prädikativ", "adverbial"],
  adjektivDeklination: ["starke Deklination", "schwache Deklination", "gemischte Deklination"],
  steigerung: ["Positiv", "Komparativ", "Superlativ"],
  steigerungComments: {
    "Komparativ": "als (Ungleichheit); genauso … wie (Gleichheit) – wie A2.2",
  },

  // Artikel
  bestimmterArtikel: ["bestimmt"],
  unbestimmterArtikel: ["ein", "eine"],
  negationsartikel: ["erlaubt"],
  demonstrativartikel: [],
  interrogativartikel: ["was für ein"],
  interrogativartikelKasus: { "was für ein": ["Nominativ", "Akkusativ"] },
  possessivartikel: ["Possessivartikel"],
  possessivartikelKasus: { "Possessivartikel": ["Nominativ", "Akkusativ", "Dativ", "Genitiv"] },
  possessivartikelComments: {
    "Possessivartikel": "jetzt auch im Genitiv (meines Berufs, meiner Arbeit – L4)",
  },
  indefinitartikel: [],

  // Pronomen
  personalpronomen: ["Personalpronomen"],
  personalpronomenKasus: { "Personalpronomen": ["Nominativ", "Akkusativ", "Dativ"] },
  reflexivpronomen: ["echt", "unecht"],
  reflexivpronomenKasus: { "echt": ["Akkusativ", "Dativ"], "unecht": ["Akkusativ"] },
  reflexivpronomenComments: {
    "unecht": "unechte Reflexivverben mit Dat-Reflexivpronomen bei transitiven Verben (sich etwas vorstellen, sich merken)",
  },
  demonstrativpronomen: [],
  indefinitpronomen: ["Indefinitpronomen"],
  indefinitpronomenKasus: { "Indefinitpronomen": ["Nominativ", "Akkusativ", "Dativ"] },
  interrogativpronomen: [],
  possessivpronomen: [],
  diversePronomen: ["Pronominaladverbien"],
  diversePronomenComments: {
    "Pronominaladverbien": "daran/darüber/damit/wozu/wovon usw. (L7: Verben mit Präpositionen); systematisch für Sache-Referenz",
  },

  // Wortbildung
  komposition: ["Determinativkomposita"],
  derivation: ["Suffixbildung", "Präfixbildung"],
  derivationSubs: {
    "Suffixbildung": ["-ung", "-heit", "-keit", "-lich", "-bar", "-isch", "-ig", "-los"],
    "Präfixbildung": ["un-", "ver-", "be-"],
  },
  konversion: ["Substantivierung"],
  konversionSubs: {
    "Substantivierung": ["Verben", "Adjektive"],
  },
  fugenmorpheme: [],

  // Verbklassen
  verbklassen: ["syntaktische Funktion", "Valenz / Wertigkeit", "Trennbarkeit / Verbpartikeln", "Flexionsklasse", "Reflexivität"],
  verbklassenSubs: {
    "syntaktische Funktion": ["Vollverben", "Hilfsverben", "Modalverben", "Kopulaverben"],
    "Valenz / Wertigkeit": ["intransitiv", "transitiv", "mit Präpositionalobjekt"],
    "Trennbarkeit / Verbpartikeln": ["trennbar", "untrennbar"],
    "Flexionsklasse": ["schwach", "stark", "gemischt", "unregelmässig"],
    "Reflexivität": ["echt", "unecht"],
  },
  verbklassenComments: {
    "syntaktische Funktion": "Verben mit es (L6: Es gibt, Es ist leicht, Es lohnt sich, Es regnet, Wie geht es?)",
    "Valenz / Wertigkeit": "Verben mit Präpositionalobjekt systematisch (L7): denken an, sich erinnern an, träumen von, verbinden mit, gehören zu",
  },

  // Präpositionen
  präpositionen: [],
  präpositionenSubs: {
    "Dativpräpositionen": ["ab", "aus", "ausser", "bei", "gegenüber", "innerhalb", "mit", "nach", "seit", "von", "zu", "zufolge"],
    "Akkusativpräpositionen": ["durch", "für", "gegen", "ohne", "um"],
    "Genitivpräpositionen": ["ausserhalb", "innerhalb", "trotz", "wegen", "während"],
    "Wechselpräpositionen (Dativ/Akkusativ)": ["an", "auf", "hinter", "in", "neben", "über", "unter", "vor", "zwischen"],
    "Lokal": ["an", "auf", "aus", "ausserhalb", "bei", "durch", "gegenüber", "hinter", "in", "innerhalb", "neben", "über", "um", "unter", "von", "vor", "zu", "zwischen"],
    "Temporal": ["ab", "an", "bei", "bis", "für", "in", "nach", "seit", "um", "während"],
    "Kausal": ["wegen"],
    "Konzessiv": ["trotz"],
    "Modal": ["als", "ausser", "mit", "ohne"],
    "Vorangestellt (Präposition)": ["an", "auf", "aus", "ausser", "bei", "durch", "für", "gegenüber", "in", "innerhalb", "mit", "nach", "ohne", "seit", "trotz", "über", "um", "von", "vor", "wegen", "während", "zu"],
    "Primär": ["an", "auf", "aus", "bei", "durch", "für", "in", "mit", "nach", "ohne", "seit", "trotz", "über", "um", "unter", "von", "vor", "wegen", "zu", "zwischen"],
  },
  präpositionenComments: {
    "Genitivpräpositionen": "wegen + Gen. (L4), während + Gen. (L5), trotz + Gen. (L7); ausserhalb/innerhalb – L5",
    "Dativpräpositionen": "ausser + Dat. (L12): alle ausser meiner Schwester",
  },

  // Partikeln
  partikeln: ["Modalpartikeln / Abtönungspartikeln", "Gradpartikeln", "Gesprächspartikeln / Responsive"],
  partikelSubs: {
    "Modalpartikeln / Abtönungspartikeln": ["bloss", "denn", "doch", "eben", "eigentlich", "halt", "ja", "mal", "ruhig", "schon", "wohl"],
    "Gradpartikeln": ["äusserst", "besonders", "ein bisschen", "fast", "genug", "nicht besonders", "total", "überhaupt nicht", "völlig", "wirklich", "ziemlich", "zu"],
    "Gesprächspartikeln / Responsive": ["ja", "nein", "doch", "genau", "okay", "na ja", "ach so"],
  },
  partikelComments: {
    "Gradpartikeln": "Gradskala: total/völlig ++ ziemlich/wirklich + nicht besonders – überhaupt/gar nicht -- (L2)",
  },

  // Adverbien
  adverbien: ["Temporaladverbien", "Lokaladverbien", "Modaladverbien", "Kausaladverbien"],
  adverbienSubs: {
    "Temporaladverbien": ["bereits", "bald", "dann", "damals", "danach", "früher", "gestern", "gerade", "heute", "immer", "inzwischen", "jetzt", "manchmal", "meistens", "morgen", "nie", "noch", "nun", "oft", "schliesslich", "schon", "selten", "zuerst"],
    "Lokaladverbien": ["da", "dahin", "dort", "dorthin", "her", "hin", "irgendwo", "nirgends", "überall"],
    "Modaladverbien": ["allein", "gern(e)", "irgendwie", "lieber", "zusammen"],
    "Kausaladverbien": ["daher", "darum", "deshalb", "deswegen"],
  },

  // Numeralia
  numeralia: ["Kardinalzahlen", "Ordinalzahlen"],

  // Negation
  negation: ["Negationsmittel", "Stellung von nicht"],
  negationSubs: {
    "Negationsmittel": ["nicht", "kein", "nichts", "nie/niemals", "niemand", "weder … noch"],
    "Stellung von nicht": ["Satznegation", "Sondernegation"],
  },

  // Satztypen
  satztypen: ["Aussagesatz: Verb-Zweit-Stellung", "Fragesatz: Entscheidungsfrage", "Fragesatz: Ergänzungsfrage", "Aufforderungssatz"],

  // Feldermodell
  feldermodell: ["Vorfeld", "Linke Satzklammer", "Mittelfeld", "Rechte Satzklammer"],
  feldermodellSubs: {
    "Vorfeld": ["Subjekt", "Adverbial", "Konjunktionaladverb", "Nebensatz"],
    "Rechte Satzklammer": ["infinite Verbteile", "Verbpartikel"],
  },
  feldermodellComments: {
    "Vorfeld": "Wenn-Satz / als-Satz im Vorfeld → Hauptsatz mit Inversion",
  },

  // Satzglieder
  satzglieder: ["Subjekt", "Prädikat", "Objekte", "Adverbialbestimmungen"],
  satzgliederSubs: {
    "Prädikat": ["einteilig", "mehrteilig"],
    "Objekte": ["Akkusativobjekt", "Dativobjekt"],
    "Adverbialbestimmungen": ["temporal", "lokal", "modal", "kausal"],
  },
  satzgliederComments: {
    "Adverbialbestimmungen": "kausal: wegen meines Berufs (L4); konzessiv: trotz der grossen Freude (L7)",
  },

  // Parataxe
  parataxe: ["Kopulativ", "Disjunktiv", "Adversativ", "Kausal: denn", "Konsekutiv (Konjunktionaladverbien)"],
  parataxeSubs: {
    "Kopulativ": ["und"],
    "Disjunktiv": ["oder"],
    "Adversativ": ["aber"],
    "Kausal: denn": [],
    "Konsekutiv (Konjunktionaladverbien)": ["also", "daher", "deshalb", "deswegen"],
  },

  // Hypotaxe
  hypotaxe: ["Temporalsätze", "Kausalsätze", "Konditionalsätze", "Konzessivsätze", "Finalsätze", "Relativsätze", "Subjekt- und Objektsätze"],
  hypotaxeSubs: {
    "Temporalsätze": ["als", "wenn"],
    "Kausalsätze": ["weil"],
    "Konditionalsätze": ["wenn"],
    "Konzessivsätze": ["obwohl"],
    "Finalsätze": ["damit", "um … zu"],
    "Relativsätze": ["der/die/das"],
    "Subjekt- und Objektsätze": ["dass", "ob", "indirekte Fragen", "Infinitiv mit zu"],
  },
  hypotaxeComments: {
    "Temporalsätze": "als (einmalige Vergangenheit, L1); wenn (wiederholte/zukünftige Ereignisse)",
    "Konzessivsätze": "obwohl (L2): Ben schaut an, obwohl er sie schon dreimal gesehen hat.",
    "Finalsätze": "um … zu + Inf. (gleich. Subjekt, L6); damit + NS (versch. Subjekte, L6); statt … zu / ohne … zu (L6)",
    "Relativsätze": "Nom./Akk./Dat. (L2); Relativpronomen nach definiertem Bezugsnomen; denen im Plural",
  },

  // Satzkomplexität
  satzkomplexitaetChecks: [],
  maximaleVerschachtelungstiefe: "2",
  maximaleEmpfohleneSatzlaenge: "18",

  // Konnektoren
  konnektoren: ["Konjunktionen", "Konjunktionaladverbien", "Mehrteilige Konnektoren"],
  konnektorenSubs: {
    "Konjunktionen": ["aber", "denn", "oder", "sondern", "und"],
    "Konjunktionaladverbien": ["also", "daher", "deshalb", "deswegen"],
    "Mehrteilige Konnektoren": ["entweder … oder", "nicht nur … sondern auch", "zwar … aber"],
  },
  konnektorenComments: {
    "Mehrteilige Konnektoren": "nicht nur … sondern auch (L7); zwar … aber (L7); entweder … oder (L7)",
  },
};

const B1_2_SEED_DATA: Partial<LevelData> = {
  // Verbmorphologie — kumulativ B1 vollständig
  tempora: ["Präsens", "Perfekt", "Präteritum", "Plusquamperfekt", "Futur I"],
  temporaComments: {
    "Präteritum": "alle Verben; stilistisch für Zeitungen, Berichte, Bücher (L1 CH5)",
    "Plusquamperfekt": "Vorvergangenheit in Narrationen",
    "Futur I": "Futur I (Auffordering/Versprechen/Vorhersage) + Präsens mit Zeitangabe (Zukunft sicher, L11); Passiv Perfekt (L13: ist gegründet worden) + Passiv Präteritum (L13: wurde gewählt)",
  },
  modi: ["Indikativ", "Imperativ", "Konjunktiv II"],
  modiComments: {
    "Konjunktiv II": "als ob + Konj.II (L9: Du tust so, als ob ich keine Ahnung hätte.); irreale Bedingungen + Vergangenheit (L7 CH5) voll konsolidiert",
  },
  genusVerbi: ["Aktiv", "Vorgangspassiv"],
  genusVerbiComments: {
    "Vorgangspassiv": "Passiv Perfekt (ist + Part.II + worden – L13) und Passiv Präteritum (wurde + Part.II – L13); Passiv mit Modalverben (L3 CH5)",
  },
  infiniteVerbformen: ["Infinitiv mit zu", "Partizip I"],
  infiniteVerbformenComments: {
    "Infinitiv mit zu": "wie B1.1; erweitert: statt … zu / ohne … zu",
    "Partizip I": "Partizip Präsens als Adjektiv (L10: der wohltuende Tee, das hupende Fahrzeug)",
  },

  // Kasus & Deklination
  kasus: ["Nominativ", "Akkusativ", "Dativ", "Genitiv"],
  kasusComments: {
    "Genitiv": "n-Deklination (L8: der Kollege → Kollegen in Akk/Dat); Adjektiv als Nomen (L8: der/ein Bekannte/r); Adjektiv mit Komparativ/Superlativ dekliniert (L13)",
  },
  deklinationsklassen: ["stark", "schwach", "gemischt"],
  deklinationsklassenComments: {
    "schwach": "n-Deklination systematisch (L8): der Mensch, der Nachbar, der Praktikant, der Junge, der Pole usw.",
  },

  // Adjektiv
  adjektivVerwendung: ["attributiv", "prädikativ", "adverbial"],
  adjektivDeklination: ["starke Deklination", "schwache Deklination", "gemischte Deklination"],
  adjektivDeklinationComments: {
    "attributiv": "Partizip Präsens als attributives Adjektiv (L10); Komparativ/Superlativ attributiv dekliniert (L13: der grössere Teil)",
  },
  steigerung: ["Positiv", "Komparativ", "Superlativ"],
  steigerungComments: {
    "Superlativ": "attributiv mit Deklination (L13); je … desto/umso (L8: Je länger…, desto schlechter…)",
  },

  // Artikel
  bestimmterArtikel: ["bestimmt"],
  unbestimmterArtikel: ["ein", "eine"],
  negationsartikel: ["erlaubt"],
  demonstrativartikel: [],
  interrogativartikel: ["was für ein"],
  interrogativartikelKasus: { "was für ein": ["Nominativ", "Akkusativ"] },
  possessivartikel: ["Possessivartikel"],
  possessivartikelKasus: { "Possessivartikel": ["Nominativ", "Akkusativ", "Dativ", "Genitiv"] },
  indefinitartikel: [],

  // Pronomen
  personalpronomen: ["Personalpronomen"],
  personalpronomenKasus: { "Personalpronomen": ["Nominativ", "Akkusativ", "Dativ"] },
  reflexivpronomen: ["echt", "unecht"],
  reflexivpronomenKasus: { "echt": ["Akkusativ", "Dativ"], "unecht": ["Akkusativ", "Dativ"] },
  demonstrativpronomen: [],
  indefinitpronomen: ["Indefinitpronomen"],
  indefinitpronomenKasus: { "Indefinitpronomen": ["Nominativ", "Akkusativ", "Dativ"] },
  interrogativpronomen: [],
  possessivpronomen: [],
  diversePronomen: ["Pronominaladverbien"],
  diversePronomenComments: {
    "Pronominaladverbien": "Relativsatz mit Präpositionen: über den/die/das; von dem/der/denen (L8 CH6); Präpositionaladverbien (L14 CH6): daran/darüber/damit/dazu/davon + Fragewörter",
  },

  // Wortbildung
  komposition: ["Determinativkomposita"],
  kompositionComments: {
    "Determinativkomposita": "Nomen+Nomen mit Fugenmorphem: die Adventszeit (Advent+s+Zeit), L14; aktiv produktiv",
  },
  derivation: ["Suffixbildung", "Präfixbildung"],
  derivationSubs: {
    "Suffixbildung": ["-ung", "-heit", "-keit", "-lich", "-bar", "-isch", "-ig", "-los"],
    "Präfixbildung": ["un-", "ver-", "be-", "miss-"],
  },
  derivationComments: {
    "Suffixbildung": "Wiederholung aller bekannten Suffixe (L14 CH6)",
    "Präfixbildung": "miss- (Missverständnis – L11 CH6); un- für Negation/Antonym (unerträglich)",
  },
  konversion: ["Substantivierung"],
  konversionSubs: {
    "Substantivierung": ["Verben", "Adjektive"],
  },
  konversionComments: {
    "Substantivierung": "Verb → Nomen: sich erinnern → die Erinnerung; mischen → die Mischung (L14 CH6)",
  },
  fugenmorpheme: ["-s-", "-n-", "-en-"],
  fugenmorphemeComments: {
    "-s-": "Adventszeit, Arbeitskollege (häufig bei Komposita)",
  },

  // Verbklassen
  verbklassen: ["syntaktische Funktion", "Valenz / Wertigkeit", "Trennbarkeit / Verbpartikeln", "Flexionsklasse", "Reflexivität"],
  verbklassenSubs: {
    "syntaktische Funktion": ["Vollverben", "Hilfsverben", "Modalverben", "Kopulaverben"],
    "Valenz / Wertigkeit": ["intransitiv", "transitiv", "mit Präpositionalobjekt"],
    "Trennbarkeit / Verbpartikeln": ["trennbar", "untrennbar"],
    "Flexionsklasse": ["schwach", "stark", "gemischt", "unregelmässig"],
    "Reflexivität": ["echt", "unecht"],
  },
  verbklassenComments: {
    "Valenz / Wertigkeit": "Verben mit Präpositionalobjekt (L14 CH6): denken an, sich erinnern an, sich freuen über, verbinden mit, gehören zu, träumen von",
  },

  // Präpositionen
  präpositionen: [],
  präpositionenSubs: {
    "Dativpräpositionen": ["ab", "aus", "ausser", "bei", "gegenüber", "innerhalb", "mit", "nach", "seit", "von", "zu"],
    "Akkusativpräpositionen": ["durch", "für", "gegen", "ohne", "um"],
    "Genitivpräpositionen": ["ausserhalb", "innerhalb", "trotz", "wegen", "während"],
    "Wechselpräpositionen (Dativ/Akkusativ)": ["an", "auf", "hinter", "in", "neben", "über", "unter", "vor", "zwischen"],
    "Lokal": ["an", "auf", "aus", "ausserhalb", "bei", "durch", "gegenüber", "hinter", "in", "innerhalb", "neben", "über", "um", "unter", "von", "vor", "zu", "zwischen"],
    "Temporal": ["ab", "an", "bei", "bis", "für", "in", "nach", "seit", "um", "während", "seitdem"],
    "Kausal": ["wegen"],
    "Konzessiv": ["trotz"],
    "Modal": ["als", "ausser", "mit", "ohne"],
    "Vorangestellt (Präposition)": ["an", "auf", "aus", "ausser", "bei", "durch", "für", "gegenüber", "in", "innerhalb", "mit", "nach", "ohne", "seit", "trotz", "über", "um", "unter", "von", "vor", "wegen", "während", "zu"],
    "Primär": ["an", "auf", "aus", "bei", "durch", "für", "in", "mit", "nach", "ohne", "seit", "trotz", "über", "um", "unter", "von", "vor", "wegen", "zu", "zwischen"],
  },
  präpositionenComments: {
    "Genitivpräpositionen": "wegen/trotz/während + Gen. (CH5); ausserhalb/innerhalb + Gen.",
    "Dativpräpositionen": "seitdem/seit als temporale Angabe (L12 CH6: seit/seitdem ich 16 bin)",
  },

  // Partikeln
  partikeln: ["Modalpartikeln / Abtönungspartikeln", "Gradpartikeln", "Gesprächspartikeln / Responsive"],
  partikelSubs: {
    "Modalpartikeln / Abtönungspartikeln": ["bloss", "denn", "doch", "eben", "eigentlich", "halt", "ja", "mal", "ruhig", "schon", "wohl"],
    "Gradpartikeln": ["äusserst", "besonders", "ein bisschen", "fast", "genug", "nicht besonders", "total", "überhaupt nicht", "völlig", "wirklich", "ziemlich", "zu"],
    "Gesprächspartikeln / Responsive": ["ja", "nein", "doch", "genau", "okay", "na ja", "ach so", "tja"],
  },

  // Adverbien
  adverbien: ["Temporaladverbien", "Lokaladverbien", "Modaladverbien", "Kausaladverbien"],
  adverbienSubs: {
    "Temporaladverbien": ["bereits", "bald", "dann", "damals", "danach", "früher", "gestern", "gerade", "heute", "immer", "inzwischen", "jetzt", "manchmal", "meistens", "morgen", "nie", "noch", "nun", "oft", "schliesslich", "schon", "selten", "zuerst"],
    "Lokaladverbien": ["da", "dahin", "dort", "dorthin", "her", "hin", "irgendwo", "nirgends", "überall"],
    "Modaladverbien": ["allein", "gern(e)", "irgendwie", "lieber", "zusammen"],
    "Kausaladverbien": ["daher", "darum", "deshalb", "deswegen"],
  },

  // Numeralia
  numeralia: ["Kardinalzahlen", "Ordinalzahlen"],

  // Negation
  negation: ["Negationsmittel", "Stellung von nicht"],
  negationSubs: {
    "Negationsmittel": ["nicht", "kein", "nichts", "nie/niemals", "niemand", "weder … noch"],
    "Stellung von nicht": ["Satznegation", "Sondernegation"],
  },

  // Satztypen
  satztypen: ["Aussagesatz: Verb-Zweit-Stellung", "Fragesatz: Entscheidungsfrage", "Fragesatz: Ergänzungsfrage", "Aufforderungssatz"],

  // Feldermodell
  feldermodell: ["Vorfeld", "Linke Satzklammer", "Mittelfeld", "Rechte Satzklammer"],
  feldermodellSubs: {
    "Vorfeld": ["Subjekt", "Adverbial", "Konjunktionaladverb", "Nebensatz"],
    "Rechte Satzklammer": ["infinite Verbteile", "Verbpartikel"],
  },

  // Satzglieder
  satzglieder: ["Subjekt", "Prädikat", "Objekte", "Adverbialbestimmungen"],
  satzgliederSubs: {
    "Prädikat": ["einteilig", "mehrteilig"],
    "Objekte": ["Akkusativobjekt", "Dativobjekt"],
    "Adverbialbestimmungen": ["temporal", "lokal", "modal", "kausal"],
  },

  // Parataxe
  parataxe: ["Kopulativ", "Disjunktiv", "Adversativ", "Kausal: denn", "Konsekutiv (Konjunktionaladverbien)"],
  parataxeSubs: {
    "Kopulativ": ["und", "sowohl … als auch"],
    "Disjunktiv": ["oder", "entweder … oder"],
    "Adversativ": ["aber", "sondern"],
    "Kausal: denn": [],
    "Konsekutiv (Konjunktionaladverbien)": ["also", "daher", "deshalb", "deswegen"],
  },
  parataxeComments: {
    "Kopulativ": "sowohl … als auch (L10 CH6)",
    "Disjunktiv": "weder … noch (L10 CH6)",
  },

  // Hypotaxe
  hypotaxe: ["Temporalsätze", "Kausalsätze", "Konditionalsätze", "Konzessivsätze", "Finalsätze", "Modalsätze", "Relativsätze", "Subjekt- und Objektsätze"],
  hypotaxeSubs: {
    "Temporalsätze": ["als", "bevor", "bis", "nachdem", "seitdem", "während", "wenn"],
    "Kausalsätze": ["da", "weil"],
    "Konditionalsätze": ["falls", "wenn"],
    "Konzessivsätze": ["obwohl"],
    "Finalsätze": ["damit", "um … zu"],
    "Modalsätze": ["indem", "ohne dass", "ohne … zu"],
    "Relativsätze": ["der/die/das"],
    "Subjekt- und Objektsätze": ["als ob", "dass", "ob", "indirekte Fragen", "Infinitiv mit zu"],
  },
  hypotaxeComments: {
    "Temporalsätze": "bevor (L9 CH6: bevor er «Superstar» wurde); nachdem + Plusquamperfekt (L9 CH6); seitdem (L12 CH6); bis (L12 CH6); während (L9 CH6)",
    "Kausalsätze": "da als stilistische Variante zu weil (L11 CH6: da wir mit dem Klassenlehrer sprechen wollen)",
    "Konditionalsätze": "falls (L8 CH6: falls dich das interessiert)",
    "Modalsätze": "indem (L12 CH6); ohne dass / ohne … zu (L12 CH6)",
    "Relativsätze": "Relativsatz mit Präpositionen (L8 CH6: über den/von dem/über die/von denen); Relativ mit wo (L10 CH6: dort, wo …); was (L10 CH6: das, was …)",
    "Subjekt- und Objektsätze": "als ob + Konj.II (L9 CH6: als ob ich keine Ahnung hätte)",
  },

  // Satzkomplexität
  satzkomplexitaetChecks: [],
  maximaleVerschachtelungstiefe: "2",
  maximaleEmpfohleneSatzlaenge: "20",

  // Konnektoren
  konnektoren: ["Konjunktionen", "Konjunktionaladverbien", "Mehrteilige Konnektoren"],
  konnektorenSubs: {
    "Konjunktionen": ["aber", "bevor", "da", "damit", "dass", "denn", "falls", "indem", "nachdem", "obwohl", "oder", "seitdem", "sondern", "während", "wenn", "weil", "und"],
    "Konjunktionaladverbien": ["also", "daher", "danach", "dann", "darum", "deshalb", "deswegen", "trotzdem"],
    "Mehrteilige Konnektoren": ["entweder … oder", "je … desto/umso", "nicht nur … sondern auch", "sowohl … als auch", "weder … noch", "zwar … aber"],
  },
  konnektorenComments: {
    "Mehrteilige Konnektoren": "je … desto/umso (L8 CH6); sowohl … als auch / weder … noch (L10 CH6); nicht nur … sondern auch / zwar … aber (L7 CH5)",
  },
};

const createInitialLevelData = () => {
  return Object.fromEntries(
    LEVELS.map((level) => [level, createEmptyLevelData()])
  ) as unknown as Record<Level, LevelData>;
};

const normalizeStoredData = (value: unknown): Record<Level, LevelData> => {
  const base = createInitialLevelData();

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const raw = value as Record<string, Partial<LevelData>>;

  return Object.fromEntries(
    LEVELS.map((level) => [
      level,
      {
        ...createEmptyLevelData(),
        ...(raw[level] ?? {}),
      },
    ])
  ) as unknown as Record<Level, LevelData>;
};

export default function NiveauregelnPage() {
  const mounted = useMounted();
  const [activeLevel, setActiveLevel] = useState<Level>("A1.1");
  const [data, setData] = useState<Record<Level, LevelData>>(createInitialLevelData);
  const [savedData, setSavedData] = useState<Record<Level, LevelData>>(createInitialLevelData);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/niveauregeln");
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Fehler beim Laden der Niveauregeln.");
        return;
      }

      const normalized = normalizeStoredData(payload.data);
      setData(normalized);
      setSavedData(normalized);
      setUpdatedAt(payload.updated_at ?? null);
    } catch {
      setError("Fehler beim Laden der Niveauregeln.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const applyA11Seed = () => {
    setData((prev) => ({
      ...prev,
      "A1.1": {
        ...createEmptyLevelData(),
        ...A1_1_SEED_DATA,
      },
    }));
  };

  const applyA11SeedAndSave = async () => {
    const merged: Record<Level, LevelData> = {
      ...data,
      "A1.1": {
        ...createEmptyLevelData(),
        ...A1_1_SEED_DATA,
      },
    };
    setData(merged);
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/niveauregeln", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: merged }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Fehler beim Speichern.");
        return;
      }
      const normalized = normalizeStoredData(payload.data);
      setData(normalized);
      setSavedData(normalized);
      setUpdatedAt(payload.updated_at ?? null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Fehler beim Speichern der Niveauregeln.");
    } finally {
      setSaving(false);
    }
  };

  const applyA12Seed = () => {
    setData((prev) => ({
      ...prev,
      "A1.2": {
        ...createEmptyLevelData(),
        ...A1_2_SEED_DATA,
      },
    }));
  };

  const applyA12SeedAndSave = async () => {
    const merged: Record<Level, LevelData> = {
      ...data,
      "A1.2": {
        ...createEmptyLevelData(),
        ...A1_2_SEED_DATA,
      },
    };
    setData(merged);
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/niveauregeln", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: merged }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Fehler beim Speichern.");
        return;
      }
      const normalized = normalizeStoredData(payload.data);
      setData(normalized);
      setSavedData(normalized);
      setUpdatedAt(payload.updated_at ?? null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Fehler beim Speichern der Niveauregeln.");
    } finally {
      setSaving(false);
    }
  };

  const applyA21Seed = () => {
    setData((prev) => ({
      ...prev,
      "A2.1": {
        ...createEmptyLevelData(),
        ...A2_1_SEED_DATA,
      },
    }));
  };

  const applyA21SeedAndSave = async () => {
    const merged: Record<Level, LevelData> = {
      ...data,
      "A2.1": {
        ...createEmptyLevelData(),
        ...A2_1_SEED_DATA,
      },
    };
    setData(merged);
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/niveauregeln", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: merged }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Fehler beim Speichern.");
        return;
      }
      const normalized = normalizeStoredData(payload.data);
      setData(normalized);
      setSavedData(normalized);
      setUpdatedAt(payload.updated_at ?? null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Fehler beim Speichern der Niveauregeln.");
    } finally {
      setSaving(false);
    }
  };

  const applyA22Seed = () => {
    setData((prev) => ({
      ...prev,
      "A2.2": {
        ...createEmptyLevelData(),
        ...A2_2_SEED_DATA,
      },
    }));
  };

  const applyA22SeedAndSave = async () => {
    const merged: Record<Level, LevelData> = {
      ...data,
      "A2.2": {
        ...createEmptyLevelData(),
        ...A2_2_SEED_DATA,
      },
    };
    setData(merged);
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/niveauregeln", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: merged }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Fehler beim Speichern.");
        return;
      }
      const normalized = normalizeStoredData(payload.data);
      setData(normalized);
      setSavedData(normalized);
      setUpdatedAt(payload.updated_at ?? null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Fehler beim Speichern der Niveauregeln.");
    } finally {
      setSaving(false);
    }
  };

  const applyB11Seed = () => {
    setData((prev) => ({
      ...prev,
      "B1.1": {
        ...createEmptyLevelData(),
        ...B1_1_SEED_DATA,
      },
    }));
  };

  const applyB11SeedAndSave = async () => {
    const merged: Record<Level, LevelData> = {
      ...data,
      "B1.1": {
        ...createEmptyLevelData(),
        ...B1_1_SEED_DATA,
      },
    };
    setData(merged);
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/niveauregeln", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: merged }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Fehler beim Speichern.");
        return;
      }
      const normalized = normalizeStoredData(payload.data);
      setData(normalized);
      setSavedData(normalized);
      setUpdatedAt(payload.updated_at ?? null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Fehler beim Speichern der Niveauregeln.");
    } finally {
      setSaving(false);
    }
  };

  const applyB12Seed = () => {
    setData((prev) => ({
      ...prev,
      "B1.2": {
        ...createEmptyLevelData(),
        ...B1_2_SEED_DATA,
      },
    }));
  };

  const applyB12SeedAndSave = async () => {
    const merged: Record<Level, LevelData> = {
      ...data,
      "B1.2": {
        ...createEmptyLevelData(),
        ...B1_2_SEED_DATA,
      },
    };
    setData(merged);
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const response = await fetch("/api/niveauregeln", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: merged }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Fehler beim Speichern.");
        return;
      }
      const normalized = normalizeStoredData(payload.data);
      setData(normalized);
      setSavedData(normalized);
      setUpdatedAt(payload.updated_at ?? null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Fehler beim Speichern der Niveauregeln.");
    } finally {
      setSaving(false);
    }
  };

  const saveRules = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/niveauregeln", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Fehler beim Speichern der Niveauregeln.");
        return;
      }

      const normalized = normalizeStoredData(payload.data);
      setData(normalized);
      setSavedData(normalized);
      setUpdatedAt(payload.updated_at ?? null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Fehler beim Speichern der Niveauregeln.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) {
    return <div className="mx-auto max-w-5xl p-6" />;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-zinc-500">
        <Loader2 className="size-4 animate-spin" /> Laden…
      </div>
    );
  }

  const levelData = data[activeLevel] ?? createEmptyLevelData();
  const hasChanges = JSON.stringify(data) !== JSON.stringify(savedData);

  // Collect inherited values from all lower levels
  const activeLevelIndex = LEVELS.indexOf(activeLevel);
  const inherited = LEVELS.slice(0, activeLevelIndex).reduce<LevelData>(
    (acc, l) => {
      const d = data[l];
      if (!d) return acc;
      return {
        tempora: [...new Set([...acc.tempora, ...d.tempora])],
        temporaComments: { ...acc.temporaComments, ...d.temporaComments },
        modi: [...new Set([...acc.modi, ...d.modi])],
        modiComments: { ...acc.modiComments, ...d.modiComments },
        genusVerbi: [...new Set([...(acc.genusVerbi ?? []), ...(d.genusVerbi ?? [])])],
        genusVerbiComments: { ...acc.genusVerbiComments, ...(d.genusVerbiComments ?? {}) },
        infiniteVerbformen: [...new Set([...acc.infiniteVerbformen, ...(d.infiniteVerbformen ?? [])])],
        infiniteVerbformenComments: { ...acc.infiniteVerbformenComments, ...(d.infiniteVerbformenComments ?? {}) },
        kasus: [...new Set([...(acc.kasus ?? []), ...(d.kasus ?? [])])],
        kasusComments: { ...acc.kasusComments, ...(d.kasusComments ?? {}) },
        deklinationsklassen: [...new Set([...(acc.deklinationsklassen ?? []), ...(d.deklinationsklassen ?? [])])],
        deklinationsklassenComments: {
          ...acc.deklinationsklassenComments,
          ...(d.deklinationsklassenComments ?? {}),
        },
        adjektivDeklination: [...new Set([...(acc.adjektivDeklination ?? []), ...(d.adjektivDeklination ?? [])])],
        adjektivDeklinationComments: {
          ...acc.adjektivDeklinationComments,
          ...(d.adjektivDeklinationComments ?? {}),
        },
        steigerung: [...new Set([...(acc.steigerung ?? []), ...(d.steigerung ?? [])])],
        steigerungComments: { ...acc.steigerungComments, ...(d.steigerungComments ?? {}) },
        adjektivVerwendung: [...new Set([...(acc.adjektivVerwendung ?? []), ...(d.adjektivVerwendung ?? [])])],
        adjektivVerwendungComments: {
          ...acc.adjektivVerwendungComments,
          ...(d.adjektivVerwendungComments ?? {}),
        },
        bestimmterArtikel: [...new Set([...(acc.bestimmterArtikel ?? []), ...(d.bestimmterArtikel ?? [])])],
        bestimmterArtikelComments: {
          ...acc.bestimmterArtikelComments,
          ...(d.bestimmterArtikelComments ?? {}),
        },
        unbestimmterArtikel: [...new Set([...(acc.unbestimmterArtikel ?? []), ...(d.unbestimmterArtikel ?? [])])],
        unbestimmterArtikelComments: {
          ...acc.unbestimmterArtikelComments,
          ...(d.unbestimmterArtikelComments ?? {}),
        },
        negationsartikel: [...new Set([...(acc.negationsartikel ?? []), ...(d.negationsartikel ?? [])])],
        negationsartikelComments: {
          ...acc.negationsartikelComments,
          ...(d.negationsartikelComments ?? {}),
        },
        demonstrativartikel: [...new Set([...(acc.demonstrativartikel ?? []), ...(d.demonstrativartikel ?? [])])],
        demonstrativartikelKasus: {
          ...acc.demonstrativartikelKasus,
          ...Object.fromEntries(
            Object.entries(d.demonstrativartikelKasus ?? {}).map(([artikel, kasus]) => [
              artikel,
              [...new Set([...(acc.demonstrativartikelKasus?.[artikel] ?? []), ...kasus])],
            ])
          ),
        },
        demonstrativartikelComments: {
          ...acc.demonstrativartikelComments,
          ...(d.demonstrativartikelComments ?? {}),
        },
        possessivartikel: [...new Set([...(acc.possessivartikel ?? []), ...(d.possessivartikel ?? [])])],
        possessivartikelKasus: {
          ...acc.possessivartikelKasus,
          ...Object.fromEntries(
            Object.entries(d.possessivartikelKasus ?? {}).map(([artikel, kasus]) => [
              artikel,
              [...new Set([...(acc.possessivartikelKasus?.[artikel] ?? []), ...kasus])],
            ])
          ),
        },
        possessivartikelComments: {
          ...acc.possessivartikelComments,
          ...(d.possessivartikelComments ?? {}),
        },
        indefinitartikel: [...new Set([...(acc.indefinitartikel ?? []), ...(d.indefinitartikel ?? [])])],
        indefinitartikelKasus: {
          ...acc.indefinitartikelKasus,
          ...Object.fromEntries(
            Object.entries(d.indefinitartikelKasus ?? {}).map(([artikel, kasus]) => [
              artikel,
              [...new Set([...(acc.indefinitartikelKasus?.[artikel] ?? []), ...kasus])],
            ])
          ),
        },
        indefinitartikelComments: {
          ...acc.indefinitartikelComments,
          ...(d.indefinitartikelComments ?? {}),
        },
        interrogativartikel: [...new Set([...(acc.interrogativartikel ?? []), ...(d.interrogativartikel ?? [])])],
        interrogativartikelKasus: {
          ...acc.interrogativartikelKasus,
          ...Object.fromEntries(
            Object.entries(d.interrogativartikelKasus ?? {}).map(([artikel, kasus]) => [
              artikel,
              [...new Set([...(acc.interrogativartikelKasus?.[artikel] ?? []), ...kasus])],
            ])
          ),
        },
        interrogativartikelComments: {
          ...acc.interrogativartikelComments,
          ...(d.interrogativartikelComments ?? {}),
        },
        personalpronomen: [...new Set([...(acc.personalpronomen ?? []), ...(d.personalpronomen ?? [])])],
        personalpronomenKasus: {
          ...acc.personalpronomenKasus,
          ...Object.fromEntries(
            Object.entries(d.personalpronomenKasus ?? {}).map(([label, kasus]) => [
              label,
              [...new Set([...(acc.personalpronomenKasus?.[label] ?? []), ...kasus])],
            ])
          ),
        },
        personalpronomenComments: {
          ...acc.personalpronomenComments,
          ...(d.personalpronomenComments ?? {}),
        },
        reflexivpronomen: [...new Set([...(acc.reflexivpronomen ?? []), ...(d.reflexivpronomen ?? [])])],
        reflexivpronomenKasus: {
          ...acc.reflexivpronomenKasus,
          ...Object.fromEntries(
            Object.entries(d.reflexivpronomenKasus ?? {}).map(([label, kasus]) => [
              label,
              [...new Set([...(acc.reflexivpronomenKasus?.[label] ?? []), ...kasus])],
            ])
          ),
        },
        reflexivpronomenComments: {
          ...acc.reflexivpronomenComments,
          ...(d.reflexivpronomenComments ?? {}),
        },
        demonstrativpronomen: [
          ...new Set([...(acc.demonstrativpronomen ?? []), ...(d.demonstrativpronomen ?? [])]),
        ],
        demonstrativpronomenKasus: {
          ...acc.demonstrativpronomenKasus,
          ...Object.fromEntries(
            Object.entries(d.demonstrativpronomenKasus ?? {}).map(([label, kasus]) => [
              label,
              [...new Set([...(acc.demonstrativpronomenKasus?.[label] ?? []), ...kasus])],
            ])
          ),
        },
        demonstrativpronomenComments: {
          ...acc.demonstrativpronomenComments,
          ...(d.demonstrativpronomenComments ?? {}),
        },
        indefinitpronomen: [...new Set([...(acc.indefinitpronomen ?? []), ...(d.indefinitpronomen ?? [])])],
        indefinitpronomenKasus: {
          ...acc.indefinitpronomenKasus,
          ...Object.fromEntries(
            Object.entries(d.indefinitpronomenKasus ?? {}).map(([label, kasus]) => [
              label,
              [...new Set([...(acc.indefinitpronomenKasus?.[label] ?? []), ...kasus])],
            ])
          ),
        },
        indefinitpronomenComments: {
          ...acc.indefinitpronomenComments,
          ...(d.indefinitpronomenComments ?? {}),
        },
        interrogativpronomen: [
          ...new Set([...(acc.interrogativpronomen ?? []), ...(d.interrogativpronomen ?? [])]),
        ],
        interrogativpronomenKasus: {
          ...acc.interrogativpronomenKasus,
          ...Object.fromEntries(
            Object.entries(d.interrogativpronomenKasus ?? {}).map(([label, kasus]) => [
              label,
              [...new Set([...(acc.interrogativpronomenKasus?.[label] ?? []), ...kasus])],
            ])
          ),
        },
        interrogativpronomenComments: {
          ...acc.interrogativpronomenComments,
          ...(d.interrogativpronomenComments ?? {}),
        },
        possessivpronomen: [...new Set([...(acc.possessivpronomen ?? []), ...(d.possessivpronomen ?? [])])],
        possessivpronomenKasus: {
          ...acc.possessivpronomenKasus,
          ...Object.fromEntries(
            Object.entries(d.possessivpronomenKasus ?? {}).map(([label, kasus]) => [
              label,
              [...new Set([...(acc.possessivpronomenKasus?.[label] ?? []), ...kasus])],
            ])
          ),
        },
        possessivpronomenComments: {
          ...acc.possessivpronomenComments,
          ...(d.possessivpronomenComments ?? {}),
        },
        diversePronomen: [...new Set([...(acc.diversePronomen ?? []), ...(d.diversePronomen ?? [])])],
        diversePronomenComments: {
          ...acc.diversePronomenComments,
          ...(d.diversePronomenComments ?? {}),
        },
        komposition: [...new Set([...(acc.komposition ?? []), ...(d.komposition ?? [])])],
        kompositionComments: { ...acc.kompositionComments, ...(d.kompositionComments ?? {}) },
        derivation: [...new Set([...(acc.derivation ?? []), ...(d.derivation ?? [])])],
        derivationSubs: {
          ...acc.derivationSubs,
          ...Object.fromEntries(
            Object.entries(d.derivationSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.derivationSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        derivationComments: { ...acc.derivationComments, ...(d.derivationComments ?? {}) },
        konversion: [...new Set([...(acc.konversion ?? []), ...(d.konversion ?? [])])],
        konversionSubs: {
          ...acc.konversionSubs,
          ...Object.fromEntries(
            Object.entries(d.konversionSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.konversionSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        konversionComments: { ...acc.konversionComments, ...(d.konversionComments ?? {}) },
        fugenmorpheme: [...new Set([...(acc.fugenmorpheme ?? []), ...(d.fugenmorpheme ?? [])])],
        fugenmorphemeComments: { ...acc.fugenmorphemeComments, ...(d.fugenmorphemeComments ?? {}) },
        satztypen: [...new Set([...(acc.satztypen ?? []), ...(d.satztypen ?? [])])],
        satztypenComments: { ...acc.satztypenComments, ...(d.satztypenComments ?? {}) },
        feldermodell: [...new Set([...(acc.feldermodell ?? []), ...(d.feldermodell ?? [])])],
        feldermodellSubs: {
          ...acc.feldermodellSubs,
          ...Object.fromEntries(
            Object.entries(d.feldermodellSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.feldermodellSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        feldermodellComments: { ...acc.feldermodellComments, ...(d.feldermodellComments ?? {}) },
        satzglieder: [...new Set([...(acc.satzglieder ?? []), ...(d.satzglieder ?? [])])],
        satzgliederSubs: {
          ...acc.satzgliederSubs,
          ...Object.fromEntries(
            Object.entries(d.satzgliederSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.satzgliederSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        satzgliederComments: { ...acc.satzgliederComments, ...(d.satzgliederComments ?? {}) },
        parataxe: [...new Set([...(acc.parataxe ?? []), ...(d.parataxe ?? [])])],
        parataxeSubs: {
          ...acc.parataxeSubs,
          ...Object.fromEntries(
            Object.entries(d.parataxeSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.parataxeSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        parataxeComments: { ...acc.parataxeComments, ...(d.parataxeComments ?? {}) },
        hypotaxe: [...new Set([...(acc.hypotaxe ?? []), ...(d.hypotaxe ?? [])])],
        hypotaxeSubs: {
          ...acc.hypotaxeSubs,
          ...Object.fromEntries(
            Object.entries(d.hypotaxeSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.hypotaxeSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        hypotaxeComments: { ...acc.hypotaxeComments, ...(d.hypotaxeComments ?? {}) },
        maximaleVerschachtelungstiefe:
          d.maximaleVerschachtelungstiefe || acc.maximaleVerschachtelungstiefe,
        maximaleEmpfohleneSatzlaenge:
          d.maximaleEmpfohleneSatzlaenge || acc.maximaleEmpfohleneSatzlaenge,
        satzkomplexitaetChecks: [
          ...new Set([...(acc.satzkomplexitaetChecks ?? []), ...(d.satzkomplexitaetChecks ?? [])]),
        ],
        satzkomplexitaetComments: {
          ...acc.satzkomplexitaetComments,
          ...(d.satzkomplexitaetComments ?? {}),
        },
        konnektoren: [...new Set([...(acc.konnektoren ?? []), ...(d.konnektoren ?? [])])],
        konnektorenSubs: {
          ...acc.konnektorenSubs,
          ...Object.fromEntries(
            Object.entries(d.konnektorenSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.konnektorenSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        konnektorenComments: {
          ...acc.konnektorenComments,
          ...(d.konnektorenComments ?? {}),
        },
        verbklassen: [...new Set([...(acc.verbklassen ?? []), ...(d.verbklassen ?? [])])],
        verbklassenSubs: {
          ...acc.verbklassenSubs,
          ...Object.fromEntries(
            Object.entries(d.verbklassenSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.verbklassenSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        verbklassenComments: {
          ...acc.verbklassenComments,
          ...(d.verbklassenComments ?? {}),
        },
        präpositionen: [...new Set([...(acc.präpositionen ?? []), ...(d.präpositionen ?? [])])],
        präpositionenSubs: {
          ...acc.präpositionenSubs,
          ...Object.fromEntries(
            Object.entries(d.präpositionenSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.präpositionenSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        präpositionenComments: {
          ...acc.präpositionenComments,
          ...(d.präpositionenComments ?? {}),
        },
        partikeln: [...new Set([...(acc.partikeln ?? []), ...(d.partikeln ?? [])])],
        partikelSubs: {
          ...acc.partikelSubs,
          ...Object.fromEntries(
            Object.entries(d.partikelSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.partikelSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        partikelComments: { ...acc.partikelComments, ...(d.partikelComments ?? {}) },
        adverbien: [...new Set([...(acc.adverbien ?? []), ...(d.adverbien ?? [])])],
        adverbienSubs: {
          ...acc.adverbienSubs,
          ...Object.fromEntries(
            Object.entries(d.adverbienSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.adverbienSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        adverbienComments: { ...acc.adverbienComments, ...(d.adverbienComments ?? {}) },
        numeralia: [...new Set([...(acc.numeralia ?? []), ...(d.numeralia ?? [])])],
        numeraliaSubs: {
          ...acc.numeraliaSubs,
          ...Object.fromEntries(
            Object.entries(d.numeraliaSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.numeraliaSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        numeraliaComments: { ...acc.numeraliaComments, ...(d.numeraliaComments ?? {}) },
        negation: [...new Set([...(acc.negation ?? []), ...(d.negation ?? [])])],
        negationSubs: {
          ...acc.negationSubs,
          ...Object.fromEntries(
            Object.entries(d.negationSubs ?? {}).map(([label, subs]) => [
              label,
              [...new Set([...(acc.negationSubs?.[label] ?? []), ...subs])],
            ])
          ),
        },
        negationComments: { ...acc.negationComments, ...(d.negationComments ?? {}) },
      };
    },
    createEmptyLevelData()
  );

  const toggleOption = (category: CategoryKey, option: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const current = currentLevel[category] ?? [];
      const next = current.includes(option)
        ? current.filter((value) => value !== option)
        : [...current, option];

      return { ...prev, [activeLevel]: { ...currentLevel, [category]: next } };
    });
  };

  const updateComment = (commentKey: CommentKey, option: string, comment: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          [commentKey]: {
            ...currentLevel[commentKey],
            [option]: comment,
          },
        },
      };
    });
  };

  const updateNumberField = (field: NumberFieldKey, value: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          [field]: value,
        },
      };
    });
  };

  const getNextAllSuboptions = (
    currentSubs: string[],
    inheritedSubs: string[],
    allSuboptions: readonly string[]
  ) => {
    const isAllSelected = allSuboptions.every(
      (suboption) => inheritedSubs.includes(suboption) || currentSubs.includes(suboption)
    );

    return isAllSelected ? [] : allSuboptions.filter((suboption) => !inheritedSubs.includes(suboption));
  };

  const renderSuboptionCheckboxes = ({
    suboptions,
    ownSelected,
    inheritedSelected,
    onToggleSuboption,
    containerClassName,
  }: {
    suboptions: readonly string[];
    ownSelected: string[];
    inheritedSelected: string[];
    onToggleSuboption: (suboption: string) => void;
    containerClassName?: string;
  }) => {
    return (
      <div className={containerClassName ?? "flex flex-wrap gap-x-4 gap-y-1"}>
        {suboptions.map((suboption) => {
          const isInherited = inheritedSelected.includes(suboption);
          const isOwn = ownSelected.includes(suboption);

          return (
            <label
              key={suboption}
              className={`flex items-center gap-2 text-sm ${
                isInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              <input
                type="checkbox"
                checked={isInherited || isOwn}
                disabled={isInherited}
                onChange={() => onToggleSuboption(suboption)}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
              <span>{suboption}</span>
            </label>
          );
        })}
      </div>
    );
  };

  const toggleAllArtikelKasus = (
    category: ArtikelCategoryKey,
    kasusMapKey: ArtikelKasusMapKey,
    artikel: string,
    inheritedKasus: string[]
  ) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentKasus = currentLevel[kasusMapKey][artikel] ?? [];
      const nextKasus = getNextAllSuboptions(currentKasus, inheritedKasus, KASUS);
      const nextArtikel = nextKasus.length > 0
        ? [...new Set([...currentLevel[category], artikel])]
        : currentLevel[category].filter((value) => value !== artikel);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          [category]: nextArtikel,
          [kasusMapKey]: {
            ...currentLevel[kasusMapKey],
            [artikel]: nextKasus,
          },
        },
      };
    });
  };

  const toggleDemonstrativartikelKasus = (artikel: string, kasus: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentKasus = currentLevel.demonstrativartikelKasus[artikel] ?? [];
      const nextKasus = currentKasus.includes(kasus)
        ? currentKasus.filter((value) => value !== kasus)
        : [...currentKasus, kasus];

      const nextArtikel = nextKasus.length > 0
        ? [...new Set([...currentLevel.demonstrativartikel, artikel])]
        : currentLevel.demonstrativartikel.filter((value) => value !== artikel);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          demonstrativartikel: nextArtikel,
          demonstrativartikelKasus: {
            ...currentLevel.demonstrativartikelKasus,
            [artikel]: nextKasus,
          },
        },
      };
    });
  };

  const togglePossessivartikelKasus = (artikel: string, kasus: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentKasus = currentLevel.possessivartikelKasus[artikel] ?? [];
      const nextKasus = currentKasus.includes(kasus)
        ? currentKasus.filter((value) => value !== kasus)
        : [...currentKasus, kasus];

      const nextArtikel = nextKasus.length > 0
        ? [...new Set([...currentLevel.possessivartikel, artikel])]
        : currentLevel.possessivartikel.filter((value) => value !== artikel);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          possessivartikel: nextArtikel,
          possessivartikelKasus: {
            ...currentLevel.possessivartikelKasus,
            [artikel]: nextKasus,
          },
        },
      };
    });
  };

  const toggleIndefinitartikelKasus = (artikel: string, kasus: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentKasus = currentLevel.indefinitartikelKasus[artikel] ?? [];
      const nextKasus = currentKasus.includes(kasus)
        ? currentKasus.filter((value) => value !== kasus)
        : [...currentKasus, kasus];

      const nextArtikel = nextKasus.length > 0
        ? [...new Set([...currentLevel.indefinitartikel, artikel])]
        : currentLevel.indefinitartikel.filter((value) => value !== artikel);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          indefinitartikel: nextArtikel,
          indefinitartikelKasus: {
            ...currentLevel.indefinitartikelKasus,
            [artikel]: nextKasus,
          },
        },
      };
    });
  };

  const toggleInterrogativartikelKasus = (artikel: string, kasus: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentKasus = currentLevel.interrogativartikelKasus[artikel] ?? [];
      const nextKasus = currentKasus.includes(kasus)
        ? currentKasus.filter((value) => value !== kasus)
        : [...currentKasus, kasus];

      const nextArtikel = nextKasus.length > 0
        ? [...new Set([...currentLevel.interrogativartikel, artikel])]
        : currentLevel.interrogativartikel.filter((value) => value !== artikel);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          interrogativartikel: nextArtikel,
          interrogativartikelKasus: {
            ...currentLevel.interrogativartikelKasus,
            [artikel]: nextKasus,
          },
        },
      };
    });
  };

  const toggleKasusGroupOption = (
    category: KasusGroupCategoryKey,
    kasusMapKey: KasusGroupMapKey,
    label: string,
    kasus: string
  ) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentKasus = currentLevel[kasusMapKey][label] ?? [];
      const nextKasus = currentKasus.includes(kasus)
        ? currentKasus.filter((value) => value !== kasus)
        : [...currentKasus, kasus];

      const nextValues = nextKasus.length > 0
        ? [...new Set([...currentLevel[category], label])]
        : currentLevel[category].filter((value) => value !== label);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          [category]: nextValues,
          [kasusMapKey]: {
            ...currentLevel[kasusMapKey],
            [label]: nextKasus,
          },
        },
      };
    });
  };

  const toggleAllKasusGroupOptions = (
    category: KasusGroupCategoryKey,
    kasusMapKey: KasusGroupMapKey,
    label: string,
    inheritedKasus: string[]
  ) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentKasus = currentLevel[kasusMapKey][label] ?? [];
      const nextKasus = getNextAllSuboptions(currentKasus, inheritedKasus, KASUS);
      const nextValues = nextKasus.length > 0
        ? [...new Set([...currentLevel[category], label])]
        : currentLevel[category].filter((value) => value !== label);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          [category]: nextValues,
          [kasusMapKey]: {
            ...currentLevel[kasusMapKey],
            [label]: nextKasus,
          },
        },
      };
    });
  };

  const toggleDerivationSuboption = (label: string, suboption: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentSubs = currentLevel.derivationSubs[label] ?? [];
      const nextSubs = currentSubs.includes(suboption)
        ? currentSubs.filter((value) => value !== suboption)
        : [...currentSubs, suboption];

      const nextDerivation = nextSubs.length > 0
        ? [...new Set([...currentLevel.derivation, label])]
        : currentLevel.derivation.filter((value) => value !== label);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          derivation: nextDerivation,
          derivationSubs: {
            ...currentLevel.derivationSubs,
            [label]: nextSubs,
          },
        },
      };
    });
  };

  const toggleAllDerivationSuboptions = (label: string, suboptions: readonly string[], inheritedSubs: string[]) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentSubs = currentLevel.derivationSubs[label] ?? [];
      const nextSubs = getNextAllSuboptions(currentSubs, inheritedSubs, suboptions);
      const nextDerivation = nextSubs.length > 0
        ? [...new Set([...currentLevel.derivation, label])]
        : currentLevel.derivation.filter((value) => value !== label);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          derivation: nextDerivation,
          derivationSubs: {
            ...currentLevel.derivationSubs,
            [label]: nextSubs,
          },
        },
      };
    });
  };

  const toggleKonversionSuboption = (label: string, suboption: string) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentSubs = currentLevel.konversionSubs[label] ?? [];
      const nextSubs = currentSubs.includes(suboption)
        ? currentSubs.filter((value) => value !== suboption)
        : [...currentSubs, suboption];

      const nextKonversion = nextSubs.length > 0
        ? [...new Set([...currentLevel.konversion, label])]
        : currentLevel.konversion.filter((value) => value !== label);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          konversion: nextKonversion,
          konversionSubs: {
            ...currentLevel.konversionSubs,
            [label]: nextSubs,
          },
        },
      };
    });
  };

  const toggleAllKonversionSuboptions = (label: string, suboptions: readonly string[], inheritedSubs: string[]) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentSubs = currentLevel.konversionSubs[label] ?? [];
      const nextSubs = getNextAllSuboptions(currentSubs, inheritedSubs, suboptions);
      const nextKonversion = nextSubs.length > 0
        ? [...new Set([...currentLevel.konversion, label])]
        : currentLevel.konversion.filter((value) => value !== label);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          konversion: nextKonversion,
          konversionSubs: {
            ...currentLevel.konversionSubs,
            [label]: nextSubs,
          },
        },
      };
    });
  };

  const toggleSyntaxSuboption = (
    category: "feldermodell" | "satzglieder" | "parataxe" | "hypotaxe" | "konnektoren" | "verbklassen" | "präpositionen" | "partikeln" | "adverbien" | "numeralia" | "negation",
    subsKey: "feldermodellSubs" | "satzgliederSubs" | "parataxeSubs" | "hypotaxeSubs" | "konnektorenSubs" | "verbklassenSubs" | "präpositionenSubs" | "partikelSubs" | "adverbienSubs" | "numeraliaSubs" | "negationSubs",
    label: string,
    suboption: string
  ) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentSubs = currentLevel[subsKey][label] ?? [];
      const nextSubs = currentSubs.includes(suboption)
        ? currentSubs.filter((value) => value !== suboption)
        : [...currentSubs, suboption];
      const nextValues = nextSubs.length > 0
        ? [...new Set([...currentLevel[category], label])]
        : currentLevel[category].filter((value) => value !== label);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          [category]: nextValues,
          [subsKey]: {
            ...currentLevel[subsKey],
            [label]: nextSubs,
          },
        },
      };
    });
  };

  const toggleAllSyntaxSuboptions = (
    category: "feldermodell" | "satzglieder" | "parataxe" | "hypotaxe" | "konnektoren" | "verbklassen" | "präpositionen" | "partikeln" | "adverbien" | "numeralia" | "negation",
    subsKey: "feldermodellSubs" | "satzgliederSubs" | "parataxeSubs" | "hypotaxeSubs" | "konnektorenSubs" | "verbklassenSubs" | "präpositionenSubs" | "partikelSubs" | "adverbienSubs" | "numeraliaSubs" | "negationSubs",
    label: string,
    suboptions: readonly string[],
    inheritedSubs: string[]
  ) => {
    setData((prev) => {
      const currentLevel = prev[activeLevel] ?? createEmptyLevelData();
      const currentSubs = currentLevel[subsKey][label] ?? [];
      const nextSubs = getNextAllSuboptions(currentSubs, inheritedSubs, suboptions);
      const nextValues = nextSubs.length > 0
        ? [...new Set([...currentLevel[category], label])]
        : currentLevel[category].filter((value) => value !== label);

      return {
        ...prev,
        [activeLevel]: {
          ...currentLevel,
          [category]: nextValues,
          [subsKey]: {
            ...currentLevel[subsKey],
            [label]: nextSubs,
          },
        },
      };
    });
  };

  const renderOptionList = ({
    title,
    options,
    selected,
    comments,
    inheritedSelected,
    inheritedComments,
    onToggle,
    onCommentChange,
  }: {
    title: string;
    options: readonly string[];
    selected: string[];
    comments: Record<string, string>;
    inheritedSelected: string[];
    inheritedComments: Record<string, string>;
    onToggle: (option: string) => void;
    onCommentChange: (option: string, comment: string) => void;
  }) => {
    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>{title}</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {options.map((option) => {
          const isInherited = inheritedSelected.includes(option);
          const isOwn = selected.includes(option);
          const isChecked = isInherited || isOwn;
          const commentValue = comments[option] ?? "";
          const inheritedPlaceholder = inheritedComments[option] ?? "";

          return (
            <div
              key={option}
              className="grid py-0.5 md:grid-cols-[65%_35%] md:items-center"
            >
              <label
                className={`flex items-center gap-2 py-1 pr-4 text-sm font-medium ${
                  isInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isInherited}
                  onChange={() => onToggle(option)}
                  className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                />
                <span>{option}</span>
                {isInherited ? (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                    geerbt
                  </span>
                ) : null}
              </label>

              <input
                type="text"
                value={commentValue}
                onChange={(event) => onCommentChange(option, event.target.value)}
                disabled={!isChecked}
                placeholder={inheritedPlaceholder}
                className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
              />
            </div>
          );
        })}
        </div>
      </div>
    );
  };

  const renderDemonstrativartikelList = () => {
    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>Demonstrativartikel</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {DEMONSTRATIVARTIKEL.map((artikel) => {
            const ownKasus = levelData.demonstrativartikelKasus[artikel] ?? [];
            const inheritedKasus = inherited.demonstrativartikelKasus[artikel] ?? [];
            const hasOwnKasus = ownKasus.length > 0;
            const hasInheritedKasus = inheritedKasus.length > 0;
            const isAllSelected = KASUS.every(
              (kasus) => inheritedKasus.includes(kasus) || ownKasus.includes(kasus)
            );
            const isAllInherited = KASUS.every((kasus) => inheritedKasus.includes(kasus));
            const commentValue = levelData.demonstrativartikelComments[artikel] ?? "";
            const inheritedPlaceholder = inherited.demonstrativartikelComments[artikel] ?? "";

            return (
              <div key={artikel} className="grid py-1 md:grid-cols-[65%_35%] md:items-center">
                <div className="py-1 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <label
                      className={`flex w-40 shrink-0 items-center gap-2 font-medium ${
                        isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={isAllInherited}
                        onChange={() =>
                          toggleAllArtikelKasus(
                            "demonstrativartikel",
                            "demonstrativartikelKasus",
                            artikel,
                            inheritedKasus
                          )
                        }
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span>{artikel}</span>
                    </label>
                    {renderSuboptionCheckboxes({
                      suboptions: KASUS,
                      ownSelected: ownKasus,
                      inheritedSelected: inheritedKasus,
                      onToggleSuboption: (kasus) => toggleDemonstrativartikelKasus(artikel, kasus),
                    })}
                    {hasInheritedKasus && !hasOwnKasus ? (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">geerbt</div>
                    ) : null}
                  </div>
                </div>

                <input
                  type="text"
                  value={commentValue}
                  onChange={(event) => updateComment("demonstrativartikelComments", artikel, event.target.value)}
                  disabled={!hasOwnKasus && !hasInheritedKasus ? true : !hasOwnKasus}
                  placeholder=""
                  className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPossessivartikelList = () => {
    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>Possessivartikel</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {POSSESSIVARTIKEL.map((artikel) => {
            const ownKasus = levelData.possessivartikelKasus[artikel] ?? [];
            const inheritedKasus = inherited.possessivartikelKasus[artikel] ?? [];
            const hasOwnKasus = ownKasus.length > 0;
            const hasInheritedKasus = inheritedKasus.length > 0;
            const isAllSelected = KASUS.every(
              (kasus) => inheritedKasus.includes(kasus) || ownKasus.includes(kasus)
            );
            const isAllInherited = KASUS.every((kasus) => inheritedKasus.includes(kasus));
            const commentValue = levelData.possessivartikelComments[artikel] ?? "";
            const inheritedPlaceholder = inherited.possessivartikelComments[artikel] ?? "";

            return (
              <div key={artikel} className="grid py-1 md:grid-cols-[65%_35%] md:items-center">
                <div className="py-1 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <label
                      className={`flex w-40 shrink-0 items-center gap-2 font-medium ${
                        isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={isAllInherited}
                        onChange={() =>
                          toggleAllArtikelKasus(
                            "possessivartikel",
                            "possessivartikelKasus",
                            artikel,
                            inheritedKasus
                          )
                        }
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span>{artikel}</span>
                    </label>
                    {renderSuboptionCheckboxes({
                      suboptions: KASUS,
                      ownSelected: ownKasus,
                      inheritedSelected: inheritedKasus,
                      onToggleSuboption: (kasus) => togglePossessivartikelKasus(artikel, kasus),
                    })}
                    {hasInheritedKasus && !hasOwnKasus ? (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">geerbt</div>
                    ) : null}
                  </div>
                </div>

                <input
                  type="text"
                  value={commentValue}
                  onChange={(event) => updateComment("possessivartikelComments", artikel, event.target.value)}
                  disabled={!hasOwnKasus && !hasInheritedKasus ? true : !hasOwnKasus}
                  placeholder=""
                  className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderIndefinitartikelList = () => {
    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>Indefinitartikel</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {INDEFINITARTIKEL.map((artikel) => {
            const ownKasus = levelData.indefinitartikelKasus[artikel] ?? [];
            const inheritedKasus = inherited.indefinitartikelKasus[artikel] ?? [];
            const hasOwnKasus = ownKasus.length > 0;
            const hasInheritedKasus = inheritedKasus.length > 0;
            const isAllSelected = KASUS.every(
              (kasus) => inheritedKasus.includes(kasus) || ownKasus.includes(kasus)
            );
            const isAllInherited = KASUS.every((kasus) => inheritedKasus.includes(kasus));
            const commentValue = levelData.indefinitartikelComments[artikel] ?? "";
            const inheritedPlaceholder = inherited.indefinitartikelComments[artikel] ?? "";

            return (
              <div key={artikel} className="grid py-1 md:grid-cols-[65%_35%] md:items-center">
                <div className="py-1 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <label
                      className={`flex w-40 shrink-0 items-center gap-2 font-medium ${
                        isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={isAllInherited}
                        onChange={() =>
                          toggleAllArtikelKasus(
                            "indefinitartikel",
                            "indefinitartikelKasus",
                            artikel,
                            inheritedKasus
                          )
                        }
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span>{artikel}</span>
                    </label>
                    {renderSuboptionCheckboxes({
                      suboptions: KASUS,
                      ownSelected: ownKasus,
                      inheritedSelected: inheritedKasus,
                      onToggleSuboption: (kasus) => toggleIndefinitartikelKasus(artikel, kasus),
                    })}
                    {hasInheritedKasus && !hasOwnKasus ? (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">geerbt</div>
                    ) : null}
                  </div>
                </div>

                <input
                  type="text"
                  value={commentValue}
                  onChange={(event) => updateComment("indefinitartikelComments", artikel, event.target.value)}
                  disabled={!hasOwnKasus && !hasInheritedKasus ? true : !hasOwnKasus}
                  placeholder=""
                  className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderInterrogativartikelList = () => {
    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>Interrogativartikel</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {INTERROGATIVARTIKEL.map((artikel) => {
            const ownKasus = levelData.interrogativartikelKasus[artikel] ?? [];
            const inheritedKasus = inherited.interrogativartikelKasus[artikel] ?? [];
            const hasOwnKasus = ownKasus.length > 0;
            const hasInheritedKasus = inheritedKasus.length > 0;
            const isAllSelected = KASUS.every(
              (kasus) => inheritedKasus.includes(kasus) || ownKasus.includes(kasus)
            );
            const isAllInherited = KASUS.every((kasus) => inheritedKasus.includes(kasus));
            const commentValue = levelData.interrogativartikelComments[artikel] ?? "";
            const inheritedPlaceholder = inherited.interrogativartikelComments[artikel] ?? "";

            return (
              <div key={artikel} className="grid py-1 md:grid-cols-[65%_35%] md:items-center">
                <div className="py-1 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <label
                      className={`flex w-40 shrink-0 items-center gap-2 font-medium ${
                        isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={isAllInherited}
                        onChange={() =>
                          toggleAllArtikelKasus(
                            "interrogativartikel",
                            "interrogativartikelKasus",
                            artikel,
                            inheritedKasus
                          )
                        }
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span>{artikel}</span>
                    </label>
                    {renderSuboptionCheckboxes({
                      suboptions: KASUS,
                      ownSelected: ownKasus,
                      inheritedSelected: inheritedKasus,
                      onToggleSuboption: (kasus) => toggleInterrogativartikelKasus(artikel, kasus),
                    })}
                    {hasInheritedKasus && !hasOwnKasus ? (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">geerbt</div>
                    ) : null}
                  </div>
                </div>

                <input
                  type="text"
                  value={commentValue}
                  onChange={(event) => updateComment("interrogativartikelComments", artikel, event.target.value)}
                  disabled={!hasOwnKasus && !hasInheritedKasus ? true : !hasOwnKasus}
                  placeholder=""
                  className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderKasusGroupsTable = (
    rows: Array<
      | {
          kind: "kasus";
          title: string;
          category: KasusGroupCategoryKey;
          kasusMapKey: KasusGroupMapKey;
          commentKey: CommentKey;
        }
      | {
          kind: "simple";
          title: string;
          category: "diversePronomen";
          commentKey: "diversePronomenComments";
        }
    >
  ) => {
    return (
      <div className="mt-2">
        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {rows.map((row) => {
            if (row.kind === "simple") {
              const isInherited = inherited.diversePronomen.includes(row.title);
              const isOwn = levelData.diversePronomen.includes(row.title);
              const isChecked = isInherited || isOwn;
              const commentValue = levelData.diversePronomenComments[row.title] ?? "";
              const inheritedPlaceholder = inherited.diversePronomenComments[row.title] ?? "";

              return (
                <div key={row.title} className="grid py-1 md:grid-cols-[65%_35%] md:items-center">
                  <label className={`flex items-center gap-2 py-1 pr-4 text-sm font-medium ${
                    isInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                  }`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isInherited}
                      onChange={() => toggleOption("diversePronomen", row.title)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span>{row.title}</span>
                    {isInherited ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        geerbt
                      </span>
                    ) : null}
                  </label>

                  <input
                    type="text"
                    value={commentValue}
                    onChange={(event) => updateComment("diversePronomenComments", row.title, event.target.value)}
                    disabled={!isChecked || isInherited}
                    placeholder=""
                    className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                  />
                </div>
              );
            }

            const ownKasus = levelData[row.kasusMapKey][row.title] ?? [];
            const inheritedKasus = inherited[row.kasusMapKey][row.title] ?? [];
            const hasOwnKasus = ownKasus.length > 0;
            const hasInheritedKasus = inheritedKasus.length > 0;
            const isAllSelected = KASUS.every(
              (kasus) => inheritedKasus.includes(kasus) || ownKasus.includes(kasus)
            );
            const isAllInherited = KASUS.every((kasus) => inheritedKasus.includes(kasus));
            const commentValue = levelData[row.commentKey][row.title] ?? "";
            const inheritedPlaceholder = inherited[row.commentKey][row.title] ?? "";

            return (
              <div key={row.title} className="grid py-1 md:grid-cols-[65%_35%] md:items-center">
                <div className="py-1 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <label
                      className={`flex w-40 shrink-0 items-center gap-2 font-medium ${
                        isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={isAllInherited}
                        onChange={() =>
                          toggleAllKasusGroupOptions(row.category, row.kasusMapKey, row.title, inheritedKasus)
                        }
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span>{row.title}</span>
                    </label>
                    {renderSuboptionCheckboxes({
                      suboptions: KASUS,
                      ownSelected: ownKasus,
                      inheritedSelected: inheritedKasus,
                      onToggleSuboption: (kasus) =>
                        toggleKasusGroupOption(row.category, row.kasusMapKey, row.title, kasus),
                    })}
                    {hasInheritedKasus && !hasOwnKasus ? (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">geerbt</div>
                    ) : null}
                  </div>
                </div>

                <input
                  type="text"
                  value={commentValue}
                  onChange={(event) => updateComment(row.commentKey, row.title, event.target.value)}
                  disabled={!hasOwnKasus && !hasInheritedKasus ? true : !hasOwnKasus}
                  placeholder=""
                  className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDerivationList = () => {
    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>Derivation (Ableitung)</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {DERIVATION.map((option) => {
            const suboptions = DERIVATION_SUBOPTIONS[option];

            if (!suboptions) {
              const isInherited = inherited.derivation.includes(option);
              const isOwn = levelData.derivation.includes(option);
              const isChecked = isInherited || isOwn;
              const commentValue = levelData.derivationComments[option] ?? "";
              const inheritedPlaceholder = inherited.derivationComments[option] ?? "";

              return (
                <div key={option} className="grid py-0.5 md:grid-cols-[65%_35%] md:items-center">
                  <label
                    className={`flex items-center gap-2 py-1 pr-4 text-sm font-medium ${
                      isInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isInherited}
                      onChange={() => toggleOption("derivation", option)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span>{option}</span>
                    {isInherited ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        geerbt
                      </span>
                    ) : null}
                  </label>

                  <input
                    type="text"
                    value={commentValue}
                    onChange={(event) => updateComment("derivationComments", option, event.target.value)}
                    disabled={!isChecked || isInherited}
                    placeholder=""
                    className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                  />
                </div>
              );
            }

            const ownSubs = levelData.derivationSubs[option] ?? [];
            const inheritedSubs = inherited.derivationSubs[option] ?? [];
            const hasOwnSubs = ownSubs.length > 0;
            const hasInheritedSubs = inheritedSubs.length > 0;
            const isAllSelected = suboptions.every(
              (suboption) => inheritedSubs.includes(suboption) || ownSubs.includes(suboption)
            );
            const isAllInherited = suboptions.every((suboption) => inheritedSubs.includes(suboption));
            const commentValue = levelData.derivationComments[option] ?? "";
            const inheritedPlaceholder = inherited.derivationComments[option] ?? "";

            return (
              <div key={option} className="grid py-1 md:grid-cols-[65%_35%] md:items-center">
                <div className="py-1 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <label
                      className={`flex w-40 shrink-0 items-center gap-2 font-medium ${
                        isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={isAllInherited}
                        onChange={() => toggleAllDerivationSuboptions(option, suboptions, inheritedSubs)}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span>{option}</span>
                    </label>
                    {renderSuboptionCheckboxes({
                      suboptions,
                      ownSelected: ownSubs,
                      inheritedSelected: inheritedSubs,
                      onToggleSuboption: (suboption) => toggleDerivationSuboption(option, suboption),
                    })}
                    {hasInheritedSubs && !hasOwnSubs ? (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">geerbt</div>
                    ) : null}
                  </div>
                </div>

                <input
                  type="text"
                  value={commentValue}
                  onChange={(event) => updateComment("derivationComments", option, event.target.value)}
                  disabled={!hasOwnSubs && !hasInheritedSubs ? true : !hasOwnSubs}
                  placeholder=""
                  className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderKonversionList = () => {
    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>Konversion</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {KONVERSION.map((option) => {
            const suboptions = KONVERSION_SUBOPTIONS[option];

            if (!suboptions) {
              const isInherited = inherited.konversion.includes(option);
              const isOwn = levelData.konversion.includes(option);
              const isChecked = isInherited || isOwn;
              const commentValue = levelData.konversionComments[option] ?? "";
              const inheritedPlaceholder = inherited.konversionComments[option] ?? "";

              return (
                <div key={option} className="grid py-0.5 md:grid-cols-[65%_35%] md:items-center">
                  <label
                    className={`flex items-center gap-2 py-1 pr-4 text-sm font-medium ${
                      isInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isInherited}
                      onChange={() => toggleOption("konversion", option)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span>{option}</span>
                    {isInherited ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        geerbt
                      </span>
                    ) : null}
                  </label>

                  <input
                    type="text"
                    value={commentValue}
                    onChange={(event) => updateComment("konversionComments", option, event.target.value)}
                    disabled={!isChecked || isInherited}
                    placeholder=""
                    className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                  />
                </div>
              );
            }

            const ownSubs = levelData.konversionSubs[option] ?? [];
            const inheritedSubs = inherited.konversionSubs[option] ?? [];
            const hasOwnSubs = ownSubs.length > 0;
            const hasInheritedSubs = inheritedSubs.length > 0;
            const isAllSelected = suboptions.every(
              (suboption) => inheritedSubs.includes(suboption) || ownSubs.includes(suboption)
            );
            const isAllInherited = suboptions.every((suboption) => inheritedSubs.includes(suboption));
            const commentValue = levelData.konversionComments[option] ?? "";
            const inheritedPlaceholder = inherited.konversionComments[option] ?? "";

            return (
              <div key={option} className="grid py-1 md:grid-cols-[65%_35%] md:items-center">
                <div className="py-1 pr-4 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    <label
                      className={`flex w-40 shrink-0 items-center gap-2 font-medium ${
                        isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        disabled={isAllInherited}
                        onChange={() => toggleAllKonversionSuboptions(option, suboptions, inheritedSubs)}
                        className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                      />
                      <span>{option}</span>
                    </label>
                    {renderSuboptionCheckboxes({
                      suboptions,
                      ownSelected: ownSubs,
                      inheritedSelected: inheritedSubs,
                      onToggleSuboption: (suboption) => toggleKonversionSuboption(option, suboption),
                    })}
                    {hasInheritedSubs && !hasOwnSubs ? (
                      <div className="text-xs text-zinc-400 dark:text-zinc-500">geerbt</div>
                    ) : null}
                  </div>
                </div>

                <input
                  type="text"
                  value={commentValue}
                  onChange={(event) => updateComment("konversionComments", option, event.target.value)}
                  disabled={!hasOwnSubs && !hasInheritedSubs ? true : !hasOwnSubs}
                  placeholder=""
                  className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPräpositionenSection = () => {
    const selected = levelData.präpositionen ?? [];
    const ownSubs = levelData.präpositionenSubs ?? {};
    const comments = levelData.präpositionenComments ?? {};
    const inheritedSelected = inherited.präpositionen ?? [];
    const inheritedSubs = inherited.präpositionenSubs ?? {};
    const inheritedComments = inherited.präpositionenComments ?? {};

    return (
      <div className="mt-2">
        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {Object.entries(PRÄPOSITIONEN_GROUPS).map(([category, items]) => (
            <div key={category} className="pt-2">
              {/* Category header — plain label, no checkbox */}
              <div className="border-b border-zinc-100 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {category}
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => {
                const suboptions = PRÄPOSITIONEN_SUBOPTIONS[item] ?? [];
                const ownItemSubs = ownSubs[item] ?? [];
                const inheritedItemSubs = inheritedSubs[item] ?? [];
                const hasOwnSubs = ownItemSubs.length > 0;
                const hasInheritedSubs = inheritedItemSubs.length > 0;
                const isAllSelected = suboptions.every(
                  (s) => inheritedItemSubs.includes(s) || ownItemSubs.includes(s)
                );
                const isAllInherited = suboptions.every((s) => inheritedItemSubs.includes(s));
                const commentValue = comments[item] ?? "";

                return (
                  <div key={item} className="py-1">
                    <div className="grid md:grid-cols-[65%_35%] md:items-center">
                      <label
                        className={`flex items-center gap-2 py-0.5 pr-4 text-sm font-medium ${
                          isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          disabled={isAllInherited}
                          onChange={() => toggleAllSyntaxSuboptions("präpositionen", "präpositionenSubs", item, suboptions, inheritedItemSubs)}
                          className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                        />
                        <span>{item}</span>
                        {hasInheritedSubs && !hasOwnSubs ? (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                            geerbt
                          </span>
                        ) : null}
                      </label>
                      <input
                        type="text"
                        value={commentValue}
                        onChange={(event) => updateComment("präpositionenComments", item, event.target.value)}
                        disabled={!hasOwnSubs && !hasInheritedSubs ? true : !hasOwnSubs}
                        placeholder=""
                        className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                      />
                    </div>
                    {renderSuboptionCheckboxes({
                      suboptions,
                      ownSelected: ownItemSubs,
                      inheritedSelected: inheritedItemSubs,
                      onToggleSuboption: (suboption) => toggleSyntaxSuboption("präpositionen", "präpositionenSubs", item, suboption),
                      containerClassName: item === "Präpositionale Mehrworteinheiten" ? "mt-1 grid grid-cols-5 gap-x-4 gap-y-1 pl-6" : "mt-1 grid grid-cols-8 gap-x-4 gap-y-1 pl-6",
                    })}
                  </div>
                );
              })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSyntaxGroupedList = ({
    title,
    options,
    suboptionsMap,
    selected,
    subs,
    comments,
    inheritedSelected,
    inheritedSubs,
    inheritedComments,
    category,
    subsKey,
    commentKey,
    subRowClassName,
    subRowClassNameMap,
  }: {
    title: string;
    options: readonly string[];
    suboptionsMap: Record<string, readonly string[]>;
    selected: string[];
    subs: Record<string, string[]>;
    comments: Record<string, string>;
    inheritedSelected: string[];
    inheritedSubs: Record<string, string[]>;
    inheritedComments: Record<string, string>;
    category: "feldermodell" | "satzglieder" | "parataxe" | "hypotaxe" | "konnektoren" | "verbklassen" | "präpositionen" | "partikeln" | "adverbien" | "numeralia" | "negation";
    subsKey:
      | "feldermodellSubs"
      | "satzgliederSubs"
      | "parataxeSubs"
      | "hypotaxeSubs"
      | "konnektorenSubs"
      | "verbklassenSubs"
      | "präpositionenSubs"
      | "partikelSubs"
      | "adverbienSubs"
      | "numeraliaSubs"
      | "negationSubs";
    commentKey: CommentKey;
    subRowClassName?: string;
    subRowClassNameMap?: Record<string, string>;
  }) => {
    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>{title}</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {options.map((option) => {
            const suboptions = suboptionsMap[option];

            if (!suboptions) {
              const isInherited = inheritedSelected.includes(option);
              const isOwn = selected.includes(option);
              const isChecked = isInherited || isOwn;
              const commentValue = comments[option] ?? "";
              const inheritedPlaceholder = inheritedComments[option] ?? "";

              return (
                <div key={option} className="grid py-0.5 md:grid-cols-[65%_35%] md:items-center">
                  <label
                    className={`flex items-center gap-2 py-1 pr-4 text-sm font-medium ${
                      isInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isInherited}
                      onChange={() => toggleOption(category, option)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span>{option}</span>
                    {isInherited ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        geerbt
                      </span>
                    ) : null}
                  </label>

                  <input
                    type="text"
                    value={commentValue}
                    onChange={(event) => updateComment(commentKey, option, event.target.value)}
                    disabled={!isChecked || isInherited}
                    placeholder=""
                    className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                  />
                </div>
              );
            }

            const ownSubs = subs[option] ?? [];
            const inheritedSubvalues = inheritedSubs[option] ?? [];
            const hasOwnSubs = ownSubs.length > 0;
            const hasInheritedSubs = inheritedSubvalues.length > 0;
            const isAllSelected = suboptions.every(
              (suboption) => inheritedSubvalues.includes(suboption) || ownSubs.includes(suboption)
            );
            const isAllInherited = suboptions.every((suboption) => inheritedSubvalues.includes(suboption));
            const commentValue = comments[option] ?? "";
            const inheritedPlaceholder = inheritedComments[option] ?? "";

            return (
              <div key={option} className="py-1">
                <div className="grid md:grid-cols-[65%_35%] md:items-center">
                  <label
                    className={`flex items-center gap-2 py-0.5 pr-4 text-sm font-medium ${
                      isAllInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      disabled={isAllInherited}
                      onChange={() => toggleAllSyntaxSuboptions(category, subsKey, option, suboptions, inheritedSubvalues)}
                      className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span>{option}</span>
                    {hasInheritedSubs && !hasOwnSubs ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                        geerbt
                      </span>
                    ) : null}
                  </label>

                  <input
                    type="text"
                    value={commentValue}
                    onChange={(event) => updateComment(commentKey, option, event.target.value)}
                    disabled={!hasOwnSubs && !hasInheritedSubs ? true : !hasOwnSubs}
                    placeholder=""
                    className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                  />
                </div>

                {renderSuboptionCheckboxes({
                  suboptions,
                  ownSelected: ownSubs,
                  inheritedSelected: inheritedSubvalues,
                  onToggleSuboption: (suboption) => toggleSyntaxSuboption(category, subsKey, option, suboption),
                  containerClassName: subRowClassNameMap?.[option] ?? subRowClassName ?? "mt-1 flex flex-wrap gap-x-4 gap-y-1 pl-6",
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSatzkomplexitaetList = () => {
    const hasInheritedVerschachtelung = inherited.maximaleVerschachtelungstiefe !== "";
    const hasOwnVerschachtelung = levelData.maximaleVerschachtelungstiefe !== "";
    const hasInheritedSatzlaenge = inherited.maximaleEmpfohleneSatzlaenge !== "";
    const hasOwnSatzlaenge = levelData.maximaleEmpfohleneSatzlaenge !== "";

    return (
      <div className="mt-2">
        <div className="grid grid-cols-[65%_35%] border-b border-zinc-200 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div>Satzlänge und Komplexität</div>
          <div></div>
        </div>

        <div className="divide-y divide-zinc-200 border-b border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          <div className="grid py-0.5 md:grid-cols-[65%_35%] md:items-center">
            <div className="flex items-center gap-2 py-1 pr-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <span>Maximale Verschachtelungstiefe</span>
              {hasInheritedVerschachtelung && !hasOwnVerschachtelung ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  geerbt
                </span>
              ) : null}
            </div>

            <input
              type="number"
              min="0"
              value={hasOwnVerschachtelung ? levelData.maximaleVerschachtelungstiefe : inherited.maximaleVerschachtelungstiefe}
              onChange={(event) => updateNumberField("maximaleVerschachtelungstiefe", event.target.value)}
              disabled={hasInheritedVerschachtelung && !hasOwnVerschachtelung}
              className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
            />
          </div>

          <div className="grid py-0.5 md:grid-cols-[65%_35%] md:items-center">
            <div className="flex items-center gap-2 py-1 pr-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <span>Maximale / empfohlene Satzlänge</span>
              {hasInheritedSatzlaenge && !hasOwnSatzlaenge ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  geerbt
                </span>
              ) : null}
            </div>

            <input
              type="number"
              min="0"
              value={hasOwnSatzlaenge ? levelData.maximaleEmpfohleneSatzlaenge : inherited.maximaleEmpfohleneSatzlaenge}
              onChange={(event) => updateNumberField("maximaleEmpfohleneSatzlaenge", event.target.value)}
              disabled={hasInheritedSatzlaenge && !hasOwnSatzlaenge}
              className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
            />
          </div>

          {SATZKOMPLEXITAET_CHECKS.map((option) => {
            const isInherited = inherited.satzkomplexitaetChecks.includes(option);
            const isOwn = levelData.satzkomplexitaetChecks.includes(option);
            const isChecked = isInherited || isOwn;
            const commentValue = levelData.satzkomplexitaetComments[option] ?? "";
            const inheritedPlaceholder = inherited.satzkomplexitaetComments[option] ?? "";

            return (
              <div key={option} className="grid py-0.5 md:grid-cols-[65%_35%] md:items-center">
                <label
                  className={`flex items-center gap-2 py-1 pr-4 text-sm font-medium ${
                    isInherited ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isInherited}
                    onChange={() => toggleOption("satzkomplexitaetChecks", option)}
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                  />
                  <span>{option}</span>
                  {isInherited ? (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                      geerbt
                    </span>
                  ) : null}
                </label>

                <input
                  type="text"
                  value={commentValue}
                  onChange={(event) => updateComment("satzkomplexitaetComments", option, event.target.value)}
                  disabled={!isChecked || isInherited}
                  placeholder=""
                  className="w-full bg-zinc-50 px-2 py-0.5 text-xs text-zinc-900 placeholder:text-zinc-400 outline-none disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-500"
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Niveauregeln</h1>
          {updatedAt ? (
            <p className="text-xs text-zinc-400">
              Zuletzt gespeichert: {new Date(updatedAt).toLocaleString("de-CH")}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges ? (
            <Button size="sm" variant="ghost" onClick={() => setData(normalizeStoredData(savedData))}>
              <RotateCcw className="size-3" /> Zurücksetzen
            </Button>
          ) : null}

          <Button size="sm" onClick={saveRules} disabled={saving || !hasChanges}>
            {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
            Speichern
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600 dark:bg-green-950/50 dark:text-green-400">
          Gespeichert.
        </p>
      ) : null}

      {/* Tab bar */}
      <div className="flex items-center gap-3">
        <div className="flex gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeLevel === level
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {activeLevel === "A1.1" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={applyA11Seed}
              disabled={saving}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Vorbefüllen (Vorschau)
            </button>
            <button
              onClick={applyA11SeedAndSave}
              disabled={saving}
              className="rounded-md border border-zinc-400 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {saving ? "Speichere…" : "Neu befüllen + Speichern"}
            </button>
          </div>
        ) : null}
        {activeLevel === "A1.2" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={applyA12Seed}
              disabled={saving}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Vorbefüllen (Vorschau)
            </button>
            <button
              onClick={applyA12SeedAndSave}
              disabled={saving}
              className="rounded-md border border-zinc-400 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {saving ? "Speichere…" : "Neu befüllen + Speichern"}
            </button>
          </div>
        ) : null}
        {activeLevel === "A2.1" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={applyA21Seed}
              disabled={saving}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Vorbefüllen (Vorschau)
            </button>
            <button
              onClick={applyA21SeedAndSave}
              disabled={saving}
              className="rounded-md border border-zinc-400 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {saving ? "Speichere…" : "Neu befüllen + Speichern"}
            </button>
          </div>
        ) : null}
        {activeLevel === "A2.2" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={applyA22Seed}
              disabled={saving}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Vorbefüllen (Vorschau)
            </button>
            <button
              onClick={applyA22SeedAndSave}
              disabled={saving}
              className="rounded-md border border-zinc-400 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {saving ? "Speichere…" : "Neu befüllen + Speichern"}
            </button>
          </div>
        ) : null}
        {activeLevel === "B1.1" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={applyB11Seed}
              disabled={saving}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Vorbefüllen (Vorschau)
            </button>
            <button
              onClick={applyB11SeedAndSave}
              disabled={saving}
              className="rounded-md border border-zinc-400 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {saving ? "Speichere…" : "Neu befüllen + Speichern"}
            </button>
          </div>
        ) : null}
        {activeLevel === "B1.2" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={applyB12Seed}
              disabled={saving}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Vorbefüllen (Vorschau)
            </button>
            <button
              onClick={applyB12SeedAndSave}
              disabled={saving}
              className="rounded-md border border-zinc-400 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
            >
              {saving ? "Speichere…" : "Neu befüllen + Speichern"}
            </button>
          </div>
        ) : null}
      </div>

      {/* Morphologie */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Morphologie</h2>

        {/* Tab content */}
        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">

          {/* Flexionsmorphologie */}
          <section>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Flexionsmorphologie</h3>
            <h4 className="mt-4 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Verbflexion
            </h4>

            {/* Tempus */}
            <div className="mt-3">
              {renderOptionList({
                title: "Tempus",
                options: TEMPORA,
                selected: levelData.tempora,
                comments: levelData.temporaComments,
                inheritedSelected: inherited.tempora,
                inheritedComments: inherited.temporaComments,
                onToggle: (option) => toggleOption("tempora", option),
                onCommentChange: (option, comment) => updateComment("temporaComments", option, comment),
              })}
            </div>

            {/* Modus */}
            <div className="mt-4">
              {renderOptionList({
                title: "Modus",
                options: MODI,
                selected: levelData.modi,
                comments: levelData.modiComments,
                inheritedSelected: inherited.modi,
                inheritedComments: inherited.modiComments,
                onToggle: (option) => toggleOption("modi", option),
                onCommentChange: (option, comment) => updateComment("modiComments", option, comment),
              })}
            </div>

            <div className="mt-4">
              {renderOptionList({
                title: "Genus Verbi",
                options: GENUS_VERBI,
                selected: levelData.genusVerbi,
                comments: levelData.genusVerbiComments,
                inheritedSelected: inherited.genusVerbi,
                inheritedComments: inherited.genusVerbiComments,
                onToggle: (option) => toggleOption("genusVerbi", option),
                onCommentChange: (option, comment) => updateComment("genusVerbiComments", option, comment),
              })}
            </div>

            {/* Infinite Verbformen */}
            <div className="mt-4">
              {renderOptionList({
                title: "Infinite Verbformen",
                options: INFINITE_VERBFORMEN,
                selected: levelData.infiniteVerbformen,
                comments: levelData.infiniteVerbformenComments,
                inheritedSelected: inherited.infiniteVerbformen,
                inheritedComments: inherited.infiniteVerbformenComments,
                onToggle: (option) => toggleOption("infiniteVerbformen", option),
                onCommentChange: (option, comment) => updateComment("infiniteVerbformenComments", option, comment),
              })}
            </div>

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Nominalflexion
            </h4>

            <div className="mt-3">
              {renderOptionList({
                title: "Kasus",
                options: KASUS,
                selected: levelData.kasus,
                comments: levelData.kasusComments,
                inheritedSelected: inherited.kasus,
                inheritedComments: inherited.kasusComments,
                onToggle: (option) => toggleOption("kasus", option),
                onCommentChange: (option, comment) => updateComment("kasusComments", option, comment),
              })}
            </div>

            <div className="mt-4">
              {renderOptionList({
                title: "Deklinationsklassen",
                options: DEKLINATIONSKLASSEN,
                selected: levelData.deklinationsklassen,
                comments: levelData.deklinationsklassenComments,
                inheritedSelected: inherited.deklinationsklassen,
                inheritedComments: inherited.deklinationsklassenComments,
                onToggle: (option) => toggleOption("deklinationsklassen", option),
                onCommentChange: (option, comment) =>
                  updateComment("deklinationsklassenComments", option, comment),
              })}
            </div>

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Adjektivflexion
            </h4>

            <div className="mt-3">
              {renderOptionList({
                title: "Deklination",
                options: ADJEKTIV_DEKLINATION,
                selected: levelData.adjektivDeklination,
                comments: levelData.adjektivDeklinationComments,
                inheritedSelected: inherited.adjektivDeklination,
                inheritedComments: inherited.adjektivDeklinationComments,
                onToggle: (option) => toggleOption("adjektivDeklination", option),
                onCommentChange: (option, comment) =>
                  updateComment("adjektivDeklinationComments", option, comment),
              })}
            </div>

            <div className="mt-4">
              {renderOptionList({
                title: "Komparation",
                options: STEIGERUNG,
                selected: levelData.steigerung,
                comments: levelData.steigerungComments,
                inheritedSelected: inherited.steigerung,
                inheritedComments: inherited.steigerungComments,
                onToggle: (option) => toggleOption("steigerung", option),
                onCommentChange: (option, comment) => updateComment("steigerungComments", option, comment),
              })}
            </div>

            <div className="mt-4">
              {renderOptionList({
                title: "Verwendung",
                options: ADJEKTIV_VERWENDUNG,
                selected: levelData.adjektivVerwendung,
                comments: levelData.adjektivVerwendungComments,
                inheritedSelected: inherited.adjektivVerwendung,
                inheritedComments: inherited.adjektivVerwendungComments,
                onToggle: (option) => toggleOption("adjektivVerwendung", option),
                onCommentChange: (option, comment) =>
                  updateComment("adjektivVerwendungComments", option, comment),
              })}
            </div>

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Artikelwörter / Determinatoren
            </h4>

            <div className="mt-3">
              {renderOptionList({
                title: "Artikel",
                options: BESTIMMTER_ARTIKEL,
                selected: [...levelData.bestimmterArtikel, ...levelData.negationsartikel],
                comments: {
                  ...levelData.bestimmterArtikelComments,
                  ...levelData.negationsartikelComments,
                },
                inheritedSelected: [...inherited.bestimmterArtikel, ...inherited.negationsartikel],
                inheritedComments: {
                  ...inherited.bestimmterArtikelComments,
                  ...inherited.negationsartikelComments,
                },
                onToggle: (option) =>
                  toggleOption(option === "Negationsartikel" ? "negationsartikel" : "bestimmterArtikel", option),
                onCommentChange: (option, comment) =>
                  updateComment(
                    option === "Negationsartikel" ? "negationsartikelComments" : "bestimmterArtikelComments",
                    option,
                    comment
                  ),
              })}
            </div>

            <div className="mt-4">
              {renderDemonstrativartikelList()}
            </div>

            <div className="mt-4">
              {renderPossessivartikelList()}
            </div>

            <div className="mt-4">
              {renderIndefinitartikelList()}
            </div>

            <div className="mt-4">
              {renderInterrogativartikelList()}
            </div>

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Pronomen
            </h4>

            <div className="mt-3">
              {renderKasusGroupsTable([
                {
                  kind: "kasus",
                  title: "Personalpronomen",
                  category: "personalpronomen",
                  kasusMapKey: "personalpronomenKasus",
                  commentKey: "personalpronomenComments",
                },
                {
                  kind: "kasus",
                  title: "Reflexivpronomen",
                  category: "reflexivpronomen",
                  kasusMapKey: "reflexivpronomenKasus",
                  commentKey: "reflexivpronomenComments",
                },
                {
                  kind: "kasus",
                  title: "Demonstrativpronomen",
                  category: "demonstrativpronomen",
                  kasusMapKey: "demonstrativpronomenKasus",
                  commentKey: "demonstrativpronomenComments",
                },
                {
                  kind: "kasus",
                  title: "Indefinitpronomen",
                  category: "indefinitpronomen",
                  kasusMapKey: "indefinitpronomenKasus",
                  commentKey: "indefinitpronomenComments",
                },
                {
                  kind: "kasus",
                  title: "Interrogativpronomen",
                  category: "interrogativpronomen",
                  kasusMapKey: "interrogativpronomenKasus",
                  commentKey: "interrogativpronomenComments",
                },
                {
                  kind: "kasus",
                  title: "Possessivpronomen",
                  category: "possessivpronomen",
                  kasusMapKey: "possessivpronomenKasus",
                  commentKey: "possessivpronomenComments",
                },
                {
                  kind: "simple",
                  title: "Reziprokpronomen",
                  category: "diversePronomen",
                  commentKey: "diversePronomenComments",
                },
                {
                  kind: "simple",
                  title: "Pronominaladverbien",
                  category: "diversePronomen",
                  commentKey: "diversePronomenComments",
                },
              ])}
            </div>

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Wortbildungsmorphologie
            </h4>

            <div className="mt-3">
              {renderOptionList({
                title: "Komposition",
                options: KOMPOSITION,
                selected: levelData.komposition,
                comments: levelData.kompositionComments,
                inheritedSelected: inherited.komposition,
                inheritedComments: inherited.kompositionComments,
                onToggle: (option) => toggleOption("komposition", option),
                onCommentChange: (option, comment) =>
                  updateComment("kompositionComments", option, comment),
              })}
            </div>

            <div className="mt-4">
              {renderDerivationList()}
            </div>

            <div className="mt-4">
              {renderKonversionList()}
            </div>

            <div className="mt-4">
              {renderOptionList({
                title: "Fugenmorpheme",
                options: FUGENMORPHEME,
                selected: levelData.fugenmorpheme,
                comments: levelData.fugenmorphemeComments,
                inheritedSelected: inherited.fugenmorpheme,
                inheritedComments: inherited.fugenmorphemeComments,
                onToggle: (option) => toggleOption("fugenmorpheme", option),
                onCommentChange: (option, comment) =>
                  updateComment("fugenmorphemeComments", option, comment),
              })}
            </div>

          </section>{/* /Flexionsmorphologie */}
        </div>
      </section>{/* /Morphologie */}

      {/* Verbklassifikation */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Verbklassifikation / Verbarten</h2>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            {renderSyntaxGroupedList({
              title: "Verbklassifikation",
              options: VERBKLASSEN,
              suboptionsMap: VERBKLASSEN_SUBOPTIONS,
              subRowClassName: "mt-1 grid grid-cols-5 gap-x-4 gap-y-1 pl-6",
              category: "verbklassen",
              subsKey: "verbklassenSubs",
              commentKey: "verbklassenComments",
              selected: levelData.verbklassen,
              subs: levelData.verbklassenSubs,
              comments: levelData.verbklassenComments,
              inheritedSelected: inherited.verbklassen,
              inheritedSubs: inherited.verbklassenSubs,
              inheritedComments: inherited.verbklassenComments,
            })}
          </section>
        </div>
      </section>{/* /Verbklassifikation */}

      {/* Präpositionen */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Präpositionen</h2>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            {renderPräpositionenSection()}
          </section>
        </div>
      </section>{/* /Präpositionen */}

      {/* Partikeln */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Partikeln</h2>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            {renderSyntaxGroupedList({
              title: "Partikeln",
              options: PARTIKELN,
              suboptionsMap: PARTIKELN_SUBOPTIONS,
              subRowClassName: "mt-1 grid grid-cols-7 gap-x-4 gap-y-1 pl-6",
              category: "partikeln",
              subsKey: "partikelSubs",
              commentKey: "partikelComments",
              selected: levelData.partikeln,
              subs: levelData.partikelSubs,
              comments: levelData.partikelComments,
              inheritedSelected: inherited.partikeln,
              inheritedSubs: inherited.partikelSubs,
              inheritedComments: inherited.partikelComments,
            })}
          </section>
        </div>
      </section>{/* /Partikeln */}

      {/* Adverbien */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Adverbien</h2>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            {renderSyntaxGroupedList({
              title: "Adverbien",
              options: ADVERBIEN,
              suboptionsMap: ADVERBIEN_SUBOPTIONS,
              subRowClassName: "mt-1 grid grid-cols-8 gap-x-4 gap-y-1 pl-6",
              category: "adverbien",
              subsKey: "adverbienSubs",
              commentKey: "adverbienComments",
              selected: levelData.adverbien,
              subs: levelData.adverbienSubs,
              comments: levelData.adverbienComments,
              inheritedSelected: inherited.adverbien,
              inheritedSubs: inherited.adverbienSubs,
              inheritedComments: inherited.adverbienComments,
            })}
          </section>
        </div>
      </section>{/* /Adverbien */}

      {/* Numeralia */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Numeralia</h2>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            {renderOptionList({
              title: "Numeralia",
              options: NUMERALIA,
              selected: levelData.numeralia,
              comments: levelData.numeraliaComments,
              inheritedSelected: inherited.numeralia,
              inheritedComments: inherited.numeraliaComments,
              onToggle: (option) => toggleOption("numeralia", option),
              onCommentChange: (option, comment) => updateComment("numeraliaComments", option, comment),
            })}
          </section>
        </div>
      </section>{/* /Numeralia */}

      {/* Negation */}
      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Negation</h2>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            {renderSyntaxGroupedList({
              title: "Negation",
              options: NEGATION_ITEMS,
              suboptionsMap: NEGATION_SUBOPTIONS,
              subRowClassName: "mt-1 grid grid-cols-6 gap-x-4 gap-y-1 pl-6",
              category: "negation",
              subsKey: "negationSubs",
              commentKey: "negationComments",
              selected: levelData.negation,
              subs: levelData.negationSubs,
              comments: levelData.negationComments,
              inheritedSelected: inherited.negation,
              inheritedSubs: inherited.negationSubs,
              inheritedComments: inherited.negationComments,
            })}
          </section>
        </div>
      </section>{/* /Negation */}

      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Syntax</h2>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">Satztypen</h3>

            <div className="mt-3">
              {renderOptionList({
                title: "Satztypen",
                options: SATZTYPEN,
                selected: levelData.satztypen,
                comments: levelData.satztypenComments,
                inheritedSelected: inherited.satztypen,
                inheritedComments: inherited.satztypenComments,
                onToggle: (option) => toggleOption("satztypen", option),
                onCommentChange: (option, comment) => updateComment("satztypenComments", option, comment),
              })}
            </div>

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Satzstruktur
            </h4>

            <div className="mt-3">
              {renderSyntaxGroupedList({
                title: "Feldermodell",
                options: FELDERMODELL,
                suboptionsMap: FELDERMODELL_SUBOPTIONS,
                subRowClassNameMap: {
                  "Vorfeld": "mt-1 grid grid-cols-10 gap-x-4 gap-y-1 pl-6",
                  "Mittelfeld": "mt-1 grid grid-cols-4 gap-x-4 gap-y-1 pl-6",
                  "Nachfeld": "mt-1 grid grid-cols-4 gap-x-4 gap-y-1 pl-6",
                  "Prädikat": "mt-1 grid grid-cols-10 gap-x-4 gap-y-1 pl-6",
                },
                selected: levelData.feldermodell,
                subs: levelData.feldermodellSubs,
                comments: levelData.feldermodellComments,
                inheritedSelected: inherited.feldermodell,
                inheritedSubs: inherited.feldermodellSubs,
                inheritedComments: inherited.feldermodellComments,
                category: "feldermodell",
                subsKey: "feldermodellSubs",
                commentKey: "feldermodellComments",
              })}
            </div>

            <div className="mt-4">
              {renderSyntaxGroupedList({
                title: "Satzglieder",
                options: SATZGLIEDER,
                suboptionsMap: SATZGLIEDER_SUBOPTIONS,
                subRowClassNameMap: {
                  "Objekte": "mt-1 grid grid-cols-6 gap-x-4 gap-y-1 pl-6",
                  "Adverbialbestimmungen": "mt-1 grid grid-cols-8 gap-x-4 gap-y-1 pl-6",
                  "Prädikativ": "mt-1 grid grid-cols-5 gap-x-4 gap-y-1 pl-6",
                  "Attribute": "mt-1 grid grid-cols-5 gap-x-4 gap-y-1 pl-6",
                },
                selected: levelData.satzglieder,
                subs: levelData.satzgliederSubs,
                comments: levelData.satzgliederComments,
                inheritedSelected: inherited.satzglieder,
                inheritedSubs: inherited.satzgliederSubs,
                inheritedComments: inherited.satzgliederComments,
                category: "satzglieder",
                subsKey: "satzgliederSubs",
                commentKey: "satzgliederComments",
              })}
            </div>

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Satzverknüpfung / Satzgefüge
            </h4>

            <div className="mt-3">
              {renderSyntaxGroupedList({
                title: "Parataxe",
                options: PARATAXE,
                suboptionsMap: PARATAXE_SUBOPTIONS,
                subRowClassNameMap: {
                  "Kopulativ": "mt-1 grid grid-cols-10 gap-x-4 gap-y-1 pl-6",
                  "Disjunktiv": "mt-1 grid grid-cols-10 gap-x-4 gap-y-1 pl-6",
                  "Adversativ": "mt-1 grid grid-cols-10 gap-x-4 gap-y-1 pl-6",
                  "Konsekutiv (Konjunktionaladverbien)": "mt-1 grid grid-cols-10 gap-x-4 gap-y-1 pl-6",
                },
                selected: levelData.parataxe,
                subs: levelData.parataxeSubs,
                comments: levelData.parataxeComments,
                inheritedSelected: inherited.parataxe,
                inheritedSubs: inherited.parataxeSubs,
                inheritedComments: inherited.parataxeComments,
                category: "parataxe",
                subsKey: "parataxeSubs",
                commentKey: "parataxeComments",
              })}
            </div>

            <div className="mt-4">
              {renderSyntaxGroupedList({
                title: "Hypotaxe",
                options: HYPOTAXE,
                suboptionsMap: HYPOTAXE_SUBOPTIONS,
                subRowClassName: "mt-1 grid grid-cols-6 gap-x-4 gap-y-1 pl-6",
                selected: levelData.hypotaxe,
                subs: levelData.hypotaxeSubs,
                comments: levelData.hypotaxeComments,
                inheritedSelected: inherited.hypotaxe,
                inheritedSubs: inherited.hypotaxeSubs,
                inheritedComments: inherited.hypotaxeComments,
                category: "hypotaxe",
                subsKey: "hypotaxeSubs",
                commentKey: "hypotaxeComments",
              })}
            </div>

            <h4 className="mt-6 text-sm font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Satzlänge und Komplexität
            </h4>

            <div className="mt-3">
              {renderSatzkomplexitaetList()}
            </div>
          </section>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Konnektoren und Verknüpfungsmittel</h2>

        <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <section>
            <div className="mt-3">
              {renderSyntaxGroupedList({
                title: "Konnektoren und Verknüpfungsmittel",
                options: KONNEKTOREN,
                suboptionsMap: KONNEKTOREN_SUBOPTIONS,
                subRowClassName: "mt-1 grid grid-cols-6 gap-x-4 gap-y-1 pl-6",
                subRowClassNameMap: {
                  "Mehrteilige Konnektoren": "mt-1 grid grid-cols-4 gap-x-4 gap-y-1 pl-6",
                  "Textorganisierende Konnektoren": "mt-1 grid grid-cols-4 gap-x-4 gap-y-1 pl-6",
                },
                selected: levelData.konnektoren,
                subs: levelData.konnektorenSubs,
                comments: levelData.konnektorenComments,
                inheritedSelected: inherited.konnektoren,
                inheritedSubs: inherited.konnektorenSubs,
                inheritedComments: inherited.konnektorenComments,
                category: "konnektoren",
                subsKey: "konnektorenSubs",
                commentKey: "konnektorenComments",
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
