// Backfills the "why_wrong" and "memory_aid" fields for any question that
// doesn't have them yet — useful after a bulk import, since imported
// questions only carry question/choices/correct answer/rationale.
//
// Usage:
//   1. Get an API key at https://console.anthropic.com/settings/keys
//      (paid, pay-per-use — 1057 questions costs roughly $2-4 total with
//      the model used here).
//   2. Set three env vars (same ones used elsewhere in this project):
//        NEXT_PUBLIC_SUPABASE_URL
//        SUPABASE_SERVICE_ROLE_KEY
//        ANTHROPIC_API_KEY
//   3. Run: node scripts/backfill_generate.js
//
// It processes questions one at a time with a short delay between calls,
// and prints progress as it goes. Safe to stop (Ctrl+C) and re-run later —
// it only picks up questions still missing why_wrong.

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !supabaseKey || !anthropicKey) {
  console.error(
    "Missing one of: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generate(q) {
  const choiceLines = ["A", "B", "C", "D", "E"]
    .filter((l) => q[`choice_${l.toLowerCase()}`])
    .map((l) => `${l}) ${q[`choice_${l.toLowerCase()}`]}`)
    .join("\n");

  const prompt = `You are helping build a study question bank. Given this question, its choices, the correct answer, and the rationale, produce two things:

1. "why_wrong": a short, simple explanation (as if to a five-year-old) of why EACH incorrect choice is wrong. Label each by its letter. Keep it plain and concrete, no jargon.
2. "memory_aid": one short, memorable mnemonic, phrase, or trick to help remember the correct answer.

Question: ${q.question}
${choiceLines}
Correct answer: ${q.correct_answer}
Rationale: ${q.rationale}

Respond ONLY with valid JSON, no other text, in exactly this shape:
{"why_wrong": "...", "memory_aid": "..."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API error: ${await res.text()}`);
  }

  const data = await res.json();
  const textBlock = data.content.find((c) => c.type === "text");
  const clean = (textBlock ? textBlock.text : "{}").replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function main() {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .is("why_wrong", null);

  if (error) {
    console.error("Failed to fetch questions:", error.message);
    process.exit(1);
  }

  console.log(`${questions.length} questions need generation.`);

  let done = 0;
  for (const q of questions) {
    try {
      const { why_wrong, memory_aid } = await generate(q);
      const { error: updateError } = await supabase
        .from("questions")
        .update({ why_wrong, memory_aid })
        .eq("id", q.id);
      if (updateError) throw updateError;
      done++;
      console.log(`[${done}/${questions.length}] Updated question #${q.id}`);
    } catch (err) {
      console.error(`Question #${q.id} failed:`, err.message);
    }
    // small delay to stay well under rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log("Done.");
}

main();
