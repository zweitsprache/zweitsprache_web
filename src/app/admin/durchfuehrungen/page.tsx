import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  geplant: "Geplant",
  "bestätigt": "Bestätigt",
  abgesagt: "Abgesagt",
};

const STATUS_COLORS: Record<string, string> = {
  geplant:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  "bestätigt":
    "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  abgesagt:
    "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${WEEKDAYS[d.getDay()]}, ${d.toLocaleDateString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
}

export default async function DurchfuehrungenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: filterStatus } = await searchParams;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: rows } = await supabase
    .from("durchfuehrungen")
    .select(
      `id, ort, status, created_at,
       termine(start_datetime, end_datetime),
       workshops(id, title, subtitle)`
    )
    .order("created_at", { ascending: false });

  type DfRow = {
    id: string;
    ort: string | null;
    status: string;
    created_at: string;
    termine: { start_datetime: string; end_datetime: string }[];
    workshops: { id: string; title: string; subtitle: string | null } | null;
  };

  const allRows = (rows ?? []) as DfRow[];

  // Get anmeldungen counts
  const { data: counts } = await supabase
    .from("anmeldungen")
    .select("durchfuehrung_id");

  const countMap = new Map<string, number>();
  for (const c of counts ?? []) {
    countMap.set(c.durchfuehrung_id, (countMap.get(c.durchfuehrung_id) ?? 0) + 1);
  }

  // Sort by next termin date
  const withNextDate = allRows.map((df) => {
    const sorted = [...df.termine].sort(
      (a, b) =>
        new Date(a.start_datetime).getTime() -
        new Date(b.start_datetime).getTime()
    );
    return { ...df, firstTermin: sorted[0]?.start_datetime ?? null };
  });

  withNextDate.sort((a, b) => {
    if (!a.firstTermin) return 1;
    if (!b.firstTermin) return -1;
    return new Date(a.firstTermin).getTime() - new Date(b.firstTermin).getTime();
  });

  const filtered = filterStatus
    ? withNextDate.filter((df) => df.status === filterStatus)
    : withNextDate;

  const tabCounts = {
    alle: withNextDate.length,
    geplant: withNextDate.filter((d) => d.status === "geplant").length,
    "bestätigt": withNextDate.filter((d) => d.status === "bestätigt").length,
    abgesagt: withNextDate.filter((d) => d.status === "abgesagt").length,
  };

  const tabs = [
    { key: "", label: `Alle (${tabCounts.alle})` },
    { key: "geplant", label: `Geplant (${tabCounts.geplant})` },
    { key: "bestätigt", label: `Bestätigt (${tabCounts["bestätigt"]})` },
    { key: "abgesagt", label: `Abgesagt (${tabCounts.abgesagt})` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Durchführungen</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Alle Kursdurchführungen im Überblick
        </p>
      </div>

      {/* Filter tabs */}
      <div className="mb-5 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => {
          const isActive = (filterStatus ?? "") === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key ? `/admin/durchfuehrungen?status=${encodeURIComponent(tab.key)}` : "/admin/durchfuehrungen"}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">Keine Durchführungen vorhanden.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Kurs
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Datum
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Ort
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-zinc-500">
                  TN
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((df) => (
                <tr
                  key={df.id}
                  className="bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                      {df.workshops?.title ?? "–"}
                    </p>
                    {df.workshops?.subtitle && (
                      <p className="text-xs text-zinc-500">
                        {df.workshops.subtitle}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {df.firstTermin ? formatDate(df.firstTermin) : "–"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {df.ort ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[df.status] ?? STATUS_COLORS.geplant
                      }`}
                    >
                      {STATUS_LABELS[df.status] ?? df.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {countMap.get(df.id) ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/durchfuehrungen/${df.id}`}
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      Verwalten →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
