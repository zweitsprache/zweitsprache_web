import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { FileText } from "lucide-react";

export default async function ThemaPublicPage({
  params,
}: {
  params: Promise<{ courseId: string; moduleId: string; themaId: string }>;
}) {
  const { courseId, moduleId, themaId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: thema } = await supabase
    .from("themen")
    .select("*")
    .eq("id", themaId)
    .single();

  if (!thema) {
    notFound();
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, sort_order")
    .eq("thema_id", themaId)
    .order("sort_order", { ascending: true });

  return (
    <div>
      <h2 className="mb-2 text-2xl font-bold">{thema.title}</h2>
      {thema.description && (
        <p className="mb-8 whitespace-pre-wrap text-zinc-600 dark:text-zinc-400">
          {thema.description}
        </p>
      )}

      <div>
        <h3 className="mb-3 text-lg font-semibold">Lektionen</h3>
        {(!lessons || lessons.length === 0) ? (
          <p className="text-sm text-zinc-500">
            Dieses Thema hat noch keine Lektionen.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {lessons.map(
              (lesson: { id: string; title: string }, index: number) => (
                <Link
                  key={lesson.id}
                  href={`/kurse/${courseId}/${moduleId}/${themaId}/${lesson.id}`}
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
