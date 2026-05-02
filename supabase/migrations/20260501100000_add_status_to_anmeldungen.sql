-- Add status field to anmeldungen for admin workflow management
alter table anmeldungen
  add column status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'waitlist'));

create index idx_anmeldungen_status on anmeldungen(status);
