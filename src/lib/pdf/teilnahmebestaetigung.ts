import { jsPDF } from "jspdf";

export interface TeilnahmebestaetigungParams {
  anrede: string;
  vorname: string;
  name: string;
  workshopTitle: string;
  workshopSubtitle?: string | null;
  ort?: string | null;
  termine: { start_datetime: string; end_datetime: string }[];
  ausstellungsDatum: string; // formatted
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

export function generateTeilnahmebestaetigungPdf(
  params: TeilnahmebestaetigungParams
): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 25;

  const brandColor: [number, number, number] = [62, 90, 107];
  const lightColor: [number, number, number] = [200, 215, 223];

  // ── Top border stripe
  doc.setFillColor(...brandColor);
  doc.rect(0, 0, pageWidth, 8, "F");

  // ── Logo / brand name
  let y = 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...brandColor);
  doc.text("zweitsprache.ch", margin, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text("Marcel Allenspach | Albisstrasse 32a | CH-8134 Adliswil", margin, y);
  y += 18;

  // ── Certificate title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...brandColor);
  doc.text("Teilnahmebestätigung", pageWidth / 2, y, { align: "center" });
  y += 8;

  // ── Decorative line
  doc.setDrawColor(...lightColor);
  doc.setLineWidth(1);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);
  y += 14;

  // ── Preamble text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const preamble = "Hiermit bestätigen wir die Teilnahme von";
  doc.text(preamble, pageWidth / 2, y, { align: "center" });
  y += 10;

  // ── Participant name (large)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...brandColor);
  doc.text(
    `${params.anrede} ${params.vorname} ${params.name}`,
    pageWidth / 2,
    y,
    { align: "center" }
  );
  y += 8;

  doc.setDrawColor(...lightColor);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 12;

  // ── "an der Weiterbildungsveranstaltung"
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("an der Weiterbildungsveranstaltung", pageWidth / 2, y, { align: "center" });
  y += 10;

  // ── Workshop title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(50, 50, 50);
  doc.text(params.workshopTitle, pageWidth / 2, y, { align: "center" });
  y += 6;

  if (params.workshopSubtitle) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(params.workshopSubtitle, pageWidth / 2, y, { align: "center" });
    y += 6;
  }
  y += 6;

  // ── Details box
  const boxX = margin + 15;
  const boxWidth = pageWidth - (margin + 15) * 2;
  const boxStartY = y;

  doc.setFillColor(245, 248, 250);
  doc.setDrawColor(...lightColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(boxX, boxStartY, boxWidth, 8, 2, 2, "FD");
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("DETAILS", boxX + 5, y);
  y += 6;

  doc.roundedRect(boxX, boxStartY, boxWidth, y - boxStartY + 4, 2, 2, "FD");

  if (params.ort) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Ort: ${params.ort}`, boxX + 5, y);
    y += 5;
  }

  const sortedTermine = [...params.termine].sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  for (const t of sortedTermine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Termin: ${formatTermin(t)}`, boxX + 5, y);
    y += 5;
  }

  // Redraw box to proper height
  doc.setFillColor(245, 248, 250);
  doc.setDrawColor(...lightColor);
  doc.roundedRect(boxX, boxStartY, boxWidth, y - boxStartY + 6, 2, 2, "FD");

  // Re-render text on top of box (jsPDF draws in order)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("DETAILS", boxX + 5, boxStartY + 5);

  let textY = boxStartY + 11;
  if (params.ort) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Ort: ${params.ort}`, boxX + 5, textY);
    textY += 5;
  }
  for (const t of sortedTermine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Termin: ${formatTermin(t)}`, boxX + 5, textY);
    textY += 5;
  }
  y = textY + 8;

  // ── Signature section
  y = Math.max(y, 210);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Adliswil, ${params.ausstellungsDatum}`, margin, y);
  y += 18;

  // Signature line
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + 60, y);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text("Marcel Allenspach", margin, y);
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("zweitsprache.ch", margin, y);

  // ── Bottom border stripe
  doc.setFillColor(...brandColor);
  doc.rect(0, pageHeight - 8, pageWidth, 8, "F");

  return Buffer.from(doc.output("arraybuffer"));
}
