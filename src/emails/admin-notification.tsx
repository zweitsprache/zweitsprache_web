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

export interface AdminNotificationProps {
  anrede: string;
  vorname: string;
  name: string;
  email: string;
  mobiltelefon?: string | null;
  strasse: string;
  plz_ort: string;
  rechnungsadresse_typ: string;
  firma?: string | null;
  abteilung?: string | null;
  rechnung_strasse?: string | null;
  rechnung_plz_ort?: string | null;
  rechnung_email?: string | null;
  bemerkungen?: string | null;
  workshopTitle: string;
  workshopSubtitle?: string | null;
  ort?: string | null;
  termine: { start_datetime: string; end_datetime: string }[];
  anmeldungId: string;
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

export function AdminNotification({
  anrede,
  vorname,
  name,
  email,
  mobiltelefon,
  strasse,
  plz_ort,
  rechnungsadresse_typ,
  firma,
  abteilung,
  rechnung_strasse,
  rechnung_plz_ort,
  rechnung_email,
  bemerkungen,
  workshopTitle,
  workshopSubtitle,
  ort,
  termine,
  anmeldungId,
}: AdminNotificationProps) {
  return (
    <Html lang="de">
      <Head />
      <Preview>
        Neue Anmeldung: {vorname} {name} – {workshopTitle}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={heading}>Neue Anmeldung</Text>
          <Hr style={hr} />

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
            {termine.length > 0 && (
              <Text style={detail}>
                <strong>Termine:</strong>
                {termine.map((t, i) => (
                  <React.Fragment key={i}>
                    <br />• {formatTermin(t)}
                  </React.Fragment>
                ))}
              </Text>
            )}
          </Section>

          <Text style={sectionHeading}>Teilnehmer/in</Text>

          <Row label="Anrede" value={anrede} />
          <Row label="Vorname" value={vorname} />
          <Row label="Name" value={name} />
          <Row label="E-Mail" value={email} />
          {mobiltelefon && <Row label="Mobiltelefon" value={mobiltelefon} />}
          <Row label="Strasse" value={strasse} />
          <Row label="PLZ / Ort" value={plz_ort} />

          <Text style={sectionHeading}>Rechnungsadresse</Text>
          <Row label="Typ" value={rechnungsadresse_typ} />
          {firma && <Row label="Firma" value={firma} />}
          {abteilung && <Row label="Abteilung" value={abteilung} />}
          {rechnung_strasse && <Row label="Strasse" value={rechnung_strasse} />}
          {rechnung_plz_ort && <Row label="PLZ / Ort" value={rechnung_plz_ort} />}
          {rechnung_email && <Row label="Rechnungs-E-Mail" value={rechnung_email} />}

          {bemerkungen && (
            <>
              <Text style={sectionHeading}>Bemerkungen</Text>
              <Text style={detail}>{bemerkungen}</Text>
            </>
          )}

          <Hr style={hr} />
          <Text style={footer}>Anmeldungs-ID: {anmeldungId}</Text>
        </Container>
      </Body>
    </Html>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text style={row}>
      <span style={rowLabel}>{label}:</span> {value}
    </Text>
  );
}

export default AdminNotification;

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

const sectionHeading: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  margin: "20px 0 4px",
};

const card: React.CSSProperties = {
  backgroundColor: "#f0f4f7",
  borderRadius: "6px",
  padding: "20px 24px",
  margin: "0 0 24px",
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

const row: React.CSSProperties = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#374151",
  margin: "0 0 6px",
};

const rowLabel: React.CSSProperties = {
  fontWeight: "600",
  color: "#6b7280",
};

const hr: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0",
};
