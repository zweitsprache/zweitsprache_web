import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PlateRenderer } from "@/components/plate/static-renderer";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: page } = await supabase
    .from("pages")
    .select("title")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!page) return {};

  return {
    title: `${page.title} – Zweitsprache`,
  };
}

export default async function PublicPage({ params }: Props) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: page } = await supabase
    .from("pages")
    .select("data")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (!page) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <PlateRenderer value={page.data} />
    </div>
  );
}
