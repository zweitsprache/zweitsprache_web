import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export default async function ModulePublicPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string }>;
}) {
  const { courseId, moduleId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: mod } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .single();

  if (!mod) {
    notFound();
  }

  const { data: lernziele } = await supabase
    .from("module_lernziele")
    .select("*")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, sort_order")
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold">{mod.title}</h2>
      {mod.description && (
        <p className="mb-8 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
          {mod.description}
        </p>
      )}

      {(lernziele ?? []).length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-lg font-semibold">Lernziele</h3>
          <ul className="flex flex-col gap-2">
            {(lernziele ?? []).map((lz: { id: string; text: string }) => (
              <li
                key={lz.id}
                className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
              >
                <ArrowRight className="h-4 w-4 shrink-0" />
                {lz.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="mb-3 text-lg font-semibold">Lektionen</h3>
        {(!lessons || lessons.length === 0) ? (
          <p className="text-sm text-zinc-500">
            Dieses Modul hat noch keine Lektionen.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {lessons.map(
              (lesson: { id: string; title: string }, index: number) => (
                <Link
                  key={lesson.id}
                  href={`/kurse/${courseId}/${moduleId}/${lesson.id}`}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-100 text-xs font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {index + 1}
                  </div>
                  <FileText className="h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="font-medium">{lesson.title}</span>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
