"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CONTENT_LOCALE_FLAGS, CONTENT_LOCALE_LABELS, type ContentLocale } from "@/types/worksheet";

interface LanguagePickerProps {
  availableLocales: ContentLocale[];
}

export function LanguagePicker({ availableLocales }: LanguagePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang = (searchParams.get("lang") ?? "de") as ContentLocale;

  if (availableLocales.length === 0) return null;

  const all: ContentLocale[] = ["de", ...availableLocales];

  const switchLang = (locale: ContentLocale) => {
    const params = new URLSearchParams(searchParams.toString());
    if (locale === "de") {
      params.delete("lang");
    } else {
      params.set("lang", locale);
    }
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  };

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 self-end">
      {all.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLang(locale)}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            currentLang === locale
              ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
          title={locale === "de" ? "Deutsch" : CONTENT_LOCALE_LABELS[locale]}
        >
          {CONTENT_LOCALE_FLAGS[locale]} {CONTENT_LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
}
