-- Upgrade embedding column from vector(1536) to vector(3072) for text-embedding-3-large.
-- Existing embeddings (computed with text-embedding-3-small) are incompatible and must be
-- cleared. They will be re-computed automatically when scoring is re-run from the admin UI.

ALTER TABLE wortlisten DROP COLUMN IF EXISTS embedding;
ALTER TABLE wortlisten ADD COLUMN embedding extensions.vector(3072);
