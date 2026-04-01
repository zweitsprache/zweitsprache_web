import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PublicBlockRenderer } from "@/components/blocks/public-block-renderer";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { WorksheetBlock } from "@/types/worksheet";

const VALID_LOCALES = new Set(["en", "uk"]);

export default async function LessonPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string; moduleId: string; themaId: string; lessonId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { courseId, moduleId, themaId, lessonId } = await params;
  const { lang } = await searchParams;
  const locale = lang && VALID_LOCALES.has(lang) ? lang : null;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: lesson } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .single();

  if (!lesson) {
    notFound();
  }

  // Base blocks (DE)
  const baseBlocks: WorksheetBlock[] =
    lesson.data?.blocks && Array.isArray(lesson.data.blocks)
      ? (lesson.data.blocks as WorksheetBlock[])
      : [];

  // Fetch translation if a learner locale is active
  let displayBlocks = baseBlocks;
  if (locale) {
    const { data: translation } = await supabase
      .from("lesson_translations")
      .select("data")
      .eq("lesson_id", lessonId)
      .eq("locale", locale)
      .single();

    if (translation?.data?.blocks && Array.isArray(translation.data.blocks)) {
      const translatedBlocks = translation.data.blocks as WorksheetBlock[];
      // For non-translatable blocks, always use the base (DE) content
      // We match by block id and position
      const baseById = new Map(baseBlocks.map((b) => [b.id, b]));
      displayBlocks = translatedBlocks.map((tb) => {
        const base = baseById.get(tb.id);
        if (base && base.translatable === false) return base;
        return tb;
      });
      // Blocks in base that are missing from translation (e.g. newly added) fall back to base
      const translatedIds = new Set(translatedBlocks.map((b) => b.id));
      for (const base of baseBlocks) {
        if (!translatedIds.has(base.id)) {
          displayBlocks.push(base);
        }
      }
    }
  }

  const hasContent = displayBlocks.length > 0;

  // Fetch all modules with themen and lessons for prev/next navigation
  const { data: allModules } = await supabase
    .from("modules")
    .select(
      `
      id,
      title,
      sort_order,
      themen (
        id,
        title,
        sort_order,
        lessons (
          id,
          title,
          sort_order
        )
      )
    `
    )
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  // Build flat ordered list of all lessons across all modules and themen
  const flatLessons: { id: string; title: string; moduleId: string; themaId: string }[] = [];
  for (const m of allModules ?? []) {
    const sortedThemen = (m.themen ?? []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
    for (const t of sortedThemen) {
      const sortedLessons = (t.lessons ?? []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
      for (const l of sortedLessons) {
        flatLessons.push({
          id: l.id,
          title: l.title,
          moduleId: m.id,
          themaId: t.id,
        });
      }
    }
  }

  const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

  const langSuffix = locale ? `?lang=${locale}` : "";

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">{lesson.title}</h2>

      {hasContent ? (
        <div className="max-w-none text-[18px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          <PublicBlockRenderer blocks={displayBlocks} mode="online" />
        </div>
      ) : (
        <p className="text-zinc-500">
          Diese Lektion hat noch keinen Inhalt.
        </p>
      )}

      {/* Prev / Next navigation */}
      <div className="mt-12 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
        {prevLesson ? (
          <Link
            href={`/kurse/${courseId}/${prevLesson.moduleId}/${prevLesson.themaId}/${prevLesson.id}${langSuffix}`}
            className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ChevronLeft className="h-4 w-4" />
            <div className="text-right">
              <p className="text-xs text-zinc-400">Vorherige Lektion</p>
              <p className="font-medium">{prevLesson.title}</p>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextLesson ? (
          <Link
            href={`/kurse/${courseId}/${nextLesson.moduleId}/${nextLesson.themaId}/${nextLesson.id}${langSuffix}`}
            className="flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <div>
              <p className="text-xs text-zinc-400">Nächste Lektion</p>
              <p className="font-medium">{nextLesson.title}</p>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
