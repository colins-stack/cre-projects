-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'future'
    check (status in ('future', 'planned', 'active', 'onhold', 'completed')),
  doc_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects (id) on delete set null,
  title text not null,
  notes text,
  status text not null default 'todo'
    check (status in ('todo', 'inprogress', 'blocked', 'done')),
  due_date date,
  assignee text,
  doc_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Row Level Security: both logged-in team members share full access to
-- everything (this is a team board, not per-user siloed data).

alter table projects enable row level security;
alter table tasks enable row level security;

create policy "authenticated read projects" on projects
  for select to authenticated using (true);
create policy "authenticated insert projects" on projects
  for insert to authenticated with check (true);
create policy "authenticated update projects" on projects
  for update to authenticated using (true);
create policy "authenticated delete projects" on projects
  for delete to authenticated using (true);

create policy "authenticated read tasks" on tasks
  for select to authenticated using (true);
create policy "authenticated insert tasks" on tasks
  for insert to authenticated with check (true);
create policy "authenticated update tasks" on tasks
  for update to authenticated using (true);
create policy "authenticated delete tasks" on tasks
  for delete to authenticated using (true);
