// Bulk-import questions into Supabase from a JSON file.
//
// Usage:
//   1. Put your questions in scripts/questions.json (array of objects, see
//      scripts/questions.example.json for the shape).
//   2. Run: node scripts/import.js
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set
// in your environment (e.g. `export $(cat .env.local | xargs)` first, or
// paste them directly below for a one-off run).

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment."
  );
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const filePath = path.join(__dirname, "questions.json");
  if (!fs.existsSync(filePath)) {
    console.error(`No file found at ${filePath}. See questions.example.json for the format.`);
    process.exit(1);
  }

  const questions = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`Importing ${questions.length} questions...`);

  const BATCH_SIZE = 100;
  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from("questions").insert(batch);
    if (error) {
      console.error(`Batch starting at ${i} failed:`, error.message);
      process.exit(1);
    }
    console.log(`Imported ${Math.min(i + BATCH_SIZE, questions.length)}/${questions.length}`);
  }

  console.log("Done.");
}

main();
