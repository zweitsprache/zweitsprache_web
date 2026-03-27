create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table pages enable row level security;

create policy "Allow all on pages" on pages for all using (true) with check (true);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pages_updated_at
  before update on pages
  for each row
  execute function update_updated_at();