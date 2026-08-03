# Question Bank Project — Status & Handoff

## What this project is
A study/quiz website for a 1057-question exam bank (medical/health science
subjects). Built with Next.js + Supabase (database) + Vercel (hosting) +
GitHub (code storage). Cost: $0 so far, except an optional small future
cost (~$2-4 total) to auto-generate two extra fields per question.

## Live site
https://question-bank-one-blush.vercel.app/

## GitHub repo
https://github.com/Azeerah/question-bank

## Supabase project
URL: https://avgnbmpxtnmnlavkzzpo.supabase.co
(Log in at supabase.com/dashboard to manage it — Project Settings > API
for keys, SQL Editor to run queries.)

## Local project folder on this Windows machine
`C:\question-bank_1\questionbank`
(Note: there's a stray near-empty `package-lock.json` sitting one level up
at `C:\question-bank_1\` — safe to ignore or delete, it's leftover from an
earlier mistake, not part of the real project.)

## Two separate question banks now in play
1. **Word doc bank**: 1057 questions (general medical/health science), file
   `questions.json`, categories not set.
2. **FMCFM bank**: 656 questions (NPMCN Family Medicine exam prep, 15
   course codes FAM901-FAM915), file `questions_fmcfm.json`. This is what
   "the original 656" referred to — it came from a pre-existing React quiz
   app the user had built separately (`primary-fmcfm-quiz.jsx`), which
   already had `why_wrong` and `memory_aid`-equivalent fields built in, so
   this bank needs NO AI backfill — it's already complete on import.
   Category field is set to the course code (e.g. `FAM901`) per question,
   so the Browse page's category filter can group by course.

Both files use the same import format and both go through
`scripts/import.js` (run it once per file, renaming/pointing at each in
turn, or import one, then replace `scripts/questions.json` with the other
and run again).

## What's been done so far
1. Built the full app: homepage, `/study` (quiz mode), `/browse`
   (search/view/delete), `/add` (form to add new questions, with an
   optional "Generate" button that calls the Anthropic API to fill in
   the two AI-assisted fields below).
2. Installed Node.js, Git, and all npm dependencies locally. Fixed a
   Next.js security vulnerability by upgrading to 14.2.35 (ignore any
   npm audit warnings about `sharp` or `postcss` — those are inside
   Next.js's own bundled tools, not exploitable in this project's setup,
   and the suggested "fix" would break everything by downgrading Next.js
   to a 2019 version. Leave them alone.)
3. Tested locally — saving and reading questions via Supabase confirmed
   working.
4. Pushed code to GitHub, deployed to Vercel (live URL above), with
   `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set as
   Vercel environment variables.
5. User uploaded their real question bank as a Word doc (`my_qb.docx`),
   containing 1057 questions in this format:
   ```
   Q001. [question text]
   A. [choice]
   B. [choice]
   C. [choice]
   D. [choice]
   (sometimes E. [choice] — 149 of the 1057 questions have 5 choices)
   Correct Answer: [letter]. [text]
   Explanation: [rationale]
   ```
6. Parsed all 1057 into `scripts/questions.json`, ready for bulk import.
   Zero parsing errors after fixing a couple of source-doc quirks (one
   line where two choices ran together without a line break).
7. Extended the app's database schema, API, and all three pages
   (Study/Browse/Add) to support the 5-choice questions — originally it
   only supported 4. Added `supabase/migration_add_choice_e.sql` since
   the original 4-choice schema was already live in Supabase with a test
   question in it.
8. Currently importing the 1057 questions via `scripts/import.js` — this
   is the step in progress when this file was written (see "Next steps").

## Important: fields NOT yet filled in
The 1057 imported questions only have: question, choices, correct answer,
rationale. They do NOT yet have `why_wrong` (ELI5 explanation of why the
incorrect choices are wrong) or `memory_aid` (mnemonic). Those are
optional/nullable fields — the site works fine without them, but the
original ask was to have them for every question.

## Next steps, in order

### A. Finish importing the 1057 questions (if not already done)
1. Run the migration first (one-time), in Supabase SQL Editor:
   paste and run the full contents of `supabase/migration_add_choice_e.sql`.
   This only adds a new optional column and widens a constraint — it does
   not touch or remove any existing data, safe to run even if some
   questions are already imported.
2. In terminal, in `C:\question-bank_1\questionbank`:
   ```
   set NEXT_PUBLIC_SUPABASE_URL=https://avgnbmpxtnmnlavkzzpo.supabase.co
   set SUPABASE_SERVICE_ROLE_KEY=<the real secret key, from Supabase Settings > API>
   node scripts/import.js
   ```
   Each `set` line should be typed and Enter pressed individually before
   moving to the next line — don't paste all three at once if unsure.
   Expect ~10-20 seconds and progress lines like `Imported 100/1057`.
3. Verify: visit https://question-bank-one-blush.vercel.app/browse and
   confirm questions show up (the live site reads the same Supabase
   database, so no redeploy needed for this step — only the `import.js`
   script needs to run once, locally).

### B. Push the updated app code (5-choice support) live
```
git add .
git commit -m "Support 5-choice questions, bulk import 1057 questions"
git push
```
Vercel auto-redeploys within about a minute of the push.

### C. (Optional, ~$2-4 total) Generate why_wrong + memory_aid for all 1057
1. Get an API key at https://console.anthropic.com/settings/keys (separate
   from a claude.ai login — this is a pay-per-use developer key).
2. In terminal:
   ```
   set ANTHROPIC_API_KEY=<the key>
   node scripts/backfill_generate.js
   ```
3. This processes one question at a time (~5-6 minutes for 1057), safe to
   stop with Ctrl+C and re-run later — it only picks up questions still
   missing `why_wrong`.

### D. Ongoing daily use
- Add ~30 new questions/day directly at `/add` on the live site (works
  from any device, no terminal needed) — the "Generate" button there
  calls the same Anthropic API per-question if `ANTHROPIC_API_KEY` is
  also set as a Vercel environment variable (Project > Settings >
  Environment Variables > Add, then redeploy).
- Study at `/study`, browse/search/delete at `/browse`.

### E. Optional later: custom domain
Buy a domain anywhere (~$10-15/year), then in Vercel: Project > Settings
> Domains > add it, follow the 1-2 DNS records it shows you at your
domain registrar.

## Common gotchas already hit and fixed (for reference)
- Terminal commands must be typed while `cd`'d into the actual project
  folder (`C:\question-bank_1\questionbank`), not `C:\Users\<name>` or a
  parent folder — check with `dir`, should show `package.json` directly.
- Two commands pasted onto one line will fail (e.g. `git branch -M
  maingit remote add origin ...`) — always one command per Enter press.
- Git needs to be installed separately (git-scm.com) and the terminal
  fully closed and reopened after installing before `git` is recognized.
- `npm audit fix --force` should NOT be run in this project — it
  downgrades Next.js to a broken, ancient version. The flagged
  vulnerabilities are in Next.js's own internal tooling and don't apply
  to this app's actual usage.
