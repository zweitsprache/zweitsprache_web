create table workshop_stimmen (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  name text,
  text text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index idx_workshop_stimmen_workshop_id on workshop_stimmen(workshop_id);

alter table workshop_stimmen enable row level security;

create policy "Allow all on workshop_stimmen" on workshop_stimmen for all using (true) with check (true);
