import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("workshops")
    .select(`
      id,
      title,
      about,
      created_at,
      lernziele (
        id,
        text,
        sort_order
      ),
      inhalte (
        id,
        text,
        sort_order
      ),
      voraussetzungen (
        id,
        text,
        sort_order
      ),
      durchfuehrungen (
        id,
        created_at,
        termine (
          id,
          start_datetime,
          end_datetime
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
