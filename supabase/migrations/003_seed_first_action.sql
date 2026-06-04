-- ── Voer dit EENMALIG uit na 003_actions.sql ─────────────────────────────────
-- Maakt de eerste actie aan op basis van de bestaande settings-rijen.
-- Bestaande reserveringen en vrijwilligers blijven behouden (action_id = null).

insert into public.actions (
  name,
  is_active,
  event_date,
  start_time,
  end_time,
  wash_bays,
  max_slots_per_time,
  reservations_open,
  volunteers_open,
  price_buiten_wassen,
  price_compleet
)
select
  'Autowasdag Sionkerk ' || extract(year from (ev.value->>'date')::date)::text,
  true,
  (ev.value->>'date')::date,
  (ev.value->>'start_time')::time,
  (ev.value->>'end_time')::time,
  coalesce((ev.value->>'wash_bays')::int, 2),
  coalesce((ev.value->>'max_reservations_per_slot')::int, 2),
  coalesce((ev.value->>'reservations_open')::boolean, true),
  coalesce((ev.value->>'volunteers_open')::boolean, true),
  coalesce((pr.value->>'buiten_wassen')::numeric, 7.50),
  coalesce((pr.value->>'compleet')::numeric, 12.50)
from
  (select value from public.settings where key = 'event' limit 1) as ev,
  (select value from public.settings where key = 'prices' limit 1) as pr
where not exists (select 1 from public.actions limit 1);
