create table niveauregeln (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint niveauregeln_data_is_object check (jsonb_typeof(data) = 'object')
);

alter table niveauregeln enable row level security;

create policy "Allow all niveauregeln" on niveauregeln for all using (true) with check (true);

insert into niveauregeln (id, data)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

create trigger niveauregeln_updated_at
  before update on niveauregeln
  for each row
  execute function update_updated_at();