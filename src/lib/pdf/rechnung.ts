import { jsPDF } from "jspdf";

export interface RechnungParams {
  rechnungsNr: string;
  datum: string; // formatted date string
  // Recipient
  anrede: string;
  vorname: string;
  name: string;
  strasse: string;
  plz_ort: string;
  firma?: string | null;
  abteilung?: string | null;
  rechnung_strasse?: string | null;
  rechnung_plz_ort?: string | null;
  rechnungsadresse_typ: string;
  // Workshop
  workshopTitle: string;
  workshopSubtitle?: string | null;
  ort?: string | null;
  termine: { start_datetime: string; end_datetime: string }[];
  preis: number;
}

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function formatTermin(t: { start_datetime: string; end_datetime: string }) {
  const start = new Date(t.start_datetime);
  const end = new Date(t.end_datetime);
  const date = `${WEEKDAYS[start.getDay()]}, ${start.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
  const startTime = start.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  const endTime = end.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${startTime}–${endTime} Uhr`;
}

export function generateRechnungPdf(params: RechnungParams): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Brand color
  const brandColor: [number, number, number] = [62, 90, 107];

  // ── Sender address (small, top-left)
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("zweitsprache.ch | Marcel Allenspach | Albisstrasse 32a | CH-8134 Adliswil", margin, y);

  y += 10;

  // ── Recipient address
  const billingName =
    params.rechnungsadresse_typ === "firma" && params.firma
      ? params.firma
      : `${params.anrede} ${params.vorname} ${params.name}`;
  const billingStrasse = params.rechnung_strasse ?? params.strasse;
  const billingPlzOrt = params.rechnung_plz_ort ?? params.plz_ort;

  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  if (params.rechnungsadresse_typ === "firma" && params.firma) {
    doc.text(params.firma, margin, y);
    y += 5;
    if (params.abteilung) {
      doc.text(params.abteilung, margin, y);
      y += 5;
    }
    doc.text(`${params.anrede} ${params.vorname} ${params.name}`, margin, y);
    y += 5;
  } else {
    doc.text(billingName, margin, y);
    y += 5;
  }
  doc.text(billingStrasse, margin, y);
  y += 5;
  doc.text(billingPlzOrt, margin, y);
  y += 15;

  // ── Document info (right-aligned)
  const infoX = pageWidth - margin;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Rechnungs-Nr.: ${params.rechnungsNr}`, infoX, 35, { align: "right" });
  doc.text(`Datum: ${params.datum}`, infoX, 41, { align: "right" });

  // ── Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandColor);
  doc.text("Rechnung", margin, y);
  y += 8;

  // ── Divider
  doc.setDrawColor(...brandColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Workshop info block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(params.workshopTitle, margin, y);
  y += 6;

  if (params.workshopSubtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(params.workshopSubtitle, margin, y);
    y += 5;
  }

  if (params.ort) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Ort: ${params.ort}`, margin, y);
    y += 5;
  }

  if (params.termine.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const sortedTermine = [...params.termine].sort(
      (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
    );
    for (const t of sortedTermine) {
      doc.text(`Termin: ${formatTermin(t)}`, margin, y);
      y += 5;
    }
  }

  y += 5;

  // ── Line items table
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Beschreibung", margin, y);
  doc.text("Betrag CHF", pageWidth - margin, y, { align: "right" });
  y += 3;
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text(`Teilnahmegebühr – ${params.workshopTitle}`, margin, y);
  doc.text(params.preis.toFixed(2), pageWidth - margin, y, { align: "right" });
  y += 6;

  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  // ── Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...brandColor);
  doc.text("Total CHF", margin + contentWidth * 0.6, y);
  doc.text(params.preis.toFixed(2), pageWidth - margin, y, { align: "right" });
  y += 4;
  doc.setLineWidth(0.8);
  doc.line(margin + contentWidth * 0.6, y, pageWidth - margin, y);
  y += 12;

  // ── Payment section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  doc.text("Zahlungsinformationen", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text("Bitte überweisen Sie den Betrag bis in 14 Tagen auf folgendes Konto:", margin, y);
  y += 5;
  doc.text("IBAN: [wird nachgetragen]", margin, y);
  y += 4;
  doc.text("Kontoinhaber: Marcel Allenspach", margin, y);
  y += 4;
  doc.text(`Zahlungsreferenz: ${params.rechnungsNr}`, margin, y);
  y += 12;

  // ── Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "zweitsprache.ch | Marcel Allenspach | Albisstrasse 32a | CH-8134 Adliswil | office@zweitsprache.ch | +41 44 709 20 00",
    pageWidth / 2,
    285,
    { align: "center" }
  );

  return Buffer.from(doc.output("arraybuffer"));
}
