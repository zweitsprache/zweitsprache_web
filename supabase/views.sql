drop view if exists durchfuehrungen_flat;

create index if not exists idx_durchfuehrungen_angebot_id on durchfuehrungen(angebot_id);
create index if not exists idx_termine_durchfuehrung_id on termine(durchfuehrung_id);
create index if not exists idx_termine_start_datetime on termine(start_datetime);

create or replace view angebote_listing as
select
  a.id as angebot_id,
  a.title,
  a.created_at,
  coalesce(stats.durchfuehrung_count, 0) as durchfuehrung_count,
  stats.next_start,
  stats.next_end,
  coalesce(df.items, '[]'::json) as durchfuehrungen,
  coalesce(df.durchfuehrungen_html, '') as durchfuehrungen_html
from angebote a
left join lateral (
  select
    count(distinct d.id)::int as durchfuehrung_count,
    min(t.start_datetime) filter (where t.start_datetime >= now()) as next_start,
    min(t.end_datetime) filter (where t.start_datetime >= now()) as next_end
  from durchfuehrungen d
  left join termine t on t.durchfuehrung_id = d.id
  where d.angebot_id = a.id
) stats on true
left join lateral (
  select
    json_agg(row_to_json(sub)) as items,
    string_agg(
      '<div class="df-item">'
        || '<span class="df-date">'
        || coalesce(to_char(sub.first_termin_start at time zone 'Europe/Zurich', 'DD.MM.YYYY, HH24:MI'), 'Kein Termin')
        || coalesce(' – ' || to_char(sub.first_termin_end at time zone 'Europe/Zurich', 'HH24:MI'), '')
        || '</span>'
        || '</div>',
      ''
    ) as durchfuehrungen_html
  from (
    select
      d.id as durchfuehrung_id,
      d.created_at,
      first_termin.start_datetime as first_termin_start,
      first_termin.end_datetime as first_termin_end
    from durchfuehrungen d
    left join lateral (
      select start_datetime, end_datetime
      from termine
      where durchfuehrung_id = d.id
      order by start_datetime asc
      limit 1
    ) first_termin on true
    where d.angebot_id = a.id
    order by first_termin.start_datetime asc nulls last
  ) sub
) df on true
order by stats.next_start asc nulls last;

create or replace view durchfuehrungen_listing as
select
  d.id as durchfuehrung_id,
  a.id as angebot_id,
  a.title as angebot_title,
  d.created_at,
  t.next_start,
  t.next_end,
  t.termin_count
from durchfuehrungen d
join angebote a on a.id = d.angebot_id
left join lateral (
  select
    min(start_datetime) filter (where start_datetime >= now()) as next_start,
    min(end_datetime) filter (where start_datetime >= now()) as next_end,
    count(*)::int as termin_count
  from termine
  where durchfuehrung_id = d.id
) t on true
order by t.next_start asc nulls last;

create or replace view termine_listing as
select
  t.id as termin_id,
  t.start_datetime,
  t.end_datetime,
  d.id as durchfuehrung_id,
  a.id as angebot_id,
  a.title as angebot_title
from termine t
join durchfuehrungen d on d.id = t.durchfuehrung_id
join angebote a on a.id = d.angebot_id
where t.start_datetime >= now()
order by t.start_datetime asc;
