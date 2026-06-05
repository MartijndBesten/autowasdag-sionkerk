# Environment Variables — Autowasdag Sionkerk

Kopieer `.env.local.example` naar `.env.local` en vul de waarden in.
**Commit `.env.local` nooit naar Git.**

---

## Supabase

### `NEXT_PUBLIC_SUPABASE_URL`

De URL van je Supabase-project.

- Waar te vinden: Supabase Dashboard → Settings → API → Project URL
- Formaat: `https://JOUW-PROJECT-ID.supabase.co`
- Zichtbaar voor: iedereen (publiek, client-side veilig)

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

De anonieme publieke API-sleutel voor client-side database-toegang.

- Waar te vinden: Supabase Dashboard → Settings → API → anon public
- Formaat: JWT-token (begint met `eyJ...`)
- Zichtbaar voor: iedereen (publiek, client-side veilig — Row Level Security beschermt de data)

### `SUPABASE_SERVICE_ROLE_KEY`

De service-role sleutel voor server-side beheerbewerkingen. Bypassed Row Level Security.

- Waar te vinden: Supabase Dashboard → Settings → API → service_role
- Formaat: JWT-token (begint met `eyJ...`)
- **ALLEEN server-side gebruiken. Nooit in client-code of Git.**
- Gebruik: API-routes (`/api/*`), middleware, server-side rendering

---

## E-mail (Resend)

### `RESEND_API_KEY`

API-sleutel voor het versturen van e-mails via resend.com.

- Waar te vinden: resend.com → API Keys → Create API Key
- Formaat: `re_XXXXXXXXXXXXXXXX`
- **Server-side only. Nooit in client-code.**
- Zonder deze key worden e-mails stil genegeerd (geen fout voor bezoekers)

### `NOTIFY_EMAIL`

Het e-mailadres van de organisatie dat alle notificaties ontvangt: nieuwe reserveringen, vrijwilligersaanmeldingen, bijdragen en sponsorberichten.

- Formaat: `jouw@emailadres.nl`
- **Verplicht voor productie** — zonder dit adres worden organisatienotificaties niet bezorgd (wel gelogd in de console)
- **Server-side only.** Niet zichtbaar voor bezoekers.
- Stel dit in via: Vercel → Project → Settings → Environment Variables → `NOTIFY_EMAIL`

> **Let op:** dit adres stond eerder hardcoded in de broncode. Na deze wijziging moet je het instellen in Vercel, anders komen er geen notificaties aan.

### `EMAIL_FROM` *(optioneel)*

Het afzenderadres dat in e-mails verschijnt.

- Formaat: `Naam <adres@domein.nl>` of gewoon `adres@domein.nl`
- Standaard: `Autowasdag <onboarding@resend.dev>` (Resend testadres)
- Productie: gebruik een geverifieerd domein in Resend, bijv. `Autowasdag <noreply@autowasdag.sionkerk.nl>`
- Domeinverificatie: resend.com → Domains → Add Domain

---

## Site

### `NEXT_PUBLIC_BASE_URL`

De volledige URL van de live website.

- Formaat: `https://autowasdag.sionkerk.nl`
- Gebruik: absolute links in e-mails, sitemap
- Lokaal: `http://localhost:3000`

---

## Voorbeeld `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Resend
RESEND_API_KEY=re_JOUW_SLEUTEL
NOTIFY_EMAIL=jouw@emailadres.nl

# Optioneel
EMAIL_FROM=Autowasdag <noreply@autowasdag.sionkerk.nl>

# Site
NEXT_PUBLIC_BASE_URL=https://autowasdag.sionkerk.nl
```

---

## Vercel

Op Vercel stel je deze variabelen in via:
**Dashboard → Project → Settings → Environment Variables**

Stel ze in voor de **Production**-omgeving (en optioneel Preview en Development).
