import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-tl-2xl rounded-tr-2xl bg-stone-800 px-8 py-10 text-sm text-slate-400">
          <div className="grid grid-cols-7 gap-8">
            {/* Col 1–2 — Contact */}
            <div className="col-span-2 space-y-1">
              <p className="font-semibold text-slate-200">zweitsprache.ch | Marcel Allenspach</p>
              <p>Albisstrasse 32a</p>
              <p>CH-8134 Adliswil</p>
              <p>&nbsp;</p>
              <p>+41 44 709 20 00</p>
              <p>office@zweitsprache.ch</p>
            </div>

            {/* Col 3–4 — Description */}
            <div className="col-span-2 space-y-1">
              <p className="font-semibold text-slate-200">DaZ einfach machen.</p>
              <p className="leading-relaxed">
                Beratung, Weiterbildung und Fachcoaching für Organisationen, Teams und Kursleitende.
              </p>
            </div>

            {/* Col 5 — Empty */}
            <div />

            {/* Col 6 — Links */}
            <div className="space-y-2">
              <Link href="/impressum" className="block hover:text-slate-200 transition-colors">
                Impressum
              </Link>
              <Link href="/datenschutz" className="block hover:text-slate-200 transition-colors">
                Datenschutz
              </Link>
              <Link href="/disclaimer" className="block hover:text-slate-200 transition-colors">
                Disclaimer
              </Link>
            </div>

            {/* Col 7 — Empty */}
            <div />
          </div>

          <div className="mt-8 text-left text-xs text-slate-600">
            © {new Date().getFullYear()} Zweitsprache. Alle Rechte vorbehalten.
          </div>
        </div>
      </div>
    </footer>
  );
}
