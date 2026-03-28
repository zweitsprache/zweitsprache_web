create table textsorten (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  gruppe text not null,
  anweisung text not null default '',
  is_personal boolean not null default false,
  is_dialog boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz default now()
);

alter table textsorten enable row level security;
create policy "Allow public read" on textsorten for select using (true);
create policy "Allow all textsorten" on textsorten for all using (true) with check (true);

-- Seed with current text types, grouped
insert into textsorten (key, label, gruppe, anweisung, is_personal, is_dialog, sort_order) values
  ('email',        'E-Mail',               'Korrespondenz',   'E-Mail: mit Anrede, Text und Gruss; informell bis neutral.', true, false, 1),
  ('messenger',    'Messenger',            'Korrespondenz',   'Messenger-Nachricht: kurz, informell, direkte Anrede (du); ggf. Emojis ab A2; Umgangssprache.', true, false, 2),
  ('brief',        'Brief',                'Korrespondenz',   'Brief: mit Anrede, Text und Gruss; etwas formeller als eine E-Mail.', true, false, 3),
  ('erzaehlung',   'Erzählung',            'Erzählende Texte','Erzählung/Blog: einfache Chronologie; klare Zeitmarker gemäss Niveau; Ich- oder Er/Sie-Form.', true, false, 10),
  ('tagebuch',     'Tagebucheintrag',      'Erzählende Texte','Tagebucheintrag: persönlich, in der Ich-Form, mit Datum; einfache Chronologie.', true, false, 11),
  ('portraet',     'Porträt',              'Erzählende Texte','Porträt: Person, Kontext, charakteristische Details; indirekte Rede erst ab A2.2.', false, false, 12),
  ('dialog',       'Dialog / Interview',   'Mündliche Texte', 'Interview/Dialog: Sprecherwechsel mit «Person A», «Person B» oder Namen; stufengerechte Fragen/Antworten. Für Dialoge gilt die Längensteuerung nicht – die Länge richtet sich nach dem natürlichen Dialogverlauf und der Pragmatik.', true, true, 20),
  ('beschreibung', 'Sachtext / Beschreibung','Sachtexte',     'Sachtext/Beschreibung: klarer Lead; Absätze mit Themensätzen; neutrale Tonalität; Beispiele/Daten einfach; keine direkte Leseransprache.', false, false, 30),
  ('anleitung',    'Anleitung',            'Sachtexte',       'Anleitung: Schritt-für-Schritt, mit Imperativ oder man-Sätzen.', false, false, 31),
  ('nachricht',    'Nachricht / Meldung',  'Sachtexte',       'Nachricht/Meldung: Beantwortung von W-Fragen (Wer/Was/Wo/Wann/Wie/Warum) in den ersten Sätzen, sachlich. Keine direkte Leseransprache.', true, false, 32),
  ('bericht',      'Bericht',              'Sachtexte',       'Bericht: sachlicher Lead; Absätze mit Themensätzen; neutrale Tonalität; in der Vergangenheit. Keine direkte Leseransprache.', false, false, 33),
  ('inserat',      'Inserat / Anzeige',    'Sachtexte',       'Inserat/Anzeige: kurz, prägnant, mit Stichpunkten.', false, false, 34),
  ('kommentar',    'Kommentar',            'Meinungstexte',   'Kommentar (empfohlen ab B1.1): These – Begründung – Fazit; vorsichtige Bewertung, einfache Argumentationsmarker.', false, false, 40);
