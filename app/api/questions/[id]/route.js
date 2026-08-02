import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../../lib/supabaseClient";

export async function DELETE(request, { params }) {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("questions").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("questions")
      .update(body)
      .eq("id", params.id)
      .select();
    if (error) throw error;
    return NextResponse.json({ question: data[0] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
