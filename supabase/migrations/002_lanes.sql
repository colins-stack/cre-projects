-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

create table lanes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table projects add column lane_id uuid references lanes (id) on delete set null;

alter table lanes enable row level security;

create policy "authenticated read lanes" on lanes
  for select to authenticated using (true);
create policy "authenticated insert lanes" on lanes
  for insert to authenticated with check (true);
create policy "authenticated update lanes" on lanes
  for update to authenticated using (true);
create policy "authenticated delete lanes" on lanes
  for delete to authenticated using (true);
