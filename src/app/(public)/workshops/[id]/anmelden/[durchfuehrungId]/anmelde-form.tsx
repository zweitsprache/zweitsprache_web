"use client";

import { useState } from "react";

function FloatingInput({
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
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const active = focused || value.length > 0;

  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full rounded-lg border border-zinc-300 bg-white px-4 pt-5 pb-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
        placeholder=" "
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 transition-all duration-200 ${
          active
            ? "top-1.5 text-[11px] font-medium text-zinc-500"
            : "top-3.5 text-sm text-zinc-400"
        }`}
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
    </div>
  );
}

function FloatingSelect({
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
  const [value, setValue] = useState("");
  const active = value.length > 0;

  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        required={required}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onChange?.(e.target.value);
        }}
        className={`peer w-full appearance-none rounded-lg border border-zinc-300 bg-white px-4 pt-5 pb-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 ${
          !active ? "text-transparent" : ""
        }`}
      >
        <option value="">Bitte auswählen</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 transition-all duration-200 ${
          active
            ? "top-1.5 text-[11px] font-medium text-zinc-500"
            : "top-3.5 text-sm text-zinc-400"
        }`}
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
        <svg
          className="h-4 w-4 text-zinc-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}

function FloatingTextarea({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState("");
  const active = focused || value.length > 0;

  return (
    <div className="relative">
      <textarea
        id={id}
        name={id}
        rows={4}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="peer w-full rounded-lg border border-zinc-300 bg-white px-4 pt-6 pb-2 text-sm outline-none transition-colors focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
        placeholder=" "
      />
      <label
        htmlFor={id}
        className={`pointer-events-none absolute left-4 transition-all duration-200 ${
          active
            ? "top-1.5 text-[11px] font-medium text-zinc-500"
            : "top-3.5 text-sm text-zinc-400"
        }`}
      >
        {label}
      </label>
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
  const [submitted, setSubmitted] = useState(false);

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
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="space-y-10"
    >
      <input type="hidden" name="workshop_id" value={workshopId} />
      <input type="hidden" name="durchfuehrung_id" value={durchfuehrungId} />

      {/* Persönliche Angaben */}
      <fieldset>
        <legend className="mb-4 text-xl font-bold">
          Persönliche Angaben
        </legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            <FloatingSelect
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
          <FloatingInput
            id="vorname"
            label="Vorname"
            required
            autoComplete="given-name"
          />
          <FloatingInput
            id="name"
            label="Name"
            required
            autoComplete="family-name"
          />
          <FloatingInput
            id="strasse"
            label="Strasse / Nr."
            required
            autoComplete="street-address"
          />
          <FloatingInput
            id="plz_ort"
            label="PLZ / Ort"
            required
            autoComplete="postal-code"
          />
          <FloatingInput
            id="mobiltelefon"
            label="Mobiltelefon"
            type="tel"
            required
            autoComplete="tel"
          />
          <FloatingInput
            id="email"
            label="E-Mail"
            type="email"
            required
            autoComplete="email"
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
            <FloatingSelect
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
              <FloatingInput id="firma" label="Firma / Organisation" />
              <FloatingInput id="abteilung" label="Abteilung / Kontakt" />
              <FloatingInput
                id="rechnung_strasse"
                label="Strasse / Nr."
                autoComplete="street-address"
              />
              <FloatingInput
                id="rechnung_plz_ort"
                label="PLZ / Ort"
                autoComplete="postal-code"
              />
              <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
                <FloatingInput
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

      {/* Datenschutz & Bemerkungen */}
      <fieldset>
        <legend className="mb-4 text-xl font-bold">
          Datenschutz
        </legend>
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="einwilligung"
              required
              checked={einwilligung}
              onChange={(e) => setEinwilligung(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-sm leading-relaxed">
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
          <FloatingTextarea id="bemerkungen" label="Bemerkungen" />
        </div>
      </fieldset>

      {/* Submit */}
      <div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus:ring-zinc-100 sm:w-auto"
        >
          Anmeldung absenden
        </button>
      </div>
    </form>
  );
}
