-- ── Standaard instellingen ────────────────────────────────────
-- Uitvoeren NA schema.sql

insert into public.settings (key, value) values
(
  'event',
  '{
    "date": "2025-08-22",
    "start_time": "09:00",
    "end_time": "16:00",
    "wash_bays": 2,
    "slot_duration_minutes": 20,
    "reservations_open": true,
    "volunteers_open": true,
    "max_reservations_per_slot": 2
  }'::jsonb
),
(
  'prices',
  '{
    "buiten_wassen": 7.50,
    "compleet": 12.50
  }'::jsonb
),
(
  'email',
  '{
    "notify_address": "m.denbesten@live.nl",
    "send_confirmation_to_visitor": true,
    "from_name": "Autowasdag Sionkerk Houten",
    "from_address": "onboarding@resend.dev"
  }'::jsonb
)
on conflict (key) do nothing;

-- ── Eerste admin account ──────────────────────────────────────
-- LET OP: pas uitvoeren nadat m.denbesten@live.nl zich heeft
-- aangemeld via Supabase Auth (magic link of wachtwoord).
-- Vervang de UUID door het echte auth.users.id van die gebruiker.
--
-- insert into public.admin_users (id, email)
-- values ('<UUID-van-auth-user>', 'm.denbesten@live.nl');
