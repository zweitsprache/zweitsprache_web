export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-4xl px-4 py-6 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} Zweitsprache. Alle Rechte vorbehalten.
      </div>
    </footer>
  );
}
