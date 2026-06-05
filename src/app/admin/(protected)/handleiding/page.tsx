import type { Metadata } from "next";

export const metadata: Metadata = { title: "Handleiding — Admin Autowasdag" };

export default function HandleidingPage() {
  return (
    <div className="max-w-3xl space-y-8">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Handleiding</h1>
        <p className="text-gray-400 text-sm mt-1">Stap-voor-stap uitleg voor het beheren van de autowasdag</p>
      </div>

      {/* Sectie: Planning exporteren */}
      <section className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-green-50 border-b border-green-100">
          <h2 className="font-bold text-green-900 text-base">Planning exporteren</h2>
          <p className="text-sm text-green-700 mt-0.5">Ga naar Vrijwilligers → tab &ldquo;Exporteren &amp; mailen&rdquo;</p>
        </div>
        <div className="px-6 py-5 space-y-5 text-sm text-gray-700">

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">🔒 Download interne planning</h3>
            <p>
              Dit CSV-bestand bevat <strong>alle details</strong>: naam, e-mailadres, telefoonnummer, beschikbaarheid,
              opgegeven voorkeuren, definitieve taak, tijd/dagdeel, planningsstatus, wat iemand bakt, welke spullen
              iemand meeneemt, kosten/sponsoring, de eigen notitie van de vrijwilliger, jouw interne notitie en
              de datum van aanmelding.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex gap-2">
              <span className="text-red-500 flex-shrink-0">🔒</span>
              <p className="text-red-700 text-xs">
                <strong>Alleen voor intern gebruik.</strong> Dit bestand bevat persoonsgegevens.
                Deel het niet met anderen, stuur het niet door per e-mail en sla het veilig op.
                Na de actie verwijder je het van je computer.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">📄 Download vrijwilligersoverzicht</h3>
            <p>
              Dit CSV-bestand bevat <strong>geen e-mailadressen en geen interne notities</strong>. Wel: naam,
              beschikbaarheid, voorkeuren, definitieve taak, dagdeel, status, bakinfo en spullen.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex gap-2">
              <span className="text-blue-500 flex-shrink-0">✅</span>
              <p className="text-blue-700 text-xs">
                Dit bestand mag je printen of meegeven aan iemand die helpt met de dagcoördinatie,
                bijvoorbeeld een teamleider of een ouder die toezicht houdt.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Bestand openen in Excel</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 text-sm pl-1">
              <li>Open Excel en klik op <strong>Bestand → Openen</strong></li>
              <li>Kies het gedownloade .csv-bestand</li>
              <li>Als Excel vraagt naar het importformaat: kies <strong>Gescheiden door puntkomma (;)</strong></li>
              <li>Klik op Voltooien — alle kolommen staan nu netjes naast elkaar</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Sectie: Afdrukken */}
      <section className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
          <h2 className="font-bold text-gray-900 text-base">Dagplanning afdrukken</h2>
          <p className="text-sm text-gray-500 mt-0.5">Ga naar Vrijwilligers → tab &ldquo;Afdrukken&rdquo;</p>
        </div>
        <div className="px-6 py-5 space-y-3 text-sm text-gray-700">
          <p>
            Klik op <strong>Open afdrukvenster</strong>. Er opent een nieuw tabblad met een A4-overzicht,
            gegroepeerd per dagdeel (hele dag / ochtend / middag) en per taak.
          </p>
          <p>
            Druk in het nieuwe tabblad op <kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-xs font-mono">Ctrl+P</kbd> om af te drukken.
            Kies bij voorkeur <strong>A4 liggend</strong> voor een overzichtelijk resultaat.
          </p>
          <p className="text-xs text-gray-400">
            Het afdrukvenster bevat geen e-mailadressen en geen interne notities — dit overzicht mag je ophangen
            op de dag zelf of meegeven aan teamleiders.
          </p>
        </div>
      </section>

      {/* Sectie: Vrijwilligers handmatig mailen */}
      <section className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
          <h2 className="font-bold text-amber-900 text-base">Vrijwilligers handmatig mailen</h2>
          <p className="text-sm text-amber-700 mt-0.5">
            De app verstuurt géén automatische indelingsmails. Je mailt vrijwilligers altijd zelf vanuit je eigen mailbox.
          </p>
        </div>
        <div className="px-6 py-5 space-y-5 text-sm text-gray-700">

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Stap 1 — Maak de planning klaar</h3>
            <p>
              Zorg dat alle vrijwilligers een <strong>definitieve taak</strong>, een <strong>definitief dagdeel</strong>
              en de status <strong>Ingepland</strong> hebben voordat je gaat mailen.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Stap 2 — Kopieer e-mailadressen</h3>
            <p>
              Ga naar tab <strong>Exporteren &amp; mailen</strong> en klik op de gewenste groep:
              alle ingeplande vrijwilligers, alleen ochtend, alleen middag, of per taak.
              De adressen worden naar je klembord gekopieerd, gescheiden door puntkomma.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Stap 3 — Open je eigen mailprogramma</h3>
            <p>
              Open een nieuw bericht in Gmail, Outlook of je andere mailprogramma.
              Plak de adressen in het <strong>BCC-veld</strong> — niet in Aan of CC — zodat vrijwilligers
              elkaars e-mailadres niet zien.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Stap 4 — Schrijf je mail</h3>
            <p>
              Gebruik de <strong>Kopieer standaardmailtekst</strong>-knop als startpunt.
              Pas de tekst aan naar de situatie. Voeg de gedownloade CSV of het afdrukbestand als bijlage toe
              zodat vrijwilligers hun taak en tijd kunnen terugvinden.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Stap 5 — Status bijwerken</h3>
            <p>
              Nadat je de mail hebt verstuurd, kun je de status van de vrijwilligers via het indeelvenster
              zetten op <strong>Bevestiging verstuurd</strong>. Zo zie je later wie al bericht heeft gehad.
            </p>
          </div>
        </div>
      </section>

      {/* Sectie: Overzicht exports */}
      <section className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-stone-100">
          <h2 className="font-bold text-gray-900 text-base">Samenvatting: welk bestand waarvoor?</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                {["Bestand","E-mail","Notities","Intern / Deelbaar"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 text-gray-600">
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Interne planning (.csv)</td>
                <td className="px-4 py-3">✅ Ja</td>
                <td className="px-4 py-3">✅ Ja (intern + vrijwilliger)</td>
                <td className="px-4 py-3"><span className="text-red-600 font-medium">Alleen intern</span></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Vrijwilligersoverzicht (.csv)</td>
                <td className="px-4 py-3">❌ Nee</td>
                <td className="px-4 py-3">❌ Nee</td>
                <td className="px-4 py-3"><span className="text-green-700 font-medium">Mag gedeeld worden</span></td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-medium text-gray-900">Afdruk dagplanning</td>
                <td className="px-4 py-3">❌ Nee</td>
                <td className="px-4 py-3">❌ Nee (alleen naam)</td>
                <td className="px-4 py-3"><span className="text-green-700 font-medium">Mag gedeeld / geprint</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}
