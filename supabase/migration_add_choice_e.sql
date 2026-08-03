-- Run this in Supabase SQL Editor if you already created the `questions`
-- table before (e.g. you already tested the app with a 4-choice question).
-- It adds support for a 5th answer choice without losing existing data.

alter table questions add column if not exists choice_e text;

alter table questions drop constraint if exists questions_correct_answer_check;
alter table questions add constraint questions_correct_answer_check
  check (correct_answer in ('A','B','C','D','E'));
