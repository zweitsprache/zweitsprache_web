-- Themen table (children of Modules, 1:n — sits between Module and Lesson)
create table themen (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_themen_module_id on themen(module_id);

-- Enable RLS with permissive policy
alter table themen enable row level security;
create policy "Allow all on themen" on themen for all using (true) with check (true);

-- Migrate existing lessons: create one default thema per module that has lessons
insert into themen (id, module_id, title, sort_order)
select gen_random_uuid(), m.id, 'Allgemein', 0
from modules m
where exists (select 1 from lessons l where l.module_id = m.id);

-- Add thema_id column to lessons (nullable initially)
alter table lessons add column thema_id uuid references themen(id) on delete cascade;

-- Assign existing lessons to their module's default thema
update lessons l
set thema_id = t.id
from themen t
where t.module_id = l.module_id;

-- Make thema_id NOT NULL now that all rows have values
alter table lessons alter column thema_id set not null;

-- Drop old module_id FK from lessons (thema already links to module)
alter table lessons drop column module_id;

-- Index on thema_id
create index idx_lessons_thema_id on lessons(thema_id);
