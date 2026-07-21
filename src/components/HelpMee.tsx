const chips = [
  { label: "Auto's wassen",    icon: "🚿" },
  { label: "Koffie schenken",  icon: "☕" },
  { label: "Friet bakken",     icon: "🍟" },
  { label: "Kinderhoek",       icon: "🎈" },
  { label: "Op- en afbouwen",  icon: "🔧" },
  { label: "Iets bakken",      icon: "🎂" },
  { label: "Spullen meenemen", icon: "📦" },
];

export default function HelpMee() {
  return (
    <section
      id="help-mee"
      className="section-padding"
      style={{ background: "linear-gradient(170deg, #f5edd6 0%, #faf6e8 100%)" }}
    >
      <div className="container-max">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

          <div>
            <span className="label-small">Bedankt!</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950 leading-tight">
              Jullie maakten
              <br />deze dag mogelijk
            </h2>
            <p className="mt-5 text-lg text-green-800/60 leading-relaxed">
              De Autowasdag draaide op vrijwilligers. Van wassen en koffie schenken
              tot friet bakken, kinderhoek begeleiden, opbouwen en opruimen —
              elke bijdrage telde. Hartelijk dank aan iedereen die heeft meegedaan!
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-green-100 px-6 py-5">
            <p className="text-green-700 font-semibold text-base mb-1">Opbrengst: € 2.250</p>
            <p className="text-green-800/60 text-sm leading-relaxed">
              Dankzij alle vrijwilligers, bezoekers en sponsoren heeft de Autowasdag 2026
              een netto-opbrengst van&nbsp;€&nbsp;2.250 opgeleverd voor het opknappen
              van de zalen van de Sionkerk.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {chips.map(({ label, icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-white border border-green-200 px-3 py-1.5 rounded-full"
            >
              <span className="text-sm leading-none" aria-hidden="true">{icon}</span>
              {label}
            </span>
          ))}
        </div>

        <p className="mt-6 text-green-700/40 text-sm">
          Waarschijnlijk organiseren we in 2027 opnieuw een Autowasdag. Houd deze website in de gaten voor updates.
        </p>
      </div>
    </section>
  );
}
