-- User roles table: one user can have multiple roles
create table user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role    text not null check (role in ('admin', 'subscriber', 'student')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Index for efficient per-user lookups
create index idx_user_roles_user_id on user_roles(user_id);

-- Helper: check if the current user has a specific role
create or replace function has_role(r text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = r
  )
$$;

-- Helper: check if the current user is an admin
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin'
  )
$$;

alter table user_roles enable row level security;

-- Users can see their own roles
create policy "Users read own roles" on user_roles
  for select using (auth.uid() = user_id);

-- Admins can manage all roles
create policy "Admins manage roles" on user_roles
  for all using (is_admin()) with check (is_admin());
