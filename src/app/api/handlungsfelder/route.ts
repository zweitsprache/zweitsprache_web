import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from("handlungsfelder")
      .select("code, name")
      .order("sort_order");

    if (error) {
      console.error("Handlungsfelder error:", error);
      return NextResponse.json(
        { error: "Fehler beim Laden der Handlungsfelder." },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Handlungsfelder error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Handlungsfelder." },
      { status: 500 }
    );
  }
}
