# Project Ledger — Build Brief for Claude Code

A shared project & task tracker for a 2-person team (director + support), with real login,
hosted online, with the ability to link Microsoft Teams/SharePoint docs to any project or task.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router) | Frontend + backend API routes in one project |
| Database + Auth | Supabase | Hosted Postgres + built-in login, no auth code to write |
| Styling | Tailwind CSS | Fast, clean, plays well with AI-generated UI |
| Hosting | Vercel | Free tier, deploys from GitHub, instant HTTPS URL |

## Before opening Claude Code

1. Create a GitHub account + a new empty repo (e.g. `project-ledger`)
2. Create a Supabase account → new project → **Settings → API** → copy the **Project URL** and **anon public key**
3. Create a Vercel account (can connect it once code exists)

## Data model

```
projects
  id            uuid, primary key
  name          text
  description   text
  status        text   -- 'future' | 'planned' | 'active' | 'onhold' | 'completed'
  doc_links     jsonb  -- [{ label, url }]
  created_at    timestamptz

tasks
  id            uuid, primary key
  project_id    uuid, nullable, foreign key -> projects.id
  title         text
  notes         text
  status        text   -- 'todo' | 'inprogress' | 'blocked' | 'done'
  due_date      date, nullable
  assignee      text   -- one of the two team member names, or 'Both'
  doc_links     jsonb  -- [{ label, url }]
  created_at    timestamptz
  completed_at  timestamptz, nullable
```

Users themselves don't need a custom table — Supabase Auth handles that. Since it's just
the two of you, create both accounts manually in the Supabase dashboard
(**Authentication → Users → Add user**) rather than building a public sign-up flow.

All project/task data is shared between both logged-in users — this is a team board, not
siloed per-user data.

## Pages / features

- **`/login`** — Supabase email/password login. No public sign-up.
- **`/dashboard`** — stat strip (active projects, due this week, overdue, completed last 30 days),
  a "Needs Attention" list (overdue + blocked), an "Upcoming" list sorted by due date.
- **`/projects`** — filterable by status; each project shown as a card with description,
  task progress (e.g. "3/7 done"), and its linked docs as clickable chips.
- **`/projects/[id]`** — single project detail: full task list, add/edit tasks inline.
- **`/tasks`** — every task across every project; filter by project/status/assignee; sort by
  due date; quick inline status change.
- **Doc links** — on any project or task, an "Add doc link" control that takes a label and a
  URL (paste a Teams/SharePoint share link — right-click the file/page in Teams → Copy link).

## Design direction

Clean, functional, minimal — this is an internal tool, not a marketing site. Sidebar nav
(Dashboard / Projects / Tasks). Consistent status colors across projects and tasks (e.g.
amber = active/in progress, green = done/completed, red = blocked/overdue, gray = future/to do).

---

## Prompt to paste into Claude Code

Copy everything in the box below as your first message once you `cd` into your repo folder
and run `claude`.

```
I'm building a project & task tracker for a 2-person team (a director and a support role).
Set this up as a Next.js (App Router) + Supabase + Tailwind CSS project, ready to deploy to
Vercel.

Data model (Postgres via Supabase):

projects: id (uuid pk), name (text), description (text), status (text: future/planned/active/
onhold/completed), doc_links (jsonb array of {label, url}), created_at (timestamptz)

tasks: id (uuid pk), project_id (uuid, nullable fk -> projects.id), title (text), notes (text),
status (text: todo/inprogress/blocked/done), due_date (date, nullable), assignee (text),
doc_links (jsonb array of {label, url}), created_at (timestamptz), completed_at (timestamptz,
nullable)

Auth: Supabase email/password auth. No public sign-up page — just a login page. I'll create
the two user accounts manually in the Supabase dashboard.

Pages needed:
1. /login — email/password login via Supabase, redirect to /dashboard on success
2. /dashboard — stat cards (active projects, tasks due within 7 days, overdue tasks, tasks
   completed in the last 30 days), a "Needs Attention" section (overdue or blocked tasks),
   an "Upcoming" section (open tasks sorted by due date)
3. /projects — grid of project cards filterable by status, each showing name, status badge,
   description, task completion count, and linked docs as clickable chips
4. /projects/[id] — single project view with its full task list and inline add/edit
5. /tasks — full task list across all projects, filterable by project/status/assignee,
   sortable by due date, with inline status dropdowns
6. A reusable "doc link" UI component (label + URL) usable on both projects and tasks, since
   we'll be linking out to Microsoft Teams/SharePoint documents

All data is shared between both logged-in users (team board, not per-user).

Please:
1. Scaffold the Next.js project with Tailwind and the Supabase client
2. Give me the exact SQL to run in the Supabase SQL editor to create the tables above
3. Build the login page and auth middleware first, so we can confirm auth works end-to-end
   before building out the rest
4. Then build /dashboard, /projects, /projects/[id], and /tasks in that order, letting me
   test each one before moving to the next
5. Tell me exactly what environment variables to set (and where — .env.local vs Vercel) for
   the Supabase URL and anon key

Let's start with step 1 and 2, then pause so I can run the SQL myself before continuing.
```

---

### A note on pacing

Claude Code will move fast if you let it — the prompt above deliberately asks it to pause after
scaffolding + SQL so you can run the SQL yourself in Supabase before more code gets built on
top of it. Once login works end-to-end, everything after that is much lower-risk to keep
building incrementally.
