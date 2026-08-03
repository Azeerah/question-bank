import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabaseClient";

// GET /api/categories -> list of distinct category values in use, with counts
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.from("questions").select("category");
    if (error) throw error;

    const counts = {};
    for (const row of data) {
      const cat = row.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    }

    const categories = Object.entries(counts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ categories });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
