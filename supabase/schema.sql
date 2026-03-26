-- Angebote table
create table angebote (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

-- Durchführungen table (children of Angebote, 1:n)
create table durchfuehrungen (
  id uuid primary key default gen_random_uuid(),
  angebot_id uuid not null references angebote(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Termine table (children of Durchführungen, 1:n)
create table termine (
  id uuid primary key default gen_random_uuid(),
  durchfuehrung_id uuid not null references durchfuehrungen(id) on delete cascade,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table angebote enable row level security;
alter table durchfuehrungen enable row level security;
alter table termine enable row level security;

-- Allow public read/write for now (adjust for auth later)
create policy "Allow all on angebote" on angebote for all using (true) with check (true);
create policy "Allow all on durchfuehrungen" on durchfuehrungen for all using (true) with check (true);
create policy "Allow all on termine" on termine for all using (true) with check (true);
