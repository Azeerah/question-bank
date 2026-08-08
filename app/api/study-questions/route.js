import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/study-questions?category=FAM903  (omit category for all units)
// Note: "Uncategorized" covers questions where category is NULL in the
// database, not the literal string "Uncategorized" (a couple of rows do
// have that literal text stored, so we match both).
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  let query = supabase
    .from('questions')
    .select(
      'id, question, choice_a, choice_b, choice_c, choice_d, choice_e, correct_answer, rationale, why_wrong, memory_aid, category'
    )
    .range(0, 9999); // Supabase defaults to a 1000-row cap otherwise

  if (category === 'Uncategorized') {
    query = query.or('category.is.null,category.eq.Uncategorized');
  } else if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}