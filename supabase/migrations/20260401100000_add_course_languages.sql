-- Add available_languages array to courses
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS available_languages text[] NOT NULL DEFAULT '{}';

-- Create lesson_translations table for full per-locale content copies
CREATE TABLE IF NOT EXISTS lesson_translations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   uuid        NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  locale      text        NOT NULL CHECK (locale IN ('en', 'uk')),
  data        jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, locale)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_lesson_translations_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER lesson_translations_updated_at
  BEFORE UPDATE ON lesson_translations
  FOR EACH ROW EXECUTE FUNCTION update_lesson_translations_updated_at();

-- RLS
ALTER TABLE lesson_translations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all translations
CREATE POLICY "lesson_translations_select" ON lesson_translations
  FOR SELECT USING (true);

-- Only authenticated users can write translations
CREATE POLICY "lesson_translations_insert" ON lesson_translations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "lesson_translations_update" ON lesson_translations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "lesson_translations_delete" ON lesson_translations
  FOR DELETE USING (auth.role() = 'authenticated');
