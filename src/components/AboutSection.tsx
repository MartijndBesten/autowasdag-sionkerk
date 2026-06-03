const values = [
  {
    title: "Door de jeugd",
    text: "De Autowasdag is een initiatief van de jeugdclubs van de Sionkerk. Enthousiaste jongeren wassen uw auto met plezier.",
  },
  {
    title: "Voor de zalen",
    text: "De opbrengst is voor het opknappen van de zalen van de Sionkerk — zodat er nog vele jaren activiteiten plaatsvinden.",
  },
  {
    title: "Lokale gemeenschap",
    text: "Een dag waarop de hele gemeenschap samenkomt. Buren, ouders, jongeren, iedereen is welkom.",
  },
];

export default function AboutSection() {
  return (
    <section id="over-ons" className="bg-green-950 section-padding">
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          <div className="flex flex-col justify-center">
            <span className="label-small text-green-500">Wie zijn wij?</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white leading-tight">
              Meer dan alleen
              <br />een autowasbeurt
            </h2>

            <p className="mt-7 text-[1.05rem] text-green-100/60 leading-[1.8]">
              De Autowasdag is een initiatief van de jeugdclubs van de Sionkerk
              in Houten. Met z&apos;n allen stropen we de mouwen op, wassen uw
              auto en zorgen voor een gezellige dag voor iedereen.
            </p>
            <p className="mt-4 text-[1.05rem] text-green-100/60 leading-[1.8]">
              De opbrengst is voor het opknappen van de zalen van de Sionkerk.
              Geen groot evenement — gewoon mensen uit de buurt die samen iets
              goeds doen.
            </p>

            <div className="mt-10 py-6 border-t border-green-900">
              <p className="label-small text-green-500 mb-3">Over de Sionkerk</p>
              <p className="text-green-100/50 text-sm leading-relaxed max-w-sm">
                De Sionkerk is een protestantse gemeente in Houten, actief in
                de buurt met diensten, jeugdwerk en activiteiten voor jong en oud.
              </p>
              <a
                href="https://www.sionkerkhouten.nl"
                className="inline-flex items-center gap-1.5 mt-4 text-green-400 text-sm hover:text-green-300 transition-colors"
              >
                sionkerkhouten.nl
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="divide-y divide-green-900/60">
              {values.map((v) => (
                <div key={v.title} className="py-5">
                  <p className="text-white font-semibold text-sm mb-1.5">{v.title}</p>
                  <p className="text-green-100/50 text-sm leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-green-900/50 border border-green-800/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              ))}
            </div>
            <p className="text-green-700/50 text-xs text-center">foto&apos;s van de vrijwilligers komen hier</p>
          </div>
        </div>
      </div>
    </section>
  );
}
