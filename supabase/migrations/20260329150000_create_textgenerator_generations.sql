create table textgenerator_generations (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade,
  created_at      timestamptz not null default now(),

  -- Input metadata
  level           text        not null,
  topic           text        not null,
  region          text        not null,
  text_type       text        not null,
  handlungsfeld   text        not null,

  -- Output
  title           text,
  text            text        not null,
  match_count     int,

  -- Prompts used for generation
  prompt_system   text,
  prompt_user     text
);

alter table textgenerator_generations enable row level security;

-- Users can read and insert their own rows only
create policy "Users read own generations"
  on textgenerator_generations for select
  using (auth.uid() = user_id);

create policy "Users insert own generations"
  on textgenerator_generations for insert
  with check (auth.uid() = user_id);

-- Admins can read all rows
create policy "Admin read all generations"
  on textgenerator_generations for select
  using (is_admin());

create index idx_textgen_user_id    on textgenerator_generations(user_id);
create index idx_textgen_created_at on textgenerator_generations(created_at desc);
