-- Add about (rich text) column to workshops
alter table workshops add column about text;

-- Inhalte table (children of Workshops, 1:n)
create table inhalte (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table inhalte enable row level security;
create policy "Allow all on inhalte" on inhalte for all using (true) with check (true);
create index idx_inhalte_workshop_id on inhalte(workshop_id);

-- Voraussetzungen table (children of Workshops, 1:n)
create table voraussetzungen (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table voraussetzungen enable row level security;
create policy "Allow all on voraussetzungen" on voraussetzungen for all using (true) with check (true);
create index idx_voraussetzungen_workshop_id on voraussetzungen(workshop_id);
