-- ── Stap 1: actions-tabel ─────────────────────────────────────────────────────
-- Voer dit blok uit. Het is volledig idempotent (CREATE TABLE IF NOT EXISTS,
-- ALTER TABLE ... ADD COLUMN IF NOT EXISTS). Bestaande data wordt NIET gewijzigd.

create table if not exists public.actions (
  id                   uuid         primary key default uuid_generate_v4(),
  name                 text         not null,
  is_active            boolean      not null default false,
  is_archived          boolean      not null default false,
  created_at           timestamptz  not null default now(),
  event_date           date,
  start_time           time         not null default '09:00',
  end_time             time         not null default '16:00',
  wash_bays            int          not null default 2,
  max_slots_per_time   int          not null default 2,
  reservations_open    boolean      not null default true,
  volunteers_open      boolean      not null default true,
  price_buiten_wassen  numeric(6,2) not null default 7.50,
  price_compleet       numeric(6,2) not null default 12.50,
  notify_email         text,
  internal_notes       text
);

-- Nullable FK-kolommen op bestaande tabellen.
-- Bestaande rijen krijgen NULL — geen data verloren.
alter table public.car_reservations  add column if not exists action_id uuid references public.actions(id);
alter table public.volunteer_signups add column if not exists action_id uuid references public.actions(id);

alter table public.actions enable row level security;

drop policy if exists "public_read_active_action" on public.actions;
drop policy if exists "admin_all_actions"          on public.actions;

create policy "public_read_active_action"
  on public.actions for select
  to anon, authenticated
  using (is_active = true and is_archived = false);

create policy "admin_all_actions"
  on public.actions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_actions_active on public.actions (is_active);


-- ── Stap 2: seed eerste actie ─────────────────────────────────────────────────
-- Leest settings.event en settings.prices en maakt één rij in actions.
-- SCHRIJFT NIET naar settings, car_reservations of volunteer_signups.
-- De WHERE NOT EXISTS-guard zorgt dat dit nooit twee keer wordt uitgevoerd.

do $$
declare
  v_event  jsonb;
  v_prices jsonb;
  v_date   date;
  v_name   text;
begin
  -- Haal settings op
  select value into v_event  from public.settings where key = 'event'  limit 1;
  select value into v_prices from public.settings where key = 'prices' limit 1;

  -- Sla over als actions al bestaat
  if exists (select 1 from public.actions limit 1) then
    raise notice 'Seed overgeslagen: er bestaat al een actie.';
    return;
  end if;

  -- Bepaal datum veilig (null als leeg of ongeldig)
  begin
    v_date := nullif(trim(v_event->>'date'), '')::date;
  exception when others then
    v_date := null;
  end;

  -- Naam op basis van jaar, of generieke naam als datum ontbreekt
  if v_date is not null then
    v_name := 'Autowasdag Sionkerk ' || extract(year from v_date)::text;
  else
    v_name := 'Autowasdag Sionkerk';
  end if;

  insert into public.actions (
    name, is_active, event_date, start_time, end_time,
    wash_bays, max_slots_per_time,
    reservations_open, volunteers_open,
    price_buiten_wassen, price_compleet
  ) values (
    v_name,
    true,
    v_date,
    coalesce(nullif(trim(v_event->>'start_time'),'')::time, '09:00'::time),
    coalesce(nullif(trim(v_event->>'end_time'),  '')::time, '16:00'::time),
    coalesce(nullif(v_event->>'wash_bays',            '')::int,     2),
    coalesce(nullif(v_event->>'max_reservations_per_slot','')::int, 2),
    coalesce(nullif(v_event->>'reservations_open','')::boolean, true),
    coalesce(nullif(v_event->>'volunteers_open',  '')::boolean, true),
    coalesce(nullif(v_prices->>'buiten_wassen',   '')::numeric, 7.50),
    coalesce(nullif(v_prices->>'compleet',        '')::numeric, 12.50)
  );

  raise notice 'Eerste actie aangemaakt: %', v_name;
end;
$$;


-- ── Rollback (voer dit uit als je de migratie wil terugdraaien) ───────────────
--
-- STAP 1 ongedaan maken (verwijdert actions-tabel + action_id kolommen):
--   ALTER TABLE public.car_reservations  DROP COLUMN IF EXISTS action_id;
--   ALTER TABLE public.volunteer_signups DROP COLUMN IF EXISTS action_id;
--   DROP TABLE IF EXISTS public.actions;
--
-- STAP 2 ongedaan maken (seed verwijderen, geen FK-data aanwezig):
--   DELETE FROM public.actions;
--   (Alleen veilig als action_id nog nergens is ingevuld.)
