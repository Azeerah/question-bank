// scripts/import-questions.js
//
// Usage:
//   node scripts/import-questions.js path/to/questions.json
//
// Reads a questions.json file (array of question objects), inserts each
// row into the `questions` table, then seeds a matching row in
// `question_status` for each newly inserted question (since there is no
// DB trigger that does this automatically).

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.'
  );
  console.error('Check that .env.local exists and has both values set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error('Usage: node scripts/import-questions.js path/to/questions.json');
    process.exit(1);
  }

  const fullPath = path.resolve(inputPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(fullPath, 'utf-8');
  let questions;
  try {
    questions = JSON.parse(raw);
  } catch (err) {
    console.error('Could not parse JSON:', err.message);
    process.exit(1);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    console.error('JSON file must contain a non-empty array of question objects.');
    process.exit(1);
  }

  console.log(`Loaded ${questions.length} questions from ${fullPath}`);

  // Insert into `questions` table.
  // Adjust this mapping if your table's actual column names differ.
  const rows = questions.map((q) => ({
    question: q.question,
    choice_a: q.choice_a,
    choice_b: q.choice_b,
    choice_c: q.choice_c,
    choice_d: q.choice_d,
    choice_e: q.choice_e ?? null,
    correct_answer: q.correct_answer,
    rationale: q.rationale ?? null,
    why_wrong: q.why_wrong ?? null,
    memory_aid: q.memory_aid ?? null,
    category: q.category ?? null,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('questions')
    .insert(rows)
    .select('id');

  if (insertError) {
    console.error('Insert into questions failed:', insertError.message);
    process.exit(1);
  }

  console.log(`Inserted ${inserted.length} rows into questions.`);

  // Seed matching question_status rows (no auto-trigger exists for this).
  const statusRows = inserted.map((row) => ({
    question_id: row.id,
    status: 'unattempted',
  }));

  const { error: statusError } = await supabase
    .from('question_status')
    .insert(statusRows);

  if (statusError) {
    console.error('Insert into question_status failed:', statusError.message);
    console.error(
      'Questions were inserted, but status rows were not seeded — you may need to run this part manually.'
    );
    process.exit(1);
  }

  console.log(`Seeded ${statusRows.length} rows in question_status.`);
  console.log('Import complete.');
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
