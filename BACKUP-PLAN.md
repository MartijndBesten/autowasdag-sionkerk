# Backup-plan — Autowasdag Sionkerk

Stappen om alle onderdelen van het systeem veilig te stellen.

---

## 1. GitHub — broncode

De broncode staat op GitHub. Zorg dat je regelmatig pusht.

### Controleren of alles gepusht is

```bash
git status
git log --oneline origin/main..HEAD
```

Als er commits zijn die niet op GitHub staan:

```bash
git push origin main
```

### Repository-URL

Ga naar [github.com](https://github.com) → zoek op `autowasdag-sionkerk` in jouw repositories.

### Volledige lokale backup (optioneel)

```bash
git clone https://github.com/JOUW-GEBRUIKER/autowasdag-sionkerk.git autowasdag-backup-DATUM
```

---

## 2. Supabase — database

### Optie A: Dashboard-export (eenvoudigst)

1. Ga naar [supabase.com](https://supabase.com) → log in → open het project
2. Ga naar **Table Editor**
3. Per tabel: klik op de tabel → klik **Export** (rechtsboven) → kies CSV of JSON

Tabellen om te exporteren:
- `car_reservations`
- `volunteer_signups`
- `contribution_signups`
- `settings`
- `email_logs`

### Optie B: SQL-dump via Supabase CLI

```bash
# Installeer Supabase CLI indien nodig
npm install -g supabase

# Login
supabase login

# Dump (vervang PROJECT_REF door je project-ID)
supabase db dump --project-ref JOUW_PROJECT_REF > backup-DATUM.sql
```

Je project-ID vind je in het Supabase-dashboard → Settings → General → Reference ID.

### Database-schema bewaren

Het schema is impliciet gedocumenteerd in `src/lib/supabase/types.ts`. Exporteer het schema ook via:

```
Supabase Dashboard → Database → Schemas → Download
```

---

## 3. Vercel — environment variables

Environment variables bevatten je geheime sleutels en kunnen **niet** worden teruggezet als je ze kwijtraakt.

### Exporteren

1. Ga naar [vercel.com](https://vercel.com) → open het project
2. Ga naar **Settings → Environment Variables**
3. Kopieer alle waarden handmatig naar een beveiligd wachtwoordmanager-bestand (bijv. Bitwarden of 1Password)

### Te bewaren variables

| Variable | Waar te vinden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NOTIFY_EMAIL` | Jouw eigen e-mailadres (ontvanger van notificaties) |
| `EMAIL_FROM` | Zelfgekozen afzenderadres |
| `NEXT_PUBLIC_BASE_URL` | URL van de live site |

> **Belangrijk**: bewaar deze waarden nooit in de Git-repository. Gebruik een wachtwoordmanager.

### Terugzetten na verlies

Als je een key kwijtraakt:
- `SUPABASE_SERVICE_ROLE_KEY` en `NEXT_PUBLIC_SUPABASE_ANON_KEY`: genereer nieuwe keys via Supabase → Settings → API → **Rotate keys**. Update daarna direct in Vercel.
- `RESEND_API_KEY`: maak een nieuwe key aan via resend.com → API Keys → Create API Key.

---

## 4. TransIP — DNS

De DNS voor `sionkerk.nl` en `autowasdag.sionkerk.nl` wordt beheerd via TransIP.

### DNS-instellingen exporteren

1. Log in op [transip.nl](https://www.transip.nl)
2. Ga naar **Domeinen** → klik op het domein
3. Ga naar **DNS-instellingen**
4. Maak een screenshot of kopieer de records handmatig

### Huidige DNS-records voor Vercel (ter referentie)

Vercel vereist doorgaans een van de volgende records:

```
Type: A       Naam: @           Waarde: 76.76.21.21
Type: CNAME   Naam: autowasdag  Waarde: cname.vercel-dns.com
```

Controleer de exacte waarden in **Vercel → Settings → Domains** van het project.

### Terugzetten na verlies

Als de DNS-instellingen verloren gaan:
1. Log in op TransIP
2. Stel de bovenstaande records opnieuw in
3. DNS-propagatie duurt 0–24 uur

---

## 5. Supabase — Auth-gebruikers

Admin-gebruikers (Supabase Auth) kun je exporteren via:

```
Supabase Dashboard → Authentication → Users → Export
```

Bewaar minimaal het e-mailadres en noteer het gebruikers-ID, want dat staat ook in de `admin_users`-tabel.

---

## Backup-schema (aanbeveling)

| Frequentie | Actie |
|---|---|
| Na elke wijziging | `git push origin main` |
| Maandelijks | Exporteer database-tabellen als CSV |
| Voor elke wasdag | Exporteer volledige database-dump |
| Jaarlijks | Controleer environment variables in Vercel en bewaar ze opnieuw |
