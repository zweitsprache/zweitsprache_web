create table kulturregeln (
  id uuid primary key default gen_random_uuid(),
  handlungsfeld_code char(3) not null references handlungsfelder(code) on delete cascade,
  regel text not null,
  sort_order smallint not null default 0,
  created_at timestamptz default now()
);

alter table kulturregeln enable row level security;
create policy "Allow public read" on kulturregeln for select using (true);

-- Seed some initial rules
insert into kulturregeln (handlungsfeld_code, regel, sort_order) values
  ('WOH', 'In der Schweiz haben Wohnungen keine Nummern – man gibt das Stockwerk an (z.B. «3. Stock links» oder «2. OG rechts»).', 1),
  ('WOH', 'In Schweizer Wohnungen ist die Waschmaschine meist im Keller (Waschküche), nicht in der Wohnung. Jede Mietpartei hat einen festen Waschtag.', 2),
  ('WOH', 'Die Kündigungsfrist beträgt in der Schweiz in der Regel 3 Monate auf einen offiziellen Kündigungstermin (meist Ende März, Juni oder September).', 3),
  ('GES', 'In der Schweiz sagt man «Krankenkasse» (nicht «Krankenversicherung»). Jede Person muss obligatorisch eine Grundversicherung haben.', 1),
  ('GES', 'Im Notfall ruft man in der Schweiz 144 (Ambulanz), 117 (Polizei) oder 118 (Feuerwehr).', 2),
  ('MOB', 'In der Schweiz sagt man «Velo» (nicht «Fahrrad»), «Tram» (nicht «Strassenbahn»), «Billett» (nicht «Fahrkarte»), «Car» (nicht «Reisebus»), «Perron» (nicht «Bahnsteig»).', 1),
  ('MOB', 'Das öffentliche Verkehrsnetz in der Schweiz ist sehr gut ausgebaut. Viele Pendler:innen haben ein Halbtax- oder GA-Abonnement.', 2),
  ('EIN', 'Die Hauptsupermärkte in der Schweiz heissen Migros und Coop. Aldi und Lidl sind Discounter.', 1),
  ('EIN', 'In der Schweiz sagt man «Natel» (vor allem in der Deutschschweiz) oder «Handy» für «Mobiltelefon».', 2),
  ('BEH', 'In der Schweiz heisst die Aufenthaltsbewilligung offiziell «Ausweis» (B-Ausweis, C-Ausweis usw.). Man beantragt sie beim kantonalen Migrationsamt.', 1),
  ('FIN', 'Löhne und Preise in der Schweiz sind in Schweizer Franken (CHF). Der Wechselkurs zum Euro ist ungefähr 1:1.', 1),
  ('ARB', 'In der Schweiz bewirbt man sich mit einem Lebenslauf, einem Motivationsschreiben und Arbeitszeugnissen. Arbeitszeugnisse sind sehr wichtig.', 1),
  ('ARS', 'Das RAV (Regionales Arbeitsvermittlungszentrum) ist die offizielle Stelle für Arbeitslose in der Schweiz.', 1);
