-- Anmeldungen table (workshop registrations)
create table anmeldungen (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references workshops(id) on delete cascade,
  durchfuehrung_id uuid not null references durchfuehrungen(id) on delete cascade,

  -- Persönliche Angaben
  anrede text not null,
  vorname text not null,
  name text not null,
  strasse text not null,
  plz_ort text not null,
  email text not null,
  mobiltelefon text,

  -- Rechnungsadresse
  rechnungsadresse_typ text not null default 'privat',
  firma text,
  abteilung text,
  rechnung_strasse text,
  rechnung_plz_ort text,
  rechnung_email text,

  -- Sonstiges
  bemerkungen text,
  einwilligung boolean not null default false,
  agb boolean not null default false,

  created_at timestamptz not null default now()
);

-- Indexes
create index idx_anmeldungen_workshop_id on anmeldungen(workshop_id);
create index idx_anmeldungen_durchfuehrung_id on anmeldungen(durchfuehrung_id);

-- Enable RLS
alter table anmeldungen enable row level security;

-- Public insert policy (anyone can register)
create policy "Allow public insert on anmeldungen"
  on anmeldungen for insert
  with check (true);

-- Only authenticated admins can read
create policy "Allow admin read on anmeldungen"
  on anmeldungen for select
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()
        and user_roles.role = 'admin'
    )
  );
