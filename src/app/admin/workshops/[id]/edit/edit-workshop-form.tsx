"use client";

import { useActionState } from "react";
import { updateWorkshop, deleteWorkshop } from "../../actions";

export function EditWorkshopForm({
  id,
  title,
  subtitle,
  about,
  minTeilnehmer,
  maxTeilnehmer,
  preis,
}: {
  id: string;
  title: string;
  subtitle?: string | null;
  about?: string | null;
  minTeilnehmer?: number | null;
  maxTeilnehmer?: number | null;
  preis?: number | null;
}) {
  const [updateState, updateAction, isUpdating] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await updateWorkshop(id, formData)) ?? null;
    },
    null
  );

  const [deleteState, deleteAction, isDeleting] = useActionState(
    async (_prev: { error?: string } | null, _formData: FormData) => {
      return (await deleteWorkshop(id)) ?? null;
    },
    null
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={updateAction} className="flex flex-col gap-4">
        <div>
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Titel
          </label>
          <input
            id="title"
            type="text"
            name="title"
            defaultValue={title}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="subtitle"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Untertitel
          </label>
          <input
            id="subtitle"
            type="text"
            name="subtitle"
            defaultValue={subtitle ?? ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="about"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Über den Workshop
          </label>
          <textarea
            id="about"
            name="about"
            defaultValue={about ?? ""}
            rows={6}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="min_teilnehmer"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Min. Teilnehmer
            </label>
            <input
              id="min_teilnehmer"
              type="number"
              name="min_teilnehmer"
              min={1}
              defaultValue={minTeilnehmer ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label
              htmlFor="max_teilnehmer"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Max. Teilnehmer
            </label>
            <input
              id="max_teilnehmer"
              type="number"
              name="max_teilnehmer"
              min={0}
              defaultValue={maxTeilnehmer ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label
              htmlFor="preis"
              className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Preis (CHF)
            </label>
            <input
              id="preis"
              type="number"
              name="preis"
              min={0}
              step="0.01"
              defaultValue={preis ?? ""}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isUpdating}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isUpdating ? "Speichern..." : "Speichern"}
          </button>
          <a
            href={`/admin/workshops/${id}`}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Abbrechen
          </a>
        </div>
        {updateState?.error && (
          <p className="text-sm text-red-600">{updateState.error}</p>
        )}
      </form>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <div>
        <h2 className="mb-2 text-sm font-medium text-red-600">Gefahrenzone</h2>
        <form action={deleteAction}>
          <button
            type="submit"
            disabled={isDeleting}
            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
          >
            {isDeleting ? "Löschen..." : "Workshop löschen"}
          </button>
        </form>
        {deleteState?.error && (
          <p className="mt-2 text-sm text-red-600">{deleteState.error}</p>
        )}
      </div>
    </div>
  );
}
