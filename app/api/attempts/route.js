import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Same pattern as your other API routes: service role key, server-side only.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/attempts?mode=status&category=FAM903
//   -> [{ question_id, status, category }, ...]  (one row per question, from question_status view)
// GET /api/attempts?mode=history&category=FAM903&limit=100
//   -> [{ id, question_id, question, selected_answer, correct, attempted_at }, ...]
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'status';
  const category = searchParams.get('category');

  if (mode === 'status') {
    let query = supabase.from('question_status').select('question_id, status, category');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (mode === 'history') {
    const limit = Number(searchParams.get('limit')) || 200;
    let query = supabase
      .from('attempts')
      .select('id, question_id, selected_answer, correct, attempted_at, questions(question, category)')
      .order('attempted_at', { ascending: false })
      .limit(limit);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let rows = data.map((r) => ({
      id: r.id,
      questionId: r.question_id,
      question: r.questions?.question,
      category: r.questions?.category,
      selectedAnswer: r.selected_answer,
      correct: r.correct,
      attemptedAt: r.attempted_at,
    }));
    if (category) rows = rows.filter((r) => r.category === category);
    return NextResponse.json(rows);
  }

  return NextResponse.json({ error: 'unknown mode' }, { status: 400 });
}

// POST /api/attempts
// body: { questionId, selectedAnswer, correct }
export async function POST(request) {
  const body = await request.json();
  const { questionId, selectedAnswer, correct } = body;

  if (!questionId || selectedAnswer === undefined || correct === undefined) {
    return NextResponse.json(
      { error: 'questionId, selectedAnswer, and correct are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('attempts')
    .insert({ question_id: questionId, selected_answer: selectedAnswer, correct })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
