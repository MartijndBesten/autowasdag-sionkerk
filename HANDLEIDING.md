# Beheerhandleiding — Autowasdag Sionkerk

Praktische uitleg voor Martijn over het beheren van de website en het organiseren van een nieuwe autowasdag.

---

## Inloggen op het admin-panel

Ga naar **https://autowasdag.sionkerk.nl/admin/login** en log in met je Supabase-account (e-mail + wachtwoord).

---

## Nieuwe autowasdag instellen

### 1. Evenementdatum en -instellingen

Ga naar **Admin → Instellingen**:

- **Datum**: stel de datum van de nieuwe wasdag in (formaat `JJJJ-MM-DD`)
- **Starttijd / Eindtijd**: standaard 09:00–16:00
- **Wasplaatsen**: aantal auto's tegelijk dat gewassen kan worden (standaard 2)
- **Reserveringen open**: vinkje aan/uit om reserveren te openen of sluiten
- **Vrijwilligers open**: vinkje aan/uit om aanmelden als vrijwilliger te openen of sluiten
- **Prijzen**: stel de actuele prijzen in voor "Buiten wassen" en "Compleet"
- Klik **Wijzigingen opslaan**

### 2. Sitecontent bijwerken

Ga naar **Admin → Acties**. Hier kun je alle teksten en content op de website aanpassen:

- **Basisinfo**: evenementnaam, datum, tijden, locatie, prijzen, notificatie-e-mail
- **Homepage**: hero-titel, ondertitel, beschrijving, tagline, koffietekst
- **Tijdlijn**: stappen die de bezoeker ziet bij "Hoe werkt het"
- **Praktische info**: locatie, parkeren, betaalmethoden enz.
- **FAQ**: veelgestelde vragen
- **Pakketten**: beschrijving van de wasopties
- **Footer & locatie**: contactgegevens onderaan de pagina

---

## Reserveringen beheren

Ga naar **Admin → Reserveringen**.

- Overzicht van alle reserveringen met naam, pakket, tijdslot, betaalstatus
- Klik op een reservering om de status of betaling aan te passen
- **CSV exporteren**: knop rechtsboven om alle reserveringen te downloaden als spreadsheet

**Statusopties:**
- In behandeling → Bevestigd → Voltooid / Geannuleerd

**Betaalopties:**
- Nog niet betaald → Contant betaald / QR betaald / Extra donatie

---

## Vrijwilligers beheren

Ga naar **Admin → Vrijwilligers**.

### Tabbladen

| Tabblad | Inhoud |
|---|---|
| Aanmeldingen | Alle vrijwilligers met filters en acties |
| Planning per taak | Overzicht gegroepeerd per definitieve taak |
| Baklijst | Alleen de bakkers met wat ze meenemen |
| Spullen & sponsoring | Wie brengt welke spullen of sponsort |

### Vrijwilliger indelen

1. Klik op **Indelen** achter een vrijwilliger
2. Kies de **definitieve taak(en)** (meerdere mogelijk)
3. Kies het **dagdeel** (ochtend, middag, hele dag of specifieke tijden)
4. Voeg eventueel een **interne notitie** toe (niet zichtbaar voor vrijwilliger)
5. Stel de **planningsstatus** in (Ingepland, Reserve, Niet nodig enz.)
6. Klik **Opslaan**

### Indelingsmails

Indelingsmails worden **niet automatisch verstuurd** via de beheerpagina. Na het indelen mail je vrijwilligers handmatig vanuit je eigen mailprogramma. Zo heb je volledige controle over de inhoud en timing per persoon.

### Vrijwilliger verwijderen

Klik op **Verwijderen** en bevestig. De aanmelding wordt als verwijderd gemarkeerd en verdwijnt uit tellingen.

---

## Spullen-opties aanpassen

Ga naar **Admin → Instellingen → Spullen meenemen — keuzeopties**.

- Bestaande labels bewerken: klik in het tekstveld en pas de tekst aan
- Nieuwe optie toevoegen: typ een label en klik **+ Toevoegen** (of druk Enter)
- Optie verwijderen: klik de × knop
- Klik **Wijzigingen opslaan** — de nieuwe opties zijn direct zichtbaar in het aanmeldformulier

---

## Bijdragen beheren

Ga naar **Admin → Bijdragen**.

Overzicht van alle gebak-, spullen- en sponsoringbijdragen van mensen die via de "Help mee"-pagina iets hebben aangeboden (buiten de vrijwilligersaanmelding om).

---

## E-mail instellen (Resend)

E-mails worden verstuurd via [resend.com](https://resend.com).

1. Log in op resend.com met je account
2. Ga naar **API Keys** en kopieer je sleutel
3. Stel in Vercel de environment variable `RESEND_API_KEY` in (zie BACKUP-PLAN.md)
4. Stel ook `EMAIL_FROM` in als je een eigen afzenderadres wilt (bijv. `Autowasdag <noreply@autowasdag.sionkerk.nl>`)

> Zonder `RESEND_API_KEY` worden e-mails stil genegeerd — geen foutmelding voor bezoekers.

---

## Reserveringen openen / sluiten

Je kunt snel reserveren aan- of uitzetten via **Admin → Instellingen**:
- Vinkje **Reserveringen open** uit = geen nieuwe reserveringen mogelijk
- Vinkje **Vrijwilligers open** uit = geen nieuwe aanmeldingen mogelijk

---

## Tijdsloten werken automatisch

Het systeem berekent beschikbare tijdsloten op basis van:
- Evenementdatum (ingesteld in Instellingen)
- Starttijd en eindtijd
- Aantal wasplaatsen
- Pakkettype (compleet-pakket bezet 2 × 20 minuten)

Je hoeft niets handmatig in te stellen.

---

## Toegang beheren

Nieuwe beheerders toevoegen:
1. Maak een account aan via Supabase Auth (of laat de persoon via `/admin/login` aanmelden met Magic Link)
2. Voeg het gebruikers-ID toe aan de `admin_users` tabel in de Supabase-database met `is_active = true`

---

## Problemen oplossen

| Probleem | Oplossing |
|---|---|
| E-mails komen niet aan | Controleer `RESEND_API_KEY` in Vercel environment variables |
| Admin-login werkt niet | Controleer of het account in `admin_users` staat met `is_active = true` |
| Website toont oude content | Herlaad de pagina of wacht op Vercel-redeployment na een wijziging |
| Tijdsloten kloppen niet | Controleer evenementdatum en wasplaatsen in Instellingen |
| Reserveringen zijn gesloten | Zet vinkje "Reserveringen open" aan in Instellingen |
