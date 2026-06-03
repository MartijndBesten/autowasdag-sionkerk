const steps = [
  {
    number: "01",
    title: "Reserveer online of kom langs",
    description:
      "Via de website reserveert u eenvoudig een tijdslot. Langskomen zonder reservering kan ook, zolang er plek is.",
  },
  {
    number: "02",
    title: "Kies uw wasbeurt",
    description:
      "Kies voor buiten wassen, binnen zuigen of een complete wasbeurt.",
  },
  {
    number: "03",
    title: "Geniet van koffie, gebak of friet",
    description:
      "Terwijl de jongeren aan de slag gaan, bent u welkom voor koffie, gebak, friet, snacks en gezelligheid.",
  },
  {
    number: "04",
    title: "Samen steunen we de zalen",
    description:
      "De opbrengst gaat naar het opknappen van de zalen van de Sionkerk.",
  },
];

export default function HowItWorks() {
  return (
    <section id="hoe-werkt-het" className="bg-white section-padding">
      <div className="container-max">

        <div className="max-w-lg mb-14">
          <span className="label-small">Zo werkt het</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950">
            Hoe werkt het?
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Simpel, gezellig en voor een goed doel.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex flex-col gap-4">
              {i < steps.length - 1 && (
                <div aria-hidden="true" className="hidden lg:block absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-px bg-green-100" />
              )}
              <div className="relative z-10 w-10 h-10 rounded-full border-2 border-green-200 bg-white flex items-center justify-center">
                <span className="text-green-600 font-bold text-xs">{step.number}</span>
              </div>
              <h3 className="font-bold text-green-950 text-base leading-snug">{step.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed -mt-1">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Tijdlijn */}
        <div className="mt-14 rounded-3xl overflow-hidden border border-gold-200/70"
             style={{ background: "linear-gradient(135deg, #faf6e8 0%, #fef9ec 100%)" }}>

          <div className="px-6 sm:px-10 pt-7 pb-2">
            <p className="label-small">Tijdlijn op de dag</p>
            <p className="mt-1 text-green-800/50 text-sm">
              Koffie &amp; thee zijn de <em>hele dag</em> beschikbaar.
            </p>
          </div>

          {/* Desktop: 4 kolommen met verticale lijn */}
          <div className="hidden sm:grid sm:grid-cols-4 gap-0 px-6 sm:px-10 pb-8 pt-6 relative">
            {/* Doorlopende lijn */}
            <div
              aria-hidden="true"
              className="absolute top-[2.35rem] left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px bg-green-200/70"
            />

            {[
              {
                time: "08:30",
                title: "Start autowassen",
                desc: "De eerste auto's worden gewassen en de koffie staat klaar.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 20v-2a4 4 0 018 0v2" />
                  </svg>
                ),
                accent: "bg-green-100 text-green-700 border-green-200",
              },
              {
                time: "10:00",
                title: "Koffie & gebak",
                desc: "Koffie, thee en vers gebak — de hele dag beschikbaar.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
                  </svg>
                ),
                accent: "bg-amber-100 text-amber-700 border-amber-200",
              },
              {
                time: "12:00",
                title: "Friet & snacks",
                desc: "Vanaf de middag zijn er friet en snacks verkrijgbaar.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                ),
                accent: "bg-orange-100 text-orange-700 border-orange-200",
              },
              {
                time: "16:00",
                title: "Laatste auto",
                desc: "De laatste auto's worden afgerond. We sluiten gezamenlijk af.",
                icon: (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                accent: "bg-green-100 text-green-700 border-green-200",
              },
            ].map((item) => (
              <div key={item.time} className="flex flex-col items-center text-center px-3 gap-3 relative z-10">
                {/* Icoon-cirkel */}
                <div className={`w-12 h-12 rounded-full border-2 ${item.accent} flex items-center justify-center bg-white shadow-sm`}>
                  {item.icon}
                </div>
                {/* Tijd */}
                <span className="text-green-700 font-bold text-sm tabular-nums">{item.time}</span>
                {/* Titel */}
                <h4 className="font-semibold text-green-950 text-sm leading-tight">{item.title}</h4>
                {/* Beschrijving */}
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Mobiel: verticale tijdlijn */}
          <div className="sm:hidden px-6 pt-6 pb-8 space-y-0">
            {[
              {
                time: "08:30",
                title: "Start autowassen",
                desc: "De eerste auto's worden gewassen en de koffie staat klaar.",
                accent: "bg-green-100 text-green-700",
                last: false,
              },
              {
                time: "10:00",
                title: "Koffie & gebak",
                desc: "Koffie, thee en vers gebak — de hele dag beschikbaar.",
                accent: "bg-amber-100 text-amber-700",
                last: false,
              },
              {
                time: "12:00",
                title: "Friet & snacks",
                desc: "Vanaf de middag zijn er friet en snacks verkrijgbaar.",
                accent: "bg-orange-100 text-orange-700",
                last: false,
              },
              {
                time: "16:00",
                title: "Laatste auto",
                desc: "De laatste auto's worden afgerond. We sluiten gezamenlijk af.",
                accent: "bg-green-100 text-green-700",
                last: true,
              },
            ].map((item) => (
              <div key={item.time} className="flex gap-4">
                {/* Lijn + cirkel */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-9 h-9 rounded-full ${item.accent} flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
                    {item.time.replace(":", "·")}
                  </div>
                  {!item.last && <div className="w-px flex-1 bg-green-200/60 my-1" style={{ minHeight: 24 }} />}
                </div>
                {/* Content */}
                <div className={`pb-6 ${item.last ? "" : ""}`}>
                  <h4 className="font-semibold text-green-950 text-sm leading-snug">{item.title}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
