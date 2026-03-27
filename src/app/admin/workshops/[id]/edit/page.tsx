import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { EditWorkshopForm } from "./edit-workshop-form";

export default async function EditWorkshopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: workshop } = await supabase
    .from("workshops")
    .select("*")
    .eq("id", id)
    .single();

  if (!workshop) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <a
        href={`/admin/workshops/${id}`}
        className="mb-4 inline-block text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        ← Zurück
      </a>
      <h1 className="mb-6 text-2xl font-bold">Workshop bearbeiten</h1>
      <EditWorkshopForm
        id={workshop.id}
        title={workshop.title}
        subtitle={workshop.subtitle}
        about={workshop.about}
        maxTeilnehmer={workshop.max_teilnehmer}
        preis={workshop.preis}
      />
    </div>
  );
}
