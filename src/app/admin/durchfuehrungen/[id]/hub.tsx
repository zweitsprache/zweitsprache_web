"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle,
  Circle,
  FileText,
  Mail,
  Award,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type Anmeldung = {
  id: string;
  anrede: string;
  vorname: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
  kommunikation: {
    rechnung: { gesendet_at: string } | null;
    vorbereitungsaufgabe: { gesendet_at: string } | null;
    teilnahmebestaetigung: { gesendet_at: string } | null;
  };
};

export type DurchfuehrungDetail = {
  id: string;
  ort: string | null;
  status: string;
  workshop: {
    id: string;
    title: string;
    subtitle: string | null;
    preis: number | null;
  };
  termine: { start_datetime: string; end_datetime: string }[];
  anmeldungen: Anmeldung[];
};

// ── Constants ─────────────────────────────────────────────────────────────────

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function formatTermin(t: { start_datetime: string; end_datetime: string }) {
  const start = new Date(t.start_datetime);
  const end = new Date(t.end_datetime);
  return `${WEEKDAYS[start.getDay()]}, ${start.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}, ${start.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  })}–${end.toLocaleTimeString("de-CH", {
    hour: "2-digit",
    minute: "2-digit",
  })} Uhr`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ANMELDUNG_STATUS_LABELS: Record<string, string> = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  cancelled: "Abgesagt",
  waitlist: "Warteliste",
};

const ANMELDUNG_STATUS_COLORS: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  confirmed:
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  cancelled:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  waitlist:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

const DF_STATUS_COLORS: Record<string, string> = {
  geplant:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  "bestätigt":
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  abgesagt:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

// ── Subcomponents ─────────────────────────────────────────────────────────────

function CommIcon({
  sent,
  label,
  timestamp,
}: {
  sent: string | null;
  label: string;
  timestamp?: string | null;
}) {
  return (
    <span
      title={sent ? `${label} gesendet: ${formatDateTime(sent)}` : `${label} nicht gesendet`}
      className="inline-flex items-center"
    >
      {sent ? (
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      ) : (
        <Circle className="h-4 w-4 text-zinc-300 dark:text-zinc-700" />
      )}
    </span>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-1 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <p className="mb-6 text-sm text-zinc-500">{description}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function SlideOver({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="relative z-10 flex h-full w-full max-w-lg flex-col bg-white shadow-xl dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Individual send button ────────────────────────────────────────────────────

function IndividualSendButton({
  anmeldungId,
  typ,
  icon: Icon,
  label,
  sent,
  onSuccess,
}: {
  anmeldungId: string;
  typ: "rechnung" | "vorbereitungsaufgabe" | "teilnahmebestaetigung";
  icon: React.ElementType;
  label: string;
  sent: string | null;
  onSuccess: (anmeldungId: string, typ: string, timestamp: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = async (subj?: string, msg?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/anmeldungen/${anmeldungId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ,
          ...(typ === "vorbereitungsaufgabe"
            ? { subject: subj, message: msg }
            : {}),
        }),
      });
      if (res.ok) {
        onSuccess(anmeldungId, typ, new Date().toISOString());
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (typ === "vorbereitungsaufgabe") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          title={label}
          className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <Icon
            className={`h-4 w-4 ${sent ? "text-green-600 dark:text-green-400" : "text-zinc-400"}`}
          />
        </button>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Vorbereitungsaufgabe senden</h3>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Betreff
                </label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-zinc-500">
                  Nachricht
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleSend(subject, message)}
                  disabled={!subject.trim() || !message.trim() || loading}
                  className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Senden
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={() => handleSend()}
      disabled={loading}
      title={sent ? `${label} erneut senden` : label}
      className="rounded p-1 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
      ) : (
        <Icon
          className={`h-4 w-4 ${sent ? "text-green-600 dark:text-green-400" : "text-zinc-400"}`}
        />
      )}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DurchfuehrungHub({
  data: initialData,
}: {
  data: DurchfuehrungDetail;
}) {
  const [data, setData] = useState(initialData);
  const [dfStatus, setDfStatus] = useState(initialData.status);

  // Bestätigen flow
  const [bestaetigenOpen, setBestaetigenOpen] = useState(false);
  const [bestaetigenLoading, setBestaetigenLoading] = useState(false);
  const [bestaetigenResult, setBestaetigenResult] = useState<{
    sent: number;
    errors: string[];
  } | null>(null);

  // Abgesagt confirm
  const [abgesagtOpen, setAbgesagtOpen] = useState(false);
  const [abgesagtLoading, setAbgesagtLoading] = useState(false);

  // Vorbereitungsaufgabe slide-over
  const [vorbSlideOpen, setVorbSlideOpen] = useState(false);
  const [vorbSubject, setVorbSubject] = useState("");
  const [vorbMessage, setVorbMessage] = useState("");
  const [vorbLoading, setVorbLoading] = useState(false);
  const [vorbResult, setVorbResult] = useState<{
    sent: number;
    errors: string[];
  } | null>(null);

  // Teilnahmebestätigungen confirm
  const [certConfirmOpen, setCertConfirmOpen] = useState(false);
  const [certLoading, setCertLoading] = useState(false);
  const [certResult, setCertResult] = useState<{
    sent: number;
    errors: string[];
  } | null>(null);

  const sortedTermine = [...data.termine].sort(
    (a, b) =>
      new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
  );

  const handleBestaetigen = async () => {
    setBestaetigenLoading(true);
    try {
      const res = await fetch(
        `/api/admin/durchfuehrungen/${data.id}/bestaetigen`,
        { method: "POST" }
      );
      const json = await res.json();
      setBestaetigenResult(json);
      if (res.ok) {
        setDfStatus("bestätigt");
        // Update kommunikation state for all anmeldungen
        setData((prev) => ({
          ...prev,
          status: "bestätigt",
          anmeldungen: prev.anmeldungen.map((a) => ({
            ...a,
            kommunikation: {
              ...a.kommunikation,
              rechnung: a.kommunikation.rechnung ?? {
                gesendet_at: new Date().toISOString(),
              },
            },
          })),
        }));
      }
    } finally {
      setBestaetigenLoading(false);
      setBestaetigenOpen(false);
    }
  };

  const handleAbgesagt = async () => {
    setAbgesagtLoading(true);
    try {
      await fetch(`/api/admin/durchfuehrungen/${data.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "abgesagt" }),
      });
      setDfStatus("abgesagt");
      setData((prev) => ({ ...prev, status: "abgesagt" }));
    } finally {
      setAbgesagtLoading(false);
      setAbgesagtOpen(false);
    }
  };

  const handleVorbSend = async () => {
    setVorbLoading(true);
    try {
      const res = await fetch(
        `/api/admin/durchfuehrungen/${data.id}/vorbereitungsaufgabe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: vorbSubject, message: vorbMessage }),
        }
      );
      const json = await res.json();
      setVorbResult(json);
      if (res.ok) {
        const ts = new Date().toISOString();
        setData((prev) => ({
          ...prev,
          anmeldungen: prev.anmeldungen.map((a) => ({
            ...a,
            kommunikation: {
              ...a.kommunikation,
              vorbereitungsaufgabe: a.kommunikation.vorbereitungsaufgabe ?? {
                gesendet_at: ts,
              },
            },
          })),
        }));
      }
    } finally {
      setVorbLoading(false);
    }
  };

  const handleCertSend = async () => {
    setCertLoading(true);
    try {
      const res = await fetch(
        `/api/admin/durchfuehrungen/${data.id}/teilnahmebestaetigung`,
        { method: "POST" }
      );
      const json = await res.json();
      setCertResult(json);
      if (res.ok) {
        const ts = new Date().toISOString();
        setData((prev) => ({
          ...prev,
          anmeldungen: prev.anmeldungen.map((a) => ({
            ...a,
            kommunikation: {
              ...a.kommunikation,
              teilnahmebestaetigung: a.kommunikation.teilnahmebestaetigung ?? {
                gesendet_at: ts,
              },
            },
          })),
        }));
      }
    } finally {
      setCertLoading(false);
      setCertConfirmOpen(false);
    }
  };

  const handleIndividualSuccess = useCallback(
    (anmeldungId: string, typ: string, timestamp: string) => {
      setData((prev) => ({
        ...prev,
        anmeldungen: prev.anmeldungen.map((a) => {
          if (a.id !== anmeldungId) return a;
          return {
            ...a,
            kommunikation: {
              ...a.kommunikation,
              [typ]: { gesendet_at: timestamp },
            },
          };
        }),
      }));
    },
    []
  );

  const statsByStatus = data.anmeldungen.reduce<Record<string, number>>(
    (acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const rechnungSentCount = data.anmeldungen.filter(
    (a) => a.kommunikation.rechnung
  ).length;
  const certSentCount = data.anmeldungen.filter(
    (a) => a.kommunikation.teilnahmebestaetigung
  ).length;
  const certUnsent = data.anmeldungen.length - certSentCount;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Back link */}
      <Link
        href="/admin/durchfuehrungen"
        className="mb-5 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück zu Durchführungen
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{data.workshop.title}</h1>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                DF_STATUS_COLORS[dfStatus] ?? DF_STATUS_COLORS.geplant
              }`}
            >
              {dfStatus === "bestätigt"
                ? "Bestätigt"
                : dfStatus === "abgesagt"
                  ? "Abgesagt"
                  : "Geplant"}
            </span>
          </div>
          {data.workshop.subtitle && (
            <p className="mt-0.5 text-sm text-zinc-500">{data.workshop.subtitle}</p>
          )}
          {data.ort && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              📍 {data.ort}
            </p>
          )}
          {sortedTermine.map((t, i) => (
            <p key={i} className="text-sm text-zinc-600 dark:text-zinc-400">
              {formatTermin(t)}
            </p>
          ))}
          {data.workshop.preis != null && (
            <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              CHF {data.workshop.preis.toFixed(2)}
            </p>
          )}
        </div>

        {/* Status change controls */}
        <div className="flex flex-wrap gap-2">
          {dfStatus !== "bestätigt" && dfStatus !== "abgesagt" && (
            <button
              onClick={() => setBestaetigenOpen(true)}
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              Als bestätigt markieren
            </button>
          )}
          {dfStatus === "bestätigt" && (
            <button
              onClick={() => setBestaetigenOpen(true)}
              className="rounded-md border border-green-300 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              Rechnungen erneut senden
            </button>
          )}
          {dfStatus !== "abgesagt" && (
            <button
              onClick={() => setAbgesagtOpen(true)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Als abgesagt markieren
            </button>
          )}
          <Link
            href={`/admin/workshops/${data.workshop.id}`}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Workshop bearbeiten
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{data.anmeldungen.length}</p>
          <p className="text-xs text-zinc-500">Anmeldungen total</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{rechnungSentCount}</p>
          <p className="text-xs text-zinc-500">Rechnungen gesendet</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">{certSentCount}</p>
          <p className="text-xs text-zinc-500">Bestätigungen gesendet</p>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-2xl font-bold">
            {data.workshop.preis != null
              ? `CHF ${(data.workshop.preis * data.anmeldungen.length).toFixed(0)}`
              : "–"}
          </p>
          <p className="text-xs text-zinc-500">Umsatz (brutto)</p>
        </div>
      </div>

      {/* Result banners */}
      {bestaetigenResult && (
        <div
          className={`mb-4 rounded-lg border p-4 text-sm ${
            bestaetigenResult.errors.length > 0
              ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
              : "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
          }`}
        >
          <p>
            ✓ {bestaetigenResult.sent} Rechnung
            {bestaetigenResult.sent !== 1 ? "en" : ""} gesendet.
          </p>
          {bestaetigenResult.errors.map((e, i) => (
            <p key={i} className="mt-1 text-xs">
              ⚠ {e}
            </p>
          ))}
        </div>
      )}
      {vorbResult && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300">
          ✓ Vorbereitungsaufgabe an {vorbResult.sent} Teilnehmer
          {vorbResult.sent !== 1 ? "innen" : "in"} gesendet.
        </div>
      )}
      {certResult && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300">
          ✓ {certResult.sent} Teilnahmebestätigung
          {certResult.sent !== 1 ? "en" : ""} gesendet.
        </div>
      )}

      {/* Communication action bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setVorbSlideOpen(true);
            setVorbResult(null);
          }}
          className="flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Mail className="h-4 w-4" />
          Vorbereitungsaufgabe senden
        </button>
        <button
          onClick={() => {
            setCertConfirmOpen(true);
            setCertResult(null);
          }}
          className="flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Award className="h-4 w-4" />
          Teilnahmebestätigungen versenden
          {certUnsent > 0 && (
            <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-xs dark:bg-zinc-700">
              {certUnsent}
            </span>
          )}
        </button>
      </div>

      {/* Participant table */}
      {data.anmeldungen.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500">Noch keine Anmeldungen.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Teilnehmer:in
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  E-Mail
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Status
                </th>
                <th
                  className="px-4 py-3 text-center font-medium text-zinc-500"
                  title="Rechnung gesendet"
                >
                  <FileText className="mx-auto h-4 w-4" />
                </th>
                <th
                  className="px-4 py-3 text-center font-medium text-zinc-500"
                  title="Vorbereitungsaufgabe gesendet"
                >
                  <Mail className="mx-auto h-4 w-4" />
                </th>
                <th
                  className="px-4 py-3 text-center font-medium text-zinc-500"
                  title="Teilnahmebestätigung gesendet"
                >
                  <Award className="mx-auto h-4 w-4" />
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.anmeldungen.map((a) => (
                <tr
                  key={a.id}
                  className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3 font-medium">
                    {a.anrede} {a.vorname} {a.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    <a href={`mailto:${a.email}`} className="hover:underline">
                      {a.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        ANMELDUNG_STATUS_COLORS[a.status] ??
                        ANMELDUNG_STATUS_COLORS.pending
                      }`}
                    >
                      {ANMELDUNG_STATUS_LABELS[a.status] ?? a.status}
                    </span>
                  </td>
                  {/* Communication status icons */}
                  <td className="px-4 py-3 text-center">
                    <CommIcon
                      sent={a.kommunikation.rechnung?.gesendet_at ?? null}
                      label="Rechnung"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CommIcon
                      sent={
                        a.kommunikation.vorbereitungsaufgabe?.gesendet_at ??
                        null
                      }
                      label="Vorbereitungsaufgabe"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <CommIcon
                      sent={
                        a.kommunikation.teilnahmebestaetigung?.gesendet_at ??
                        null
                      }
                      label="Teilnahmebestätigung"
                    />
                  </td>
                  {/* Individual send actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IndividualSendButton
                        anmeldungId={a.id}
                        typ="rechnung"
                        icon={FileText}
                        label="Rechnung senden"
                        sent={a.kommunikation.rechnung?.gesendet_at ?? null}
                        onSuccess={handleIndividualSuccess}
                      />
                      <IndividualSendButton
                        anmeldungId={a.id}
                        typ="vorbereitungsaufgabe"
                        icon={Mail}
                        label="Vorbereitungsaufgabe senden"
                        sent={
                          a.kommunikation.vorbereitungsaufgabe?.gesendet_at ??
                          null
                        }
                        onSuccess={handleIndividualSuccess}
                      />
                      <IndividualSendButton
                        anmeldungId={a.id}
                        typ="teilnahmebestaetigung"
                        icon={Award}
                        label="Teilnahmebestätigung senden"
                        sent={
                          a.kommunikation.teilnahmebestaetigung?.gesendet_at ??
                          null
                        }
                        onSuccess={handleIndividualSuccess}
                      />
                      <Link
                        href={`/admin/anmeldungen/${a.id}`}
                        className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        title="Details"
                      >
                        <span className="text-xs text-zinc-400">→</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bestätigen / Rechnungen confirm dialog */}
      <ConfirmDialog
        open={bestaetigenOpen}
        title={
          dfStatus === "bestätigt"
            ? "Rechnungen erneut senden"
            : "Durchführung bestätigen"
        }
        description={`${data.anmeldungen.length} Teilnehmer:${data.anmeldungen.length !== 1 ? "innen erhalten" : "in erhält"} eine Rechnung per E-Mail.${dfStatus !== "bestätigt" ? " Die Durchführung wird als bestätigt markiert." : ""}`}
        confirmLabel={dfStatus === "bestätigt" ? "Senden" : "Bestätigen & senden"}
        onConfirm={handleBestaetigen}
        onCancel={() => setBestaetigenOpen(false)}
        loading={bestaetigenLoading}
      />

      {/* Abgesagt confirm dialog */}
      <ConfirmDialog
        open={abgesagtOpen}
        title="Als abgesagt markieren"
        description="Die Durchführung wird als abgesagt markiert. Es werden keine automatischen E-Mails gesendet."
        confirmLabel="Abgesagt markieren"
        onConfirm={handleAbgesagt}
        onCancel={() => setAbgesagtOpen(false)}
        loading={abgesagtLoading}
      />

      {/* Teilnahmebestätigungen confirm */}
      <ConfirmDialog
        open={certConfirmOpen}
        title="Teilnahmebestätigungen versenden"
        description={`${data.anmeldungen.length} Teilnehmer:${data.anmeldungen.length !== 1 ? "innen erhalten" : "in erhält"} eine Teilnahmebestätigung als PDF per E-Mail.`}
        confirmLabel="Versenden"
        onConfirm={handleCertSend}
        onCancel={() => setCertConfirmOpen(false)}
        loading={certLoading}
      />

      {/* Vorbereitungsaufgabe slide-over */}
      <SlideOver
        open={vorbSlideOpen}
        title="Vorbereitungsaufgabe senden"
        onClose={() => setVorbSlideOpen(false)}
      >
        <p className="mb-4 text-sm text-zinc-500">
          Diese E-Mail wird an alle{" "}
          <strong>{data.anmeldungen.length}</strong> Teilnehmer:innen gesendet.
        </p>

        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Betreff
          </label>
          <input
            value={vorbSubject}
            onChange={(e) => setVorbSubject(e.target.value)}
            placeholder={`Vorbereitung – ${data.workshop.title}`}
            className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-400">
            Nachricht / Aufgabe
          </label>
          <textarea
            value={vorbMessage}
            onChange={(e) => setVorbMessage(e.target.value)}
            rows={10}
            placeholder="Beschreiben Sie die Vorbereitungsaufgabe..."
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-400">
            Der Text wird mit persönlicher Anrede für jede Teilnehmer:in gesendet.
          </p>
        </div>

        {vorbResult && (
          <div className="mb-4 rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300">
            ✓ An {vorbResult.sent} Teilnehmer:innen gesendet.
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={() => setVorbSlideOpen(false)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Schliessen
          </button>
          <button
            onClick={handleVorbSend}
            disabled={!vorbSubject.trim() || !vorbMessage.trim() || vorbLoading}
            className="flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {vorbLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            An alle senden
          </button>
        </div>
      </SlideOver>
    </div>
  );
}
