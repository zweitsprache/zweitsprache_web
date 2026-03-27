-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Sentence bank table for CEFR-annotated German sentences
create table sentences (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  attributes jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536),
  status text not null default 'draft' check (status in ('draft', 'approved')),
  batch_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_sentences_level on sentences(level);
create index idx_sentences_status on sentences(status);
create index idx_sentences_batch_id on sentences(batch_id);
create index idx_sentences_embedding on sentences using hnsw (embedding extensions.vector_cosine_ops);

-- RLS
alter table sentences enable row level security;
create policy "Allow all on sentences" on sentences for all using (true) with check (true);

-- Reuse existing updated_at trigger function
create trigger sentences_updated_at
  before update on sentences
  for each row
  execute function update_updated_at();

-- Similarity search function for the text generator
create or replace function match_sentences(
  query_embedding extensions.vector(1536),
  match_level text,
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  text text,
  level text,
  attributes jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    s.id,
    s.text,
    s.level,
    s.attributes,
    (1 - (s.embedding <=> query_embedding))::float as similarity
  from sentences s
  where s.status = 'approved'
    and s.level = match_level
    and 1 - (s.embedding <=> query_embedding) > match_threshold
  order by s.embedding <=> query_embedding
  limit match_count;
end;
$$;
