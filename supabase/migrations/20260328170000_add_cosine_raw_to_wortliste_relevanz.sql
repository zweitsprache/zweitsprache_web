-- Add raw cosine score storage to wortliste_relevanz.
-- This decouples the stored measurement from the display formula:
-- cosine_raw = raw embedding cosine similarity (permanent, never recalculated)
-- score      = rescaled display score (can be updated cheaply without API calls)
alter table wortliste_relevanz
  add column if not exists cosine_raw numeric(5, 4);
