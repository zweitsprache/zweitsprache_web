export type Annotation = {
  original: string;
  corrected: string;
  explanation: string;
  category: string;
};

export type BewertungKriterium = {
  kriterium: string;
  note: "A" | "B" | "C" | "D";
  rohpunkte: number;
  endpunkte: number;
  kommentar: string;
};

export type Result = {
  rawText: string;
  correctedText: string;
  annotations: Annotation[];
  bewertung: BewertungKriterium[];
  summary: string;
  ocrEngine: "claude";
};
