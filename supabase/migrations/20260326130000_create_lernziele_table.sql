-- Lernziele table (children of Workshops, 1:n)
create table lernziele (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table lernziele enable row level security;

-- Allow public read/write for now (adjust for auth later)
create policy "Allow all on lernziele" on lernziele for all using (true) with check (true);

-- Index for efficient lookups
create index idx_lernziele_workshop_id on lernziele(workshop_id);
