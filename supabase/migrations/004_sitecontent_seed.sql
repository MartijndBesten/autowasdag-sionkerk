-- ── Sitecontent-sleutel in public.instellingen ───────────────────────────────
-- Voert een INSERT uit met ON CONFLICT DO NOTHING.
-- Geen bestaande data wordt gewijzigd.
-- Veilig om meerdere keren uit te voeren.

insert into public.instellingen (key, value)
values (
  'sitecontent',
  jsonb_build_object(
    'name',                 'Autowasdag Sionkerk',
    'event_date',           (select value->>'date'        from public.instellingen where key = 'event'  limit 1),
    'start_time',           coalesce((select value->>'start_time' from public.instellingen where key = 'event' limit 1), '09:00'),
    'end_time',             coalesce((select value->>'end_time'   from public.instellingen where key = 'event' limit 1), '16:00'),
    'wash_bays',            coalesce((select (value->>'wash_bays')::int from public.instellingen where key = 'event' limit 1), 2),
    'max_slots_per_time',   coalesce((select (value->>'max_reservations_per_slot')::int from public.instellingen where key = 'event' limit 1), 2),
    'reservations_open',    coalesce((select (value->>'reservations_open')::boolean from public.instellingen where key = 'event' limit 1), true),
    'volunteers_open',      coalesce((select (value->>'volunteers_open')::boolean  from public.instellingen where key = 'event' limit 1), true),
    'price_buiten_wassen',  coalesce((select (value->>'buiten_wassen')::numeric from public.instellingen where key = 'prices' limit 1), 7.50),
    'price_compleet',       coalesce((select (value->>'compleet')::numeric       from public.instellingen where key = 'prices' limit 1), 12.50),
    'location_address',     'Eikenhout 221',
    'location_city',        'Houten',
    'location_postal',      '3991 PN',
    'location_maps_url',    null,
    'hero_title',           'Autowasdag',
    'hero_subtitle',        'Sionkerk Houten',
    'hero_description',     'Laat uw auto wassen door de jongeren van de Sionkerk, geniet van koffie en gezelligheid en steun het opknappen van de zalen.',
    'hero_image_path',      '/images/hero.jpg',
    'action_tagline',       'Sionkerk Houten · Jeugdclubs actie',
    'coffee_text',          'Laat je reservering zien en ontvang een gratis bakje koffie. Gebak en andere lekkernijen zijn verkrijgbaar tijdens de actiedag.',
    'timeline',             '[]'::jsonb,
    'faq',                  '[]'::jsonb,
    'practical_info',       '[]'::jsonb,
    'package_descriptions', '{}'::jsonb,
    'footer_email',         'autowasdag@sionkerkhouten.nl',
    'footer_website',       'https://www.sionkerkhouten.nl',
    'footer_tagline',       null,
    'notify_email',         null,
    'internal_notes',       null
  )
)
on conflict (key) do nothing;

-- Rollback:
-- delete from public.instellingen where key = 'sitecontent';
