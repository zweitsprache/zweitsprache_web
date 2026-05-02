import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export interface TeilnahmebestaetigungEmailProps {
  anrede: string;
  vorname: string;
  name: string;
  workshopTitle: string;
  workshopSubtitle?: string | null;
  ort?: string | null;
  termine: { start_datetime: string; end_datetime: string }[];
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

export function TeilnahmebestaetigungEmail({
  anrede,
  vorname,
  name,
  workshopTitle,
  workshopSubtitle,
  ort,
  termine,
}: TeilnahmebestaetigungEmailProps) {
  const salutation =
    anrede === "Herr"
      ? `Sehr geehrter Herr ${name}`
      : anrede === "Frau"
        ? `Sehr geehrte Frau ${name}`
        : `Guten Tag ${vorname} ${name}`;

  const sortedTermine = [...termine].sort(
    (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  return (
    <Html lang="de">
      <Head />
      <Preview>Teilnahmebestätigung – {workshopTitle}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>zweitsprache.ch</Text>
          <Hr style={hr} />

          <Text style={text}>{salutation}</Text>

          <Text style={text}>
            Im Anhang finden Sie Ihre Teilnahmebestätigung für den folgenden
            Kurs:
          </Text>

          <Section style={card}>
            <Text style={cardTitle}>{workshopTitle}</Text>
            {workshopSubtitle && (
              <Text style={cardSubtitle}>{workshopSubtitle}</Text>
            )}
            <Hr style={cardHr} />
            {ort && (
              <Text style={detail}>
                <strong>Ort:</strong> {ort}
              </Text>
            )}
            {sortedTermine.length > 0 && (
              <Text style={detail}>
                <strong>Termine:</strong>
                {sortedTermine.map((t, i) => (
                  <React.Fragment key={i}>
                    <br />• {formatTermin(t)}
                  </React.Fragment>
                ))}
              </Text>
            )}
          </Section>

          <Text style={text}>
            Wir danken Ihnen für Ihre Teilnahme und freuen uns, Sie bei einer
            zukünftigen Veranstaltung wieder begrüssen zu dürfen.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            Mit freundlichen Grüssen
            <br />
            Marcel Allenspach
            <br />
            zweitsprache.ch
            <br />
            <a href="mailto:office@zweitsprache.ch" style={link}>
              office@zweitsprache.ch
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default TeilnahmebestaetigungEmail;

const body: React.CSSProperties = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container: React.CSSProperties = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  borderRadius: "8px",
  maxWidth: "560px",
};

const heading: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: "700",
  color: "#3e5a6b",
  margin: "0 0 16px",
};

const text: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#374151",
  margin: "0 0 16px",
};

const card: React.CSSProperties = {
  backgroundColor: "#f0f4f7",
  borderRadius: "6px",
  padding: "20px 24px",
  margin: "24px 0",
};

const cardTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "700",
  color: "#3e5a6b",
  margin: "0 0 4px",
};

const cardSubtitle: React.CSSProperties = {
  fontSize: "14px",
  color: "#6b7280",
  margin: "0 0 12px",
};

const cardHr: React.CSSProperties = {
  borderColor: "#d1dae0",
  margin: "12px 0",
};

const detail: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#374151",
  margin: "0 0 8px",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#6b7280",
  margin: "0",
};

const link: React.CSSProperties = {
  color: "#3e5a6b",
};
