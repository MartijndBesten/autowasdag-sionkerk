import Link from "next/link";

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
            <span className="label-small">Doe je mee?</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950 leading-tight">
              Samen maken we
              <br />deze dag mogelijk
            </h2>
            <p className="mt-5 text-lg text-green-800/60 leading-relaxed">
              De Autowasdag draait op vrijwilligers. Of je nu een paar uur
              kunt of de hele dag — wassen, koffie schenken, friet bakken,
              kinderhoek begeleiden, opbouwen of opruimen — elke hulp telt.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/help-mee"
              className="btn-primary flex items-center justify-center gap-2 py-4 text-base"
            >
              Ik wil helpen of bijdragen
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="/bijdragen"
              className="flex items-center justify-center gap-2 py-3 text-sm font-medium border border-green-300 text-green-700 rounded-full hover:bg-green-50 transition-colors"
            >
              💜 Losse bijdrage geven
            </Link>
            <p className="text-green-700/50 text-sm text-center lg:text-left">
              Wassen, bakken, spullen meenemen, sponsoren of een losse bijdrage — alles is welkom.
            </p>
          </div>
        </div>

        {/* Chips met subtiele iconen */}
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
          Je kunt ook gewoon op de dag zelf langskomen — we zijn altijd blij met extra handen.
        </p>
      </div>
    </section>
  );
}
