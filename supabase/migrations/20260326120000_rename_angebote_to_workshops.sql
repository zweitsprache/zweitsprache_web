-- Rename table
ALTER TABLE angebote RENAME TO workshops;

-- Rename foreign key column
ALTER TABLE durchfuehrungen RENAME COLUMN angebot_id TO workshop_id;

-- Rename RLS policy
ALTER POLICY "Allow all on angebote" ON workshops RENAME TO "Allow all on workshops";

-- Recreate index with new name
DROP INDEX IF EXISTS idx_durchfuehrungen_angebot_id;
CREATE INDEX idx_durchfuehrungen_workshop_id ON durchfuehrungen(workshop_id);

-- Recreate views
DROP VIEW IF EXISTS durchfuehrungen_flat;
CREATE OR REPLACE VIEW durchfuehrungen_flat AS
SELECT
  d.id AS durchfuehrung_id,
  a.id AS workshop_id,
  a.title AS workshop_title,
  d.created_at,
  t.next_start,
  t.next_end,
  t.termin_count
FROM durchfuehrungen d
JOIN workshops a ON a.id = d.workshop_id
LEFT JOIN LATERAL (
  SELECT
    min(start_datetime) FILTER (WHERE start_datetime >= now()) AS next_start,
    min(end_datetime) FILTER (WHERE start_datetime >= now()) AS next_end,
    count(*)::int AS termin_count
  FROM termine
  WHERE durchfuehrung_id = d.id
) t ON true
ORDER BY t.next_start ASC NULLS LAST;
