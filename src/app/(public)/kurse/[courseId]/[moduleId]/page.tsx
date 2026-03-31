import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { ArrowRight, FileText, FolderOpen } from "lucide-react";

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

  const { data: themen } = await supabase
    .from("themen")
    .select(
      `
      id,
      title,
      description,
      sort_order,
      lessons (
        id,
        title,
        sort_order
      )
    `
    )
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  const sortedThemen = (themen ?? []).map(
    (t: { id: string; title: string; description: string | null; sort_order: number; lessons: { id: string; title: string; sort_order: number }[] }) => ({
      ...t,
      lessons: (t.lessons ?? []).sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      ),
    })
  );

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
        <h3 className="mb-3 text-lg font-semibold">Themen</h3>
        {sortedThemen.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Dieses Modul hat noch keine Themen.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sortedThemen.map(
              (thema: { id: string; title: string; description: string | null; lessons: { id: string; title: string }[] }) => (
                <Link
                  key={thema.id}
                  href={`/kurse/${courseId}/${moduleId}/${thema.id}`}
                  className="group flex flex-col rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 shrink-0 text-zinc-400" />
                    <h4 className="font-medium group-hover:underline">{thema.title}</h4>
                  </div>
                  {thema.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-zinc-500">
                      {thema.description}
                    </p>
                  )}
                  <p className="mt-auto text-xs text-zinc-400">
                    {thema.lessons.length} Lektion
                    {thema.lessons.length !== 1 ? "en" : ""}
                  </p>
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
