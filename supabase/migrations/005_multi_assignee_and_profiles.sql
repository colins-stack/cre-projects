-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

-- profiles: each authenticated user sets their own display name (in
-- Settings), used to match "My Tasks" against a task's assignees list.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "authenticated read profiles" on profiles
  for select to authenticated using (true);
create policy "users insert own profile" on profiles
  for insert to authenticated with check (auth.uid() = id);
create policy "users update own profile" on profiles
  for update to authenticated using (auth.uid() = id);

-- tasks: replace the single free-text assignee with a list, so a task can
-- be assigned to multiple people, or no one.
alter table tasks add column assignees text[] not null default '{}'::text[];
update tasks set assignees = array[assignee] where assignee is not null and assignee <> '';
alter table tasks drop column assignee;
