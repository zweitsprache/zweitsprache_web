import Link from "next/link";
import Image from "next/image";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white pt-6 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logos/zweitsprache_logo.svg"
            alt="Zweitsprache"
            width={35}
            height={9}
            priority
          />
        </Link>
        <nav className="flex gap-6">
          <Link
            href="/workshops"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Workshops
          </Link>
          <Link
            href="/kurse"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Kurse
          </Link>
          <Link
            href="/tools"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Tools
          </Link>
        </nav>
      </div>
    </header>
  );
}
