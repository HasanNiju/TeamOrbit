-- ---------------------------------------------------------------------------
-- TeamOrbit — Supabase schema
--
-- Run this ONCE in your Supabase project: Dashboard → SQL Editor → New query
-- → paste this whole file → Run.
--
-- After running this, copy your Project URL and the "service_role" key
-- (Project Settings → API) into backend/.env (local) and into your Vercel
-- project's Environment Variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
-- ---------------------------------------------------------------------------

create table if not exists users (
  id text primary key,
  employee_id text not null unique,
  name text not null,
  name_en text,
  password_hash text not null,
  role text not null check (role in ('MARKETING_OFFICER', 'ADMIN', 'SUPER_ADMIN')),
  designation text,
  mobile text,
  address text,
  zone text,
  profile_photo_url text,
  team_leader_id text references users(id) on delete set null,
  manager_id text references users(id) on delete set null,
  language text default 'bn',
  status text default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_users_employee_id on users (lower(employee_id));
create index if not exists idx_users_role on users (role);
create index if not exists idx_users_team_leader_id on users (team_leader_id);
create index if not exists idx_users_manager_id on users (manager_id);

create table if not exists submissions (
  id text primary key,
  employee_user_id text not null references users(id) on delete cascade,
  employee_id text not null,
  name_snapshot text not null,
  designation_snapshot text,
  address text,
  mobile text,
  opinion text,
  submission_date text not null, -- YYYY-MM-DD, Dhaka-local day key
  submitted_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_submissions_employee_user_id on submissions (employee_user_id);
create index if not exists idx_submissions_submission_date on submissions (submission_date);

create table if not exists audit_logs (
  id text primary key,
  actor_id text,
  actor_name text,
  actor_role text,
  action text not null,
  target jsonb,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_created_at on audit_logs (created_at desc);

-- Server-side grouped count of submissions per employee, used for the
-- leaderboard/rank calculation without pulling every submission row.
create or replace function submission_counts()
returns table(employee_user_id text, total bigint)
language sql
stable
as $$
  select employee_user_id, count(*) as total
  from submissions
  group by employee_user_id;
$$;

-- Row Level Security is left OFF on these tables intentionally: the backend
-- talks to Supabase only with the service_role key (server-side, never
-- exposed to the browser), which already bypasses RLS. The frontend never
-- calls Supabase directly — every request goes through this app's /api/*
-- routes, which enforce auth and roles themselves.
