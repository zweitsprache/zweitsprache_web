create table wortlisten (
  id uuid primary key default gen_random_uuid(),
  wort text not null,
  level text not null check (level in ('A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2', 'B2.1', 'B2.2')),
  embedding extensions.vector(1536),
  created_at timestamptz not null default now(),
  constraint wortlisten_wort_level_unique unique (wort, level)
);

alter table wortlisten enable row level security;
create policy "Allow all wortlisten" on wortlisten for all using (true) with check (true);

create table wortliste_relevanz (
  word_id uuid not null references wortlisten (id) on delete cascade,
  handlungsfeld_code char(3) not null references handlungsfelder (code) on delete cascade,
  score numeric(3, 2) not null check (score >= 0 and score <= 1),
  computed_at timestamptz not null default now(),
  constraint wortliste_relevanz_pkey primary key (word_id, handlungsfeld_code)
);

alter table wortliste_relevanz enable row level security;
create policy "Allow all wortliste_relevanz" on wortliste_relevanz for all using (true) with check (true);
