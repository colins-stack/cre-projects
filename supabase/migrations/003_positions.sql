-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

alter table lanes add column position integer not null default 0;
alter table projects add column position integer not null default 0;

-- Backfill existing rows with a stable initial order based on creation time
update lanes set position = sub.rn
from (
  select id, (row_number() over (order by created_at))::int as rn
  from lanes
) sub
where lanes.id = sub.id;

update projects set position = sub.rn
from (
  select id, (row_number() over (partition by lane_id order by created_at))::int as rn
  from projects
) sub
where projects.id = sub.id;
