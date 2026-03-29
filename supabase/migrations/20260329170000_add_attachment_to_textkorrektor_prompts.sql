ALTER TABLE textkorrektor_prompts
  ADD COLUMN attachment_base64 TEXT,
  ADD COLUMN attachment_mime_type TEXT;
