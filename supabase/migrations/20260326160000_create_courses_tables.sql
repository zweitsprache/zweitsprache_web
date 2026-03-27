-- Courses table
create table courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  about text,
  cover_image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- Modules table (children of Courses, 1:n)
create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Module Lernziele table (children of Modules, 1:n)
create table module_lernziele (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Lessons table (children of Modules, 1:n)
create table lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  data jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_modules_course_id on modules(course_id);
create index idx_module_lernziele_module_id on module_lernziele(module_id);
create index idx_lessons_module_id on lessons(module_id);

-- Enable RLS
alter table courses enable row level security;
alter table modules enable row level security;
alter table module_lernziele enable row level security;
alter table lessons enable row level security;

-- Permissive policies (same pattern as existing tables)
create policy "Allow all on courses" on courses for all using (true) with check (true);
create policy "Allow all on modules" on modules for all using (true) with check (true);
create policy "Allow all on module_lernziele" on module_lernziele for all using (true) with check (true);
create policy "Allow all on lessons" on lessons for all using (true) with check (true);
