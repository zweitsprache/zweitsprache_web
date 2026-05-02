-- Add status to durchfuehrungen for workflow management
alter table durchfuehrungen
  add column status text not null default 'geplant'
    check (status in ('geplant', 'bestätigt', 'abgesagt'));

create index idx_durchfuehrungen_status on durchfuehrungen(status);
