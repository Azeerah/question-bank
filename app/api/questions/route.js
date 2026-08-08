import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabaseClient";

// GET /api/questions        -> list all questions (optionally ?search=&category=)
// POST /api/questions       -> create one question
export async function GET(request) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    let query = supabase
      .from("questions")
      .select("*")
      .order("id", { ascending: false })
      .range(0, 9999); // Supabase defaults to a 1000-row cap otherwise

    if (search) {
      query = query.ilike("question", `%${search}%`);
    }
    // "Uncategorized" covers questions where category is NULL in the
    // database, not the literal string "Uncategorized" (a couple of rows
    // do have that literal text stored, so we match both).
    if (category === "Uncategorized") {
      query = query.or("category.is.null,category.eq.Uncategorized");
    } else if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ questions: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    // choice_e is optional — most questions have 4 choices, some have 5
    const required = [
      "question",
      "choice_a",
      "choice_b",
      "choice_c",
      "choice_d",
      "correct_answer",
      "rationale",
    ];
    for (const field of required) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("questions")
      .insert([
        {
          question: body.question,
          choice_a: body.choice_a,
          choice_b: body.choice_b,
          choice_c: body.choice_c,
          choice_d: body.choice_d,
          choice_e: body.choice_e || null,
          correct_answer: body.correct_answer.toUpperCase(),
          rationale: body.rationale,
          why_wrong: body.why_wrong || null,
          memory_aid: body.memory_aid || null,
          category: body.category || null,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ question: data[0] }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}