# Changelog — Autowasdag Sionkerk

Overzicht van alles wat gebouwd en aangepast is.

---

## Meest recente wijzigingen (2025–2026)

### Vrijwilligersbeheer — spullen en indeling

- **Spullen-opties bewerkbaar gemaakt in admin**: beheerder kan in Instellingen de keuzeopties voor "spullen meenemen" toevoegen, hernoemen en verwijderen — wijzigingen zijn direct zichtbaar in het aanmeldformulier
- **Spullenchecklist in vrijwilligersformulier**: vrijwilligers zien vinkjes per spullenoptie (emmer, shampoo, stofzuiger, haspel enz.) in plaats van een vrij tekstveld
- **Verwijderde vrijwilligers worden uitgesloten van tellingen**: de admin-teller toont alleen actieve aanmeldingen
- **Indelingsmails per taakgroep**: in het tabblad "Planning per taak" kun je met één knop alle niet-verzonden indelingsmails per groep versturen
- **Vrijwilligers verwijderen**: beheerder kan aanmeldingen soft-deleten via een bevestigingsdialoog
- **Vrijwilligers-CTA verwijderd van homepage**: de koppeling naar aanmelden als vrijwilliger is van de homepagina gehaald

### Content en teksten

- **Evenementdatum bijgewerkt** naar 11 juli 2025, later naar 5 september 2025
- **Herototekst bijgewerkt**: nieuwe intro voor de campagneperiode
- **Kerkdienst-tijdstip gecorrigeerd** naar 16:15 in de praktische info
- **Toon gecorrigeerd**: consistente je/jij-aanschrijfvorm, fruitschaal en bloemen toegevoegd, plaatshouders verwijderd
- **Pagina schoongemaakt**: dubbele tijdlijn en tegenstrijdige koffietekst verwijderd

### CMS — Acties/Instellingen

- **Volledig content-beheersysteem** gebouwd: alle teksten, tijdlijn, FAQ, praktische info, pakketten en footer zijn beheerbaar via Admin → Acties
- **Multi-actie systeem**: architectuur voor meerdere opeenvolgende wasdag-edities
- **Sitecontent seed**: database-migratie met initiële content voor alle componenten
- **Hero-afbeelding**: sleuvel voor beheerbaar hero-beeld, initieel hero.jpg
- **Fotogalerij op evenementdag**: 5 evenementfoto's in galerij-sectie

### Reserveringen

- **Twee reserveringen per tijdslot**: maximaal 2 auto's tegelijk (=aantal wasplaatsen)
- **Verouderde pakketten verwijderd**: alleen "Buiten wassen" (€7,50) en "Compleet" (€12,50)
- **CSV-export bijgewerkt** met correcte labels en prijzen
- **Bevestigingsmail naar bezoeker** toegevoegd bij reservering

### Vrijwilliger-aanmelding

- **Planningsworkflow**: beheerder kan definitieve taak, dagdeel en status per vrijwilliger instellen
- **Bijdragedetails vereist**: validatie voor bakken, spullen en sponsoring (client + server)
- **Kostenvoorkeur voor bakkers**: vrijwilligers die bakken kunnen aangeven of ze vergoeding wensen
- **Indelingsmail**: gepersonaliseerde e-mail met taak, tijd en locatie; vermeldt ook bakken/spullen/sponsoring indien van toepassing

### Technisch/infrastructuur

- **Supabase SSR-client** correct opgezet voor App Router (cookies-gebaseerde sessies)
- **Service-role client** gescheiden van anon-client (admin-operaties server-only)
- **Middleware** beschermt alle `/admin/*`-routes met gebruiker- én admin_users-controle
- **Audit-log** geïmplementeerd voor reserveringen en vrijwilligersaanmeldingen
- **E-maillog** in database na elke verstuurde notificatie

---

## Initiële opbouw

- Next.js 15 / React 19 / TypeScript / Tailwind CSS projectopzet
- Supabase-database met tabellen: `car_reservations`, `volunteer_signups`, `contribution_signups`, `settings`, `email_logs`, `admin_users`
- Publieke pagina's: homepagina, reserveringspagina, help-mee pagina
- Admin-panel met login en beveiligde routes
- Resend e-mailintegratie voor alle notificaties
- Deployment op Vercel, DNS via TransIP
