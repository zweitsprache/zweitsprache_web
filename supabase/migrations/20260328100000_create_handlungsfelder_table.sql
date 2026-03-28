create table handlungsfelder (
  code char(3) primary key,
  name text not null unique,
  sort_order smallint not null unique,
  created_at timestamptz default now()
);

alter table handlungsfelder enable row level security;
create policy "Allow public read" on handlungsfelder for select using (true);

insert into handlungsfelder (code, name, sort_order) values
  ('DEU', 'Deutschkurs', 1),
  ('GES', 'Gesundheit', 2),
  ('SIC', 'Sicherheit und Notfälle', 3),
  ('FAM', 'Familie und Partnerschaft', 4),
  ('KIN', 'Kinder und Schule', 5),
  ('SOZ', 'Soziales Netz', 6),
  ('BER', 'Beratung und Unterstützung', 7),
  ('EIN', 'Einkaufen', 8),
  ('ERN', 'Ernährung', 9),
  ('WOH', 'Wohnen', 10),
  ('MOB', 'Mobilität', 11),
  ('FIN', 'Finanzen und Versicherungen', 12),
  ('BEH', 'Behörden', 13),
  ('FRE', 'Freizeit und Hobbys', 14),
  ('KUL', 'Kultur und Identität', 15),
  ('ARB', 'Arbeit', 16),
  ('ARS', 'Arbeitssuche', 17),
  ('UMW', 'Umwelt und Klima', 18),
  ('TEC', 'Technologie', 19),
  ('WEI', 'Weiterbildung', 20);
