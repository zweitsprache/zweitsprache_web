"use client";

import { useState } from "react";
import { FileText, Mail, Award, Loader2, X } from "lucide-react";

type KommunikationLog = {
  id: string;
  typ: string;
  betreff: string | null;
  gesendet_at: string;
};

const TYP_LABELS: Record<string, string> = {
  rechnung: "Rechnung",
  vorbereitungsaufgabe: "Vorbereitungsaufgabe",
  teilnahmebestaetigung: "Teilnahmebestätigung",
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SendButton({
  anmeldungId,
  typ,
  label,
  icon: Icon,
  onSent,
}: {
  anmeldungId: string;
  typ: "rechnung" | "vorbereitungsaufgabe" | "teilnahmebestaetigung";
  label: string;
  icon: React.ElementType;
  onSent: (entry: KommunikationLog) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const doSend = async (subj?: string, msg?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/anmeldungen/${anmeldungId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          typ,
          ...(typ === "vorbereitungsaufgabe" ? { subject: subj, message: msg } : {}),
        }),
      });
      if (res.ok) {
        const newEntry: KommunikationLog = {
          id: crypto.randomUUID(),
          typ,
          betreff: subj ?? null,
          gesendet_at: new Date().toISOString(),
        };
        onSent(newEntry);
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
          className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <Icon className="h-4 w-4" />
          {label}
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
                <label className="mb-1 block text-xs font-medium text-zinc-500">Betreff</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-9 w-full rounded-lg border border-zinc-200 px-3 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium text-zinc-500">Nachricht</label>
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
                  onClick={() => doSend(subject, message)}
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
      onClick={() => doSend()}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}

export function AnmeldungKommunikation({
  anmeldungId,
  initialLogs,
}: {
  anmeldungId: string;
  initialLogs: KommunikationLog[];
}) {
  const [logs, setLogs] = useState(initialLogs);

  const handleSent = (entry: KommunikationLog) => {
    setLogs((prev) => [entry, ...prev]);
  };

  return (
    <section className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Kommunikation
      </h2>

      <div className="mb-4 flex flex-wrap gap-2">
        <SendButton
          anmeldungId={anmeldungId}
          typ="rechnung"
          label="Rechnung senden"
          icon={FileText}
          onSent={handleSent}
        />
        <SendButton
          anmeldungId={anmeldungId}
          typ="vorbereitungsaufgabe"
          label="Vorbereitungsaufgabe senden"
          icon={Mail}
          onSent={handleSent}
        />
        <SendButton
          anmeldungId={anmeldungId}
          typ="teilnahmebestaetigung"
          label="Teilnahmebestätigung senden"
          icon={Award}
          onSent={handleSent}
        />
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-zinc-400">Noch keine E-Mails gesendet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="pb-2 text-left text-xs font-medium text-zinc-400">Typ</th>
              <th className="pb-2 text-left text-xs font-medium text-zinc-400">Betreff</th>
              <th className="pb-2 text-right text-xs font-medium text-zinc-400">Gesendet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="py-1.5 font-medium">
                  {TYP_LABELS[l.typ] ?? l.typ}
                </td>
                <td className="py-1.5 text-zinc-500">{l.betreff ?? "–"}</td>
                <td className="py-1.5 text-right text-zinc-500">
                  {formatDateTime(l.gesendet_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
