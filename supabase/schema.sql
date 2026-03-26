-- Angebote table
create table angebote (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
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

-- Flat view for JetEngine listings: one row per Durchführung
create or replace view durchfuehrungen_flat as
select
  d.id as durchfuehrung_id,
  a.id as angebot_id,
  a.title as angebot_title,
  d.created_at,
  t.next_start,
  t.next_end,
  t.termin_count
from durchfuehrungen d
join angebote a on a.id = d.angebot_id
left join lateral (
  select
    min(start_datetime) filter (where start_datetime >= now()) as next_start,
    min(end_datetime) filter (where start_datetime >= now()) as next_end,
    count(*)::int as termin_count
  from termine
  where durchfuehrung_id = d.id
) t on true
order by t.next_start asc nulls last;
