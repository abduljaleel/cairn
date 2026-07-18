-- 00003_questions_seed_guard.sql
-- Guards the self-seeding global questions catalog (see src/lib/data/api.ts:
-- seedQuestionCatalog/fetchQuestionRows). Two gaps in 00002_assessments.sql:
--   1. questions had only a SELECT RLS policy, so the app's documented
--      self-seed path was denied in any environment provisioned from
--      migrations alone.
--   2. No unique constraint on question_text, so concurrent first-loads
--      could insert duplicate catalog rows (the app dedupes on read and
--      tolerates 23505 on seed, but the data itself stayed dirty).
-- Both fixes are idempotent and safe to run on environments where a
-- differently-named INSERT policy or pre-existing rows already exist.

-- 1) Remove any existing duplicate catalog rows, keeping the earliest row
--    per question_text (lowest order_index, then created_at, then id).
delete from public.questions q
using (
  select id,
         row_number() over (
           partition by question_text
           order by order_index asc, created_at asc, id asc
         ) as rn
  from public.questions
) d
where q.id = d.id
  and d.rn > 1;

-- 2) Enforce catalog uniqueness at the DB level so concurrent seeds cannot
--    create duplicates (the app already tolerates 23505 from this index).
create unique index if not exists questions_question_text_key
  on public.questions (question_text);

-- 3) Allow the authenticated self-seed path. Guarded: skip if any INSERT
--    policy already exists on public.questions (e.g. the live project's
--    "authenticated seed questions").
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'questions'
      and cmd = 'INSERT'
  ) then
    create policy "Authenticated users can seed questions"
      on public.questions
      for insert
      with check (auth.role() = 'authenticated');
  end if;
end;
$$;
