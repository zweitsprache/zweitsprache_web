create table textkorrektor_prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prompt text not null,
  additional_info text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table textkorrektor_prompts enable row level security;

create policy "Allow public read textkorrektor_prompts" on textkorrektor_prompts
  for select using (true);

create policy "Admin write textkorrektor_prompts" on textkorrektor_prompts
  for all using (
    exists (
      select 1 from user_roles where user_id = auth.uid() and role = 'admin'
    )
  ) with check (
    exists (
      select 1 from user_roles where user_id = auth.uid() and role = 'admin'
    )
  );

-- Seed with a default DaZ correction prompt
insert into textkorrektor_prompts (name, prompt, sort_order) values (
  'Standard DaZ-Korrektur',
  'Du bist ein DaZ-Lehrer (Deutsch als Zweitsprache) und korrigierst Texte von Lernenden.',
  0
);
