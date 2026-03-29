-- Add structured context JSON column to handlungsfelder
ALTER TABLE handlungsfelder ADD COLUMN context_json jsonb;

-- Subdomain table for embedding-based topic → subdomain matching
-- Uses vector(1536) to match the text-embedding-3-small model used in the generate route
CREATE TABLE hf_subdomains (
  id         text       PRIMARY KEY,          -- e.g. "wohnen_wohnungssuche"
  hf_code    char(3)    NOT NULL REFERENCES handlungsfelder(code) ON DELETE CASCADE,
  name       text       NOT NULL,             -- e.g. "Wohnungssuche"
  embedding  extensions.vector(1536),
  sort_order smallint   NOT NULL DEFAULT 0
);

ALTER TABLE hf_subdomains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read hf_subdomains"
  ON hf_subdomains FOR SELECT USING (true);

CREATE POLICY "Admin write hf_subdomains"
  ON hf_subdomains FOR ALL
  USING (auth.jwt() ->> 'email' = 'admin@zweitsprache.ch')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@zweitsprache.ch');

-- HNSW index for cosine similarity (same approach as sentences table)
CREATE INDEX idx_hf_subdomains_embedding
  ON hf_subdomains USING hnsw (embedding extensions.vector_cosine_ops);

-- RPC: match topic embedding → closest subdomain within a given HF
CREATE OR REPLACE FUNCTION match_hf_subdomain(
  query_embedding extensions.vector(1536),
  p_hf_code       char(3),
  match_threshold float  DEFAULT 0.0,
  match_count     int    DEFAULT 1
)
RETURNS TABLE (id text, name text, similarity float)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    (1 - (s.embedding <=> query_embedding))::float AS similarity
  FROM hf_subdomains s
  WHERE s.hf_code = p_hf_code
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
