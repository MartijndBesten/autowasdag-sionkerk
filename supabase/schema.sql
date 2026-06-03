-- ============================================================
-- Autowasdag Sionkerk Houten — Supabase schema
-- Idempotent: opnieuw uitvoeren is veilig.
-- Vereist PostgreSQL 14+ (Supabase gebruikt PG 15).
-- ============================================================

create extension if not exists "uuid-ossp";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 1. car_reservations ───────────────────────────────────────

create table if not exists public.car_reservations (
  id                 uuid         primary key default uuid_generate_v4(),
  created_at         timestamptz  not null default now(),
  updated_at         timestamptz  not null default now(),
  full_name          text         not null,
  phone              text,
  email              text         not null,
  license_plate      text,
  package_type       text         not null default 'compleet',
  package_duration   int          not null default 20,
  reservation_date   date         not null,
  reservation_time   time         not null,
  extra_donation     numeric(8,2) not null default 0,
  payment_status     text         not null default 'unpaid',
  payment_method     text,
  notes              text,
  admin_notes        text,
  status             text         not null default 'pending',
  confirmation_sent  boolean      not null default false,
  cancellation_token uuid                  default uuid_generate_v4(),
  slot_count         int          not null default 1,
  constraint chk_car_package_type
    check (package_type in ('buiten_wassen', 'binnen_zuigen', 'compleet')),
  constraint chk_car_payment_status
    check (payment_status in ('unpaid', 'paid_cash', 'paid_qr', 'donated_extra')),
  constraint chk_car_status
    check (status in ('pending', 'confirmed', 'completed', 'cancelled'))
);

create or replace trigger trg_car_reservations_updated_at
  before update on public.car_reservations
  for each row execute function public.set_updated_at();

-- ── 2. volunteer_signups ──────────────────────────────────────

create table if not exists public.volunteer_signups (
  id                   uuid        primary key default uuid_generate_v4(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  full_name            text        not null,
  phone                text,
  email                text        not null,
  age_category         text,
  availability         text        not null default 'full_day',
  selected_tasks       text[]      not null default '{}'::text[],
  contribution_details text,
  cost_preference      text,
  notes                text,
  admin_notes          text,
  status               text        not null default 'pending',
  constraint chk_volunteer_availability
    check (availability in ('full_day', 'morning', 'afternoon')),
  constraint chk_volunteer_status
    check (status in ('pending', 'confirmed', 'cancelled'))
);

create or replace trigger trg_volunteer_signups_updated_at
  before update on public.volunteer_signups
  for each row execute function public.set_updated_at();

-- ── 3. contribution_signups ───────────────────────────────────

create table if not exists public.contribution_signups (
  id                uuid        primary key default uuid_generate_v4(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  full_name         text        not null,
  phone             text,
  email             text        not null,
  contribution_type text        not null default 'overig',
  description       text,
  sponsorship_type  text,
  notes             text,
  admin_notes       text,
  status            text        not null default 'pending',
  constraint chk_contribution_type
    check (contribution_type in ('bakken', 'sponsoring', 'spullen', 'eten_verkopen', 'overig')),
  constraint chk_contribution_status
    check (status in ('pending', 'confirmed', 'cancelled'))
);

create or replace trigger trg_contribution_signups_updated_at
  before update on public.contribution_signups
  for each row execute function public.set_updated_at();

-- ── 4. admin_users ────────────────────────────────────────────

create table if not exists public.admin_users (
  id         uuid        primary key references auth.users (id) on delete cascade,
  email      text        not null,
  created_at timestamptz not null default now(),
  is_active  boolean     not null default true
);

-- ── 5. settings ───────────────────────────────────────────────

create table if not exists public.settings (
  id         uuid        primary key default uuid_generate_v4(),
  key        text        not null unique,
  value      jsonb       not null,
  updated_at timestamptz not null default now(),
  updated_by uuid        references auth.users (id)
);

create or replace trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- ── 6. email_logs ─────────────────────────────────────────────

create table if not exists public.email_logs (
  id             uuid        primary key default uuid_generate_v4(),
  created_at     timestamptz not null default now(),
  to_address     text        not null,
  subject        text        not null,
  template       text,
  reference_id   uuid,
  reference_type text,
  status         text        not null default 'sent',
  error          text,
  constraint chk_email_log_status
    check (status in ('sent', 'failed', 'skipped'))
);

-- ── 7. audit_logs ─────────────────────────────────────────────

create table if not exists public.audit_logs (
  id          uuid        primary key default uuid_generate_v4(),
  created_at  timestamptz not null default now(),
  user_id     uuid        references auth.users (id),
  action      text        not null,
  table_name  text,
  record_id   uuid,
  old_data    jsonb,
  new_data    jsonb,
  ip_address  text
);

-- ── is_admin() ────────────────────────────────────────────────

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and is_active = true
  );
$$;

-- ── Row Level Security ────────────────────────────────────────

alter table public.car_reservations     enable row level security;
alter table public.volunteer_signups    enable row level security;
alter table public.contribution_signups enable row level security;
alter table public.admin_users          enable row level security;
alter table public.settings             enable row level security;
alter table public.email_logs           enable row level security;
alter table public.audit_logs           enable row level security;

-- drop bestaande policies (alles samen, voor alle creates)

drop policy if exists "anon_insert_reservations"  on public.car_reservations;
drop policy if exists "admin_select_reservations" on public.car_reservations;
drop policy if exists "admin_update_reservations" on public.car_reservations;
drop policy if exists "admin_delete_reservations" on public.car_reservations;

drop policy if exists "anon_insert_volunteers"  on public.volunteer_signups;
drop policy if exists "admin_select_volunteers" on public.volunteer_signups;
drop policy if exists "admin_update_volunteers" on public.volunteer_signups;
drop policy if exists "admin_delete_volunteers" on public.volunteer_signups;

drop policy if exists "anon_insert_contributions"  on public.contribution_signups;
drop policy if exists "admin_select_contributions" on public.contribution_signups;
drop policy if exists "admin_update_contributions" on public.contribution_signups;
drop policy if exists "admin_delete_contributions" on public.contribution_signups;

drop policy if exists "admin_select_admin_users" on public.admin_users;

drop policy if exists "public_read_settings" on public.settings;
drop policy if exists "admin_write_settings"  on public.settings;

drop policy if exists "admin_all_email_logs" on public.email_logs;

drop policy if exists "admin_all_audit_logs" on public.audit_logs;

-- car_reservations

create policy "anon_insert_reservations"
  on public.car_reservations for insert
  to anon, authenticated
  with check (true);

create policy "admin_select_reservations"
  on public.car_reservations for select
  to authenticated
  using (public.is_admin());

create policy "admin_update_reservations"
  on public.car_reservations for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_delete_reservations"
  on public.car_reservations for delete
  to authenticated
  using (public.is_admin());

-- volunteer_signups

create policy "anon_insert_volunteers"
  on public.volunteer_signups for insert
  to anon, authenticated
  with check (true);

create policy "admin_select_volunteers"
  on public.volunteer_signups for select
  to authenticated
  using (public.is_admin());

create policy "admin_update_volunteers"
  on public.volunteer_signups for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_delete_volunteers"
  on public.volunteer_signups for delete
  to authenticated
  using (public.is_admin());

-- contribution_signups

create policy "anon_insert_contributions"
  on public.contribution_signups for insert
  to anon, authenticated
  with check (true);

create policy "admin_select_contributions"
  on public.contribution_signups for select
  to authenticated
  using (public.is_admin());

create policy "admin_update_contributions"
  on public.contribution_signups for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "admin_delete_contributions"
  on public.contribution_signups for delete
  to authenticated
  using (public.is_admin());

-- admin_users

create policy "admin_select_admin_users"
  on public.admin_users for select
  to authenticated
  using (public.is_admin());

-- settings

create policy "public_read_settings"
  on public.settings for select
  to anon, authenticated
  using (key in ('event', 'prices'));

create policy "admin_write_settings"
  on public.settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- email_logs

create policy "admin_all_email_logs"
  on public.email_logs for all
  to authenticated
  using (public.is_admin());

-- audit_logs

create policy "admin_all_audit_logs"
  on public.audit_logs for all
  to authenticated
  using (public.is_admin());

-- ── Timeslot-functies ─────────────────────────────────────────

create or replace function public.get_slot_occupancy(
  p_date date,
  p_time time
)
returns int
language sql
security definer
stable
as $$
  select coalesce(sum(slot_count), 0)::int
  from public.car_reservations
  where reservation_date = p_date
    and reservation_time = p_time
    and status <> 'cancelled';
$$;

create or replace function public.get_available_slots(p_date date)
returns table (slot_time time, available_bays int)
language sql
security definer
stable
as $$
  with all_slots as (
    select (time '09:00' + (gs.n * interval '20 minutes'))::time as slot_time
    from generate_series(0, 20) as gs (n)
  ),
  occupancy as (
    select reservation_time,
           sum(slot_count)::int as booked
    from public.car_reservations
    where reservation_date = p_date
      and status <> 'cancelled'
    group by reservation_time
  ),
  config as (
    select coalesce((value ->> 'wash_bays')::int, 2) as wash_bays
    from public.settings
    where key = 'event'
    limit 1
  )
  select
    s.slot_time,
    c.wash_bays - coalesce(o.booked, 0) as available_bays
  from all_slots s
  cross join config c
  left join occupancy o on o.reservation_time = s.slot_time
  where c.wash_bays - coalesce(o.booked, 0) > 0
  order by s.slot_time;
$$;

grant execute on function public.get_available_slots(date)      to anon, authenticated;
grant execute on function public.get_slot_occupancy(date, time) to anon, authenticated;

-- ── Indexes ───────────────────────────────────────────────────

create index if not exists idx_car_res_date_time
  on public.car_reservations (reservation_date, reservation_time);

create index if not exists idx_car_res_status
  on public.car_reservations (status);

create index if not exists idx_car_res_email
  on public.car_reservations (email);

create index if not exists idx_volunteer_status
  on public.volunteer_signups (status);

create index if not exists idx_contribution_type
  on public.contribution_signups (contribution_type);
