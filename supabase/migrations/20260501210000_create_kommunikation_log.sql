-- Communication log: tracks every email sent to participants per anmeldung
create table kommunikation_log (
  id uuid primary key default gen_random_uuid(),
  anmeldung_id uuid not null references anmeldungen(id) on delete cascade,
  durchfuehrung_id uuid not null references durchfuehrungen(id) on delete cascade,
  typ text not null check (typ in ('rechnung', 'vorbereitungsaufgabe', 'teilnahmebestaetigung')),
  email text not null,
  betreff text,
  gesendet_at timestamptz not null default now()
);

create index idx_kommunikation_log_anmeldung_id on kommunikation_log(anmeldung_id);
create index idx_kommunikation_log_durchfuehrung_id on kommunikation_log(durchfuehrung_id);
create index idx_kommunikation_log_durchfuehrung_typ on kommunikation_log(durchfuehrung_id, typ);

-- Enable RLS
alter table kommunikation_log enable row level security;

-- Only authenticated admins can read/write
create policy "Allow admin all on kommunikation_log"
  on kommunikation_log for all
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  );
