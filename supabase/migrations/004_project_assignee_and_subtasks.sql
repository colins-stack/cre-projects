-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

alter table projects add column assignee text;

create table subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  title text not null,
  done boolean not null default false,
  assignee text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table subtasks enable row level security;

create policy "authenticated read subtasks" on subtasks
  for select to authenticated using (true);
create policy "authenticated insert subtasks" on subtasks
  for insert to authenticated with check (true);
create policy "authenticated update subtasks" on subtasks
  for update to authenticated using (true);
create policy "authenticated delete subtasks" on subtasks
  for delete to authenticated using (true);
