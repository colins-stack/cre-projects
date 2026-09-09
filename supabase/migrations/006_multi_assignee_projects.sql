-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

-- projects: same treatment as tasks (migration 005) — replace the single
-- free-text assignee with a list, so a project can be assigned to
-- multiple people, or no one.
alter table projects add column assignees text[] not null default '{}'::text[];
update projects set assignees = array[assignee] where assignee is not null and assignee <> '';
alter table projects drop column assignee;
