-- Allow all operations on kontextregeln (admin only in practice, no auth yet)
create policy "Allow all kontextregeln" on kontextregeln for all using (true) with check (true);

-- Allow all operations on prompt_templates
create policy "Allow all prompt_templates" on prompt_templates for all using (true) with check (true);
