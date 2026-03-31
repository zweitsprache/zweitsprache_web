"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

function FieldInput({
  id,
  label,
  type = "text",
  required = false,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-400">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[18px] placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
      />
    </div>
  );
}

function FieldSelect({
  id,
  label,
  required = false,
  options,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-400">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="relative">
        <select
          id={id}
          name={id}
          required={required}
          defaultValue=""
          onChange={(e) => onChange?.(e.target.value)}
          className="h-9 w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 text-[18px] focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="" disabled>Bitte auswählen</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="h-4 w-4 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function FieldTextarea({
  id,
  label,
  hideLabel = false,
}: {
  id: string;
  label: string;
  hideLabel?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-slate-400"}>
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        rows={4}
        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[18px] placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-600"
      />
    </div>
  );
}

export function AnmeldeForm({
  workshopId,
  durchfuehrungId,
}: {
  workshopId: string;
  durchfuehrungId: string;
}) {
  const [rechnungsTyp, setRechnungsTyp] = useState("");
  const [einwilligung, setEinwilligung] = useState(false);
  const [agb, setAgb] = useState(false);
  const [formValid, setFormValid] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadedAt] = useState(() => Date.now());

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950">
        <div className="mb-3 text-3xl">✓</div>
        <h2 className="mb-2 text-xl font-semibold text-green-800 dark:text-green-200">
          Anmeldung erfolgreich
        </h2>
        <p className="text-sm text-green-700 dark:text-green-300">
          Vielen Dank für Ihre Anmeldung. Wir werden uns in Kürze bei Ihnen
          melden.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

        const formData = new FormData(e.currentTarget);

        // Honeypot check
        if (formData.get("website")) {
          setSubmitted(true);
          return;
        }

        // Time-based check (reject if submitted in under 3 seconds)
        if (Date.now() - loadedAt < 3000) {
          setSubmitted(true);
          return;
        }

        const payload = {
          workshop_id: formData.get("workshop_id"),
          durchfuehrung_id: formData.get("durchfuehrung_id"),
          anrede: formData.get("anrede"),
          vorname: formData.get("vorname"),
          name: formData.get("name"),
          strasse: formData.get("strasse"),
          plz_ort: formData.get("plz_ort"),
          email: formData.get("email"),
          mobiltelefon: formData.get("mobiltelefon"),
          rechnungsadresse_typ: formData.get("rechnungsadresse_typ"),
          firma: formData.get("firma"),
          abteilung: formData.get("abteilung"),
          rechnung_strasse: formData.get("rechnung_strasse"),
          rechnung_plz_ort: formData.get("rechnung_plz_ort"),
          rechnung_email: formData.get("rechnung_email"),
          bemerkungen: formData.get("bemerkungen"),
          einwilligung,
          agb,
        };

        try {
          const res = await fetch("/api/anmeldungen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Anmeldung fehlgeschlagen.");
          }

          setSubmitted(true);
        } catch (err) {
          setSubmitError(
            err instanceof Error ? err.message : "Ein Fehler ist aufgetreten."
          );
        } finally {
          setSubmitting(false);
        }
      }}
      onChange={(e) => setFormValid(e.currentTarget.checkValidity())}
      className="space-y-10"
    >
      <input type="hidden" name="workshop_id" value={workshopId} />
      <input type="hidden" name="durchfuehrung_id" value={durchfuehrungId} />

      {/* Honeypot — hidden from real users */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Anmeldung */}
      <fieldset>
        <legend className="mb-4 text-xl font-bold">Anmeldung</legend>
      <label className="flex items-start gap-3 cursor-pointer normal-case">
        <input
          type="checkbox"
          name="agb"
          required
          checked={agb}
          onChange={(e) => setAgb(e.target.checked)}
          className="mt-0.5 h-5 w-5 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
        />
        <span className="text-[18px] leading-relaxed">
          Ich melde mich verbindlich an und habe die{" "}
          <a
            href="/agb"
            target="_blank"
            className="font-medium underline underline-offset-2 hover:text-zinc-600"
          >
            AGB für Weiterbildungsveranstaltungen
          </a>{" "}
          zur Kenntnis genommen.<span className="text-red-500"> *</span>
        </span>
      </label>
      </fieldset>

      {/* Persönliche Angaben */}
      <fieldset>
        <legend className="mb-4 text-xl font-bold">
          Persönliche Angaben
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            <FieldSelect
              id="anrede"
              label="Anrede"
              required
              options={[
                { value: "Frau", label: "Frau" },
                { value: "Herr", label: "Herr" },
                { value: "Divers", label: "Divers" },
              ]}
            />
          </div>
          <FieldInput
            id="vorname"
            label="Vorname"
            required
            autoComplete="given-name"
          />
          <FieldInput
            id="name"
            label="Name"
            required
            autoComplete="family-name"
          />
          <FieldInput
            id="strasse"
            label="Strasse / Nr."
            required
            autoComplete="street-address"
          />
          <FieldInput
            id="plz_ort"
            label="PLZ / Ort"
            required
            autoComplete="postal-code"
          />
          <FieldInput
            id="email"
            label="E-Mail"
            type="email"
            required
            autoComplete="email"
          />
          <FieldInput
            id="mobiltelefon"
            label="Mobiltelefon"
            type="tel"
            autoComplete="tel"
          />
        </div>
      </fieldset>

      {/* Rechnungsadresse */}
      <fieldset>
        <legend className="mb-4 text-xl font-bold">
          Rechnungsadresse
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            <FieldSelect
              id="rechnungsadresse_typ"
              label="Rechnungsadresse"
              required
              options={[
                { value: "privat", label: "Privatadresse" },
                { value: "firma", label: "Firmenadresse" },
              ]}
              onChange={setRechnungsTyp}
            />
          </div>
          {rechnungsTyp === "firma" && (
            <>
              <FieldInput id="firma" label="Firma / Organisation" />
              <FieldInput id="abteilung" label="Abteilung / Kontakt" />
              <FieldInput
                id="rechnung_strasse"
                label="Strasse / Nr."
                autoComplete="street-address"
              />
              <FieldInput
                id="rechnung_plz_ort"
                label="PLZ / Ort"
                autoComplete="postal-code"
              />
              <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
                <FieldInput
                  id="rechnung_email"
                  label="E-Mail"
                  type="email"
                  autoComplete="email"
                />
              </div>
            </>
          )}
        </div>
      </fieldset>

      {/* Bemerkungen */}
      <fieldset>
        <legend className="mb-4 text-xl font-bold">Bemerkungen</legend>
        <FieldTextarea id="bemerkungen" label="Bemerkungen" hideLabel />
      </fieldset>

      {/* Datenschutz */}
      <fieldset>
        <legend className="mb-4 text-xl font-bold">
          Datenschutz
        </legend>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer normal-case">
            <input
              type="checkbox"
              name="einwilligung"
              required
              checked={einwilligung}
              onChange={(e) => setEinwilligung(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-[18px] leading-relaxed">
              Ich stimme der{" "}
              <a
                href="/datenschutz"
                target="_blank"
                className="font-medium underline underline-offset-2 hover:text-zinc-600"
              >
                Datenschutzerklärung
              </a>{" "}
              zu.
              <span className="text-red-500"> *</span>
            </span>
          </label>
        </div>
      </fieldset>

      {/* Submit */}
      <div className="space-y-3">
        {submitError && (
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        )}
        <Button type="submit" className="w-full" disabled={!formValid || submitting}>
          {submitting ? "Wird gesendet…" : "Anmeldung absenden"}
        </Button>
      </div>
    </form>
  );
}
