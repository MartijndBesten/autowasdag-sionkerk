-- ── Contentbeheer-kolommen op public.actions ─────────────────────────────────
-- Idempotent: veilig om meerdere keren uit te voeren.
-- Geen bestaande data wordt gewijzigd; alle kolommen hebben defaults.

alter table public.actions
  add column if not exists location_address     text    default 'Eikenhout 221',
  add column if not exists location_city        text    default 'Houten',
  add column if not exists location_postal      text    default '3991 PN',
  add column if not exists location_maps_url    text,
  add column if not exists hero_title           text    default 'Autowasdag',
  add column if not exists hero_subtitle        text    default 'Sionkerk Houten',
  add column if not exists hero_description     text    default 'Laat uw auto wassen door de jongeren van de Sionkerk, geniet van koffie en gezelligheid en steun het opknappen van de zalen.',
  add column if not exists hero_image_path      text    default '/images/hero.png',
  add column if not exists action_tagline       text    default 'Sionkerk Houten · Jeugdclubs actie',
  add column if not exists coffee_text          text    default 'Laat je reservering zien en ontvang een gratis bakje koffie. Gebak en andere lekkernijen zijn verkrijgbaar tijdens de actiedag.',
  add column if not exists timeline             jsonb   default '[]'::jsonb,
  add column if not exists faq                  jsonb   default '[]'::jsonb,
  add column if not exists practical_info       jsonb   default '[]'::jsonb,
  add column if not exists package_descriptions jsonb   default '{}'::jsonb,
  add column if not exists footer_email         text    default 'autowasdag@sionkerkhouten.nl',
  add column if not exists footer_website       text    default 'https://www.sionkerkhouten.nl',
  add column if not exists footer_tagline       text;

-- Rollback (alleen als geen data is ingevuld):
-- alter table public.actions
--   drop column if exists location_address, drop column if exists location_city,
--   drop column if exists location_postal,  drop column if exists location_maps_url,
--   drop column if exists hero_title,       drop column if exists hero_subtitle,
--   drop column if exists hero_description, drop column if exists hero_image_path,
--   drop column if exists action_tagline,   drop column if exists coffee_text,
--   drop column if exists timeline,         drop column if exists faq,
--   drop column if exists practical_info,   drop column if exists package_descriptions,
--   drop column if exists footer_email,     drop column if exists footer_website,
--   drop column if exists footer_tagline;
