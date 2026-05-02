'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const contentItems = [
  { href: '/admin/workshops', label: 'Workshops' },
  { href: '/admin/durchfuehrungen', label: 'Durchführungen' },
  { href: '/admin/anmeldungen', label: 'Anmeldungen' },
  { href: '/admin/kurse', label: 'Kurse' },
  { href: '/admin/seiten', label: 'Seiten' },
  { href: '/admin/satzbank', label: 'Satzbank' },
]

const generatorItems = [
  { href: '/tools/textgenerator', label: 'Textgenerator' },
  { href: '/admin/textgenerator/bulk', label: 'Bulk-Generator' },
  { href: '/admin/textgenerator/prompt', label: 'Prompt' },
  { href: '/admin/textgenerator/textsorten', label: 'Textsorten' },
  { href: '/admin/textgenerator/niveauregeln', label: 'Niveauregeln' },
  { href: '/admin/textgenerator/kontextregeln', label: 'Kontextregeln' },
  { href: '/admin/textgenerator/hf-kontext', label: 'HF Strukturkontext' },
  { href: '/admin/textgenerator/wortlisten', label: 'Wortlisten' },
]

const textkorrektorItems = [
  { href: '/admin/textkorrektor', label: 'Profile' },
]

export function Sidebar() {
  const pathname = usePathname()

  const renderLink = (item: { href: string; label: string }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100'
        }`}
      >
        {item.label}
      </Link>
    )
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center border-b border-zinc-200 px-4 dark:border-zinc-800">
        <Link href="/" className="text-sm font-bold tracking-tight">
          Zweitsprache
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <div className="mb-1 px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Inhalt
        </div>
        {contentItems.map(renderLink)}
        <div className="mb-1 mt-4 px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Textgenerator
        </div>
        {generatorItems.map(renderLink)}
        <div className="mb-1 mt-4 px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Textkorrektor
        </div>
        {textkorrektorItems.map(renderLink)}
      </nav>
    </aside>
  )
}
