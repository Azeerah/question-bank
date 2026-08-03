# Question Bank

A study/quiz site for your exam question bank: quiz mode, browse & search,
and a form to add new questions daily. Each question stores its 4 choices,
correct answer, rationale, a plain-language explanation of why the other
answers are wrong, and a memory aid.

This app is built to run **entirely free** on GitHub + Vercel + Supabase,
including AI-generated "why wrong" and "memory aid" fields via Google
Gemini's free tier.

---

## 1. Create your Supabase project (free) — the database

1. Go to https://supabase.com and sign up (you can use your GitHub account).
2. Click **New project**. Pick any name and password (save the password
   somewhere, you won't need it directly but Supabase asks for one).
3. Once it's created, go to **SQL Editor** (left sidebar) → **New query**.
4. Open `supabase/schema.sql` from this project, paste its contents in, and
   click **Run**. This creates the `questions` table.
5. Go to **Project Settings** → **API**. You'll need two values from this
   page in step 3 below:
   - **Project URL**
   - **service_role key** (click "Reveal" — keep this secret, never put it
     in client-side code or commit it to GitHub)

## 2. Push this code to GitHub

1. Create a new empty repository on GitHub (e.g. `question-bank`).
2. In a terminal, from this project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/question-bank.git
   git push -u origin main
   ```
   (`.env.local` is already excluded via `.gitignore` — never commit your
   real keys.)

## 3. Deploy to Vercel (free) — the hosting

1. Go to https://vercel.com and sign up with your GitHub account.
2. Click **Add New… → Project**, and import the `question-bank` repo you
   just pushed.
3. Before deploying, expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your Supabase service_role key |
   | `GEMINI_API_KEY` | *(optional, free — see step 4)* |
4. Click **Deploy**. In about a minute you'll get a live URL like
   `question-bank-yourname.vercel.app` — that's your working site.

Every time you push new code to GitHub, Vercel redeploys automatically.

## 4. (Optional, free) Auto-generate wrong-answer explanations & memory aids

This feature calls Google's Gemini API from the "Add Question" page. Using
Gemini's free tier, this costs nothing at this app's usage level (the free
tier's daily/per-minute limits are well above ~30 questions/day). Google
does change free-tier terms occasionally — check
https://ai.google.dev/gemini-api/docs/pricing if this ever starts erroring.

1. Go to https://aistudio.google.com/apikey and create a free API key
   (no credit card required).
2. In Vercel: **Project → Settings → Environment Variables**, add
   `GEMINI_API_KEY` with that key.
3. Redeploy (Vercel → Deployments → ⋯ → Redeploy).

If you skip this, the "Add Question" form still works — you just type the
wrong-answer explanation and memory aid in yourself.

## 5. Add your custom domain (optional, ~$10-15/year)

1. Buy a domain anywhere (Namecheap, Google Domains, etc).
2. In Vercel: **Project → Settings → Domains**, add your domain.
3. Vercel shows you 1-2 DNS records to add at your domain registrar. Add
   them, wait a few minutes, and your custom domain will point at the site.

## 6. Bulk-importing your existing question bank

Once your Word document of questions is converted to the JSON shape shown
in `scripts/questions.example.json`:

1. Save your questions as `scripts/questions.json`.
2. If you already ran the original `schema.sql` before this update, run
   `supabase/migration_add_choice_e.sql` in the Supabase SQL Editor first
   (adds support for questions with 5 answer choices instead of 4).
3. Run locally (with your Supabase env vars set):
   ```bash
   npm install
   set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   node scripts/import.js
   ```
   (On Mac/Linux use `export` instead of `set`.)
This imports in batches of 100 and prints progress as it goes.

## 7. Backfilling "why wrong" + memory aid after a bulk import

Bulk-imported questions only carry the question, choices, correct answer,
and rationale — not the AI-generated wrong-answer explanation or memory aid.
To fill those in for everything missing them:

```bash
set GEMINI_API_KEY=your-free-gemini-key
node scripts/backfill_generate.js
```

This processes one question at a time (with a short pause between each to
respect the free tier's per-minute limit) and is safe to stop and re-run
later — it only picks up questions still missing `why_wrong`. Free, though
~1000 questions at a few seconds each will take a while to run — you can
leave it running in the background.

## Daily use

- **Add today's questions:** go to `/add` on your live site, fill in the
  form, optionally click "Generate" for the wrong-answer explanation and
  memory aid, then save. It appears immediately in Study and Browse.
- **Study:** `/study` — one question at a time, shuffled, with the full
  explanation revealed after you answer.
- **Browse:** `/browse` — search and review the whole bank, or delete a
  question.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your real values
npm run dev
```
Visit http://localhost:3000
