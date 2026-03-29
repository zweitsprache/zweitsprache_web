-- ================================================================
-- Replace all permissive "Allow all" policies with role-aware ones.
-- Depends on: is_admin() function from 20260329100000_create_user_roles.sql
-- ================================================================

-- ----------------------------------------------------------------
-- Workshops group (public content, admin writes)
-- ----------------------------------------------------------------
drop policy "Allow all on workshops"       on workshops;
drop policy "Allow all on durchfuehrungen" on durchfuehrungen;
drop policy "Allow all on termine"         on termine;
drop policy "Allow all on lernziele"       on lernziele;
drop policy "Allow all on inhalte"         on inhalte;
drop policy "Allow all on voraussetzungen" on voraussetzungen;

create policy "Public read workshops"        on workshops        for select using (true);
create policy "Public read durchfuehrungen"  on durchfuehrungen  for select using (true);
create policy "Public read termine"          on termine          for select using (true);
create policy "Public read lernziele"        on lernziele        for select using (true);
create policy "Public read inhalte"          on inhalte          for select using (true);
create policy "Public read voraussetzungen"  on voraussetzungen  for select using (true);

create policy "Admin write workshops"        on workshops        for all using (is_admin()) with check (is_admin());
create policy "Admin write durchfuehrungen"  on durchfuehrungen  for all using (is_admin()) with check (is_admin());
create policy "Admin write termine"          on termine          for all using (is_admin()) with check (is_admin());
create policy "Admin write lernziele"        on lernziele        for all using (is_admin()) with check (is_admin());
create policy "Admin write inhalte"          on inhalte          for all using (is_admin()) with check (is_admin());
create policy "Admin write voraussetzungen"  on voraussetzungen  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------
-- Pages (public can read published pages, admin writes)
-- ----------------------------------------------------------------
drop policy "Allow all on pages" on pages;

create policy "Public read published pages" on pages
  for select using (published = true or is_admin());

create policy "Admin write pages" on pages
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------
-- Courses group (public read catalog, admin writes; lesson data
-- requires authentication — subscriber, student, or admin)
-- ----------------------------------------------------------------
drop policy "Allow all on courses"         on courses;
drop policy "Allow all on modules"         on modules;
drop policy "Allow all on module_lernziele" on module_lernziele;
drop policy "Allow all on lessons"         on lessons;

create policy "Public read courses"          on courses          for select using (true);
create policy "Public read modules"          on modules          for select using (true);
create policy "Public read module_lernziele" on module_lernziele for select using (true);

-- Lesson content is accessible only to authenticated users (enrolled students, subscribers, admins)
create policy "Authenticated read lessons" on lessons
  for select using (auth.uid() is not null);

create policy "Admin write courses"          on courses          for all using (is_admin()) with check (is_admin());
create policy "Admin write modules"          on modules          for all using (is_admin()) with check (is_admin());
create policy "Admin write module_lernziele" on module_lernziele for all using (is_admin()) with check (is_admin());
create policy "Admin write lessons"          on lessons          for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------
-- Textsorten (public read, admin writes)
-- ----------------------------------------------------------------
drop policy "Allow public read"     on textsorten;
drop policy "Allow all textsorten"  on textsorten;

create policy "Public read textsorten" on textsorten for select using (true);
create policy "Admin write textsorten" on textsorten for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------
-- Handlungsfelder — already has select-only policy; add admin write
-- ----------------------------------------------------------------
create policy "Admin write handlungsfelder" on handlungsfelder
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------
-- Kontextregeln — already has select-only policy; add admin write
-- ----------------------------------------------------------------
create policy "Admin write kontextregeln" on kontextregeln
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------
-- Prompt templates — already has select-only policy; add admin write
-- ----------------------------------------------------------------
create policy "Admin write prompt_templates" on prompt_templates
  for all using (is_admin()) with check (is_admin());

-- ----------------------------------------------------------------
-- Admin-only tables (sentences, niveauregeln, wortlisten)
-- ----------------------------------------------------------------
drop policy "Allow all on sentences"       on sentences;
drop policy "Allow all niveauregeln"       on niveauregeln;
drop policy "Allow all wortlisten"         on wortlisten;
drop policy "Allow all wortliste_relevanz" on wortliste_relevanz;

create policy "Admin only sentences"          on sentences          for all using (is_admin()) with check (is_admin());
create policy "Admin only niveauregeln"       on niveauregeln       for all using (is_admin()) with check (is_admin());
create policy "Admin only wortlisten"         on wortlisten         for all using (is_admin()) with check (is_admin());
create policy "Admin only wortliste_relevanz" on wortliste_relevanz for all using (is_admin()) with check (is_admin());
