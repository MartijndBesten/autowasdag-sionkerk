# Autowasdag Sionkerk — Technische Documentatie

Webapplicatie voor het beheer van de jaarlijkse autowasdag van de Sionkerk Houten. Bezoekers kunnen een tijdslot reserveren en vrijwilligers kunnen zich aanmelden. De organisatie beheert alles via een beveiligd admin-panel.

## Tech-stack

| Laag | Technologie |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Taal | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| E-mail | Resend |
| Hosting | Vercel |
| DNS | TransIP |

## Projectstructuur

```
src/
├── app/
│   ├── page.tsx                    # Homepagina (server component)
│   ├── layout.tsx                  # Root layout
│   ├── reserveren/page.tsx         # Reserveringspagina voor bezoekers
│   ├── help-mee/page.tsx           # Vrijwilligersaanmeldpagina
│   ├── admin/
│   │   ├── login/                  # Inlogpagina admin
│   │   └── (protected)/            # Beveiligd admin-panel
│   │       ├── page.tsx            # Dashboard
│   │       ├── reserveringen/      # Reserveringsbeheer + CSV-export
│   │       ├── vrijwilligers/      # Vrijwilligersbeheer + indeling
│   │       ├── bijdragen/          # Gebak/spullen/sponsoring-bijdragen
│   │       ├── instellingen/       # Evenementinstellingen en prijzen
│   │       └── acties/             # Volledig CMS voor sitecontent
│   └── api/
│       ├── reserveren/route.ts     # POST: nieuwe reservering
│       ├── aanmelden/route.ts      # POST: nieuwe vrijwilligersaanmelding
│       ├── bijdrage/route.ts       # POST: gebak/spullen/sponsoring
│       ├── timeslots/route.ts      # GET: beschikbare tijdsloten
│       └── vrijwilligers/
│           ├── [id]/route.ts       # PATCH/DELETE: vrijwilliger bewerken
│           ├── [id]/indelingsmail/ # POST: indelingsmail sturen
│           └── bulk-indelingsmail/ # POST: bulk indelingsmails
├── components/                     # Gedeelde UI-componenten
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser-side Supabase client
│   │   ├── server.ts               # Server-side Supabase client
│   │   ├── admin.ts                # Service-role client (server-only)
│   │   └── types.ts                # TypeScript database-types
│   ├── email.ts                    # Alle e-mailfuncties via Resend
│   ├── event.ts                    # Evenementdata uit database
│   ├── timeslots.ts                # Tijdslotlogica
│   ├── types.ts                    # Gedeelde types
│   └── db.ts                       # Database-hulpfuncties
└── middleware.ts                   # Auth-bewaking /admin/* routes
```

## Database-tabellen (Supabase)

| Tabel | Beschrijving |
|---|---|
| `car_reservations` | Autowas-reserveringen van bezoekers |
| `volunteer_signups` | Vrijwilligersaanmeldingen |
| `contribution_signups` | Bijdragen (gebak, spullen, sponsoring) |
| `settings` | Key-value store voor evenementinstellingen en sitecontent |
| `email_logs` | Log van verstuurde e-mails |
| `admin_users` | Geautoriseerde beheerders |
| `audit_logs` | Auditlog van mutaties |

## Authenticatie

- Supabase Auth (e-mail + wachtwoord)
- Middleware (`src/middleware.ts`) blokkeert alle `/admin/*` routes
- Extra controle: ingelogde gebruiker moet in `admin_users` tabel staan met `is_active = true`
- Admin-login via `/admin/login`

## E-mailstromen

| Trigger | Ontvanger | Beschrijving |
|---|---|---|
| Nieuwe reservering | Organisatie + bezoeker | Bevestiging reservering |
| Nieuwe vrijwilligersaanmelding | Organisatie + vrijwilliger | Ontvangstbevestiging |
| Indelingsmail | Vrijwilliger | Definitieve taak en dagdeel |
| Gebakbijdrage | Organisatie | Wat en hoeveel |
| Spullen-bijdrage | Organisatie | Welke spullen |
| Sponsorbijdrage | Organisatie | Type en omschrijving |

## Lokale ontwikkeling

```bash
npm install
cp .env.local.example .env.local
# Vul .env.local in met echte keys (zie ENVIRONMENT.example.md)
npm run dev
```

## Deployment

Push naar de `main`-branch triggert automatisch een Vercel-deployment.

```bash
npm run build   # lokaal testen
npm run lint    # linting
```

## Beveiligingsnotities

Zie `ENVIRONMENT.example.md` voor alle benodigde environment variables.
De `SUPABASE_SERVICE_ROLE_KEY` mag **nooit** client-side worden gebruikt of worden gecommit.
