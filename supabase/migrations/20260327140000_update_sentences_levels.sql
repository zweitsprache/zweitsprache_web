-- Drop old constraint first
alter table sentences drop constraint sentences_level_check;

-- Migrate existing rows to new sub-level format
update sentences set level = level || '.1' where level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- Add new constraint
alter table sentences add constraint sentences_level_check
  check (level in ('A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'));
