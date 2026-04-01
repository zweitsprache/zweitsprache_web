-- Add rich content field to themen (same JSONB structure as lessons.data)
ALTER TABLE themen
  ADD COLUMN IF NOT EXISTS data jsonb;
