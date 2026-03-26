import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { EditAngebotForm } from "./edit-angebot-form";

export default async function EditAngebotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: angebot } = await supabase
    .from("angebote")
    .select("*")
    .eq("id", id)
    .single();

  if (!angebot) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href={`/admin/angebote/${id}`}
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück
      </a>
      <h1 className="mb-6 text-2xl font-bold">Angebot bearbeiten</h1>
      <EditAngebotForm
        id={angebot.id}
        title={angebot.title}
        subtitle={angebot.subtitle}
      />
    </div>
  );
}
