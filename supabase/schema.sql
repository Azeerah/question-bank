-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists questions (
  id bigint generated always as identity primary key,
  question text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  choice_e text,
  correct_answer text not null check (correct_answer in ('A','B','C','D','E')),
  rationale text not null,
  why_wrong text,
  memory_aid text,
  category text,
  created_at timestamptz default now()
);

create index if not exists questions_category_idx on questions (category);

-- Row Level Security: locked down by default. The app talks to Supabase
-- through server-side API routes using the service role key, which
-- bypasses RLS, so the table stays private from direct public access.
alter table questions enable row level security;
