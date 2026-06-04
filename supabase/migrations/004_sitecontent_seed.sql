-- ── Sitecontent-sleutel in public.instellingen ───────────────────────────────
-- Gebruikt INSERT ... ON CONFLICT DO UPDATE zodat dit ook werkt als de sleutel
-- al bestaat. Bestaande andere sleutels in instellingen worden NIET gewijzigd.

insert into public.instellingen (key, value)
values (
  'sitecontent',
  jsonb_build_object(
    'name',                 'Autowasdag Sionkerk 2026',
    'event_date',           '2026-08-22',
    'start_time',           '09:00',
    'end_time',             '16:00',
    'wash_bays',            2,
    'max_slots_per_time',   2,
    'reservations_open',    true,
    'volunteers_open',      true,
    'price_buiten_wassen',  7.50,
    'price_compleet',       12.50,
    'location_address',     'Eikenhout 221',
    'location_city',        'Houten',
    'location_postal',      '3991 PN',
    'location_maps_url',    null,
    'hero_title',           'Autowasdag',
    'hero_subtitle',        'Sionkerk Houten',
    'hero_description',     'Laat je auto wassen door de jongeren van de Sionkerk, geniet van koffie en gezelligheid en steun het opknappen van de zalen.',
    'hero_image_path',      '/images/hero.jpg',
    'action_tagline',       'Sionkerk Houten · Jeugdclubs actie',
    'coffee_text',          'Laat je reservering zien en ontvang een gratis bakje koffie. Gebak en andere lekkernijen zijn verkrijgbaar tijdens de actiedag.',
    'timeline',             '[]'::jsonb,
    'faq',                  '[]'::jsonb,
    'practical_info',       '[]'::jsonb,
    'package_descriptions', jsonb_build_object(
      'buiten_wassen', jsonb_build_object(
        'name',        'Buiten wassen',
        'tagline',     'Alleen buitenkant',
        'description', 'Een grondige handwas van de buitenkant van je auto. Gespoten, gezeemd en afgedroogd.',
        'includes',    '["Exterieur handwas","Spoelen & afdrogen","Ramen wassen"]'::jsonb
      ),
      'compleet', jsonb_build_object(
        'name',        'Compleet',
        'tagline',     'Buiten + binnen',
        'description', 'Buitenkant wassen, interieur stofzuigen en een eenvoudige interieurreiniging. Van buiten én van binnen fris.',
        'includes',    '["Buitenwas (zoals Buiten wassen)","Stofzuigen interieur","Eenvoudige interieurreiniging"]'::jsonb
      )
    ),
    'footer_email',         'autowasdag@sionkerkhouten.nl',
    'footer_website',       'https://www.sionkerkhouten.nl',
    'footer_tagline',       null,
    'notify_email',         null,
    'internal_notes',       null
  )
)
on conflict (key) do update
  set value = excluded.value;

-- Rollback:
-- delete from public.instellingen where key = 'sitecontent';
