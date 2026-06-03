const infoItems = [
  {
    label: "Datum",
    value: "Zaterdag 22 augustus",
    sub: "Jaarlijks terugkerend evenement",
  },
  {
    label: "Openingstijden",
    value: "09:00 – 16:00 uur",
    sub: "Laatste auto om 15:45",
  },
  {
    label: "Locatie",
    value: "Sionkerk Houten",
    sub: "Eikenhout 221 · 3991 PN Houten",
  },
  {
    label: "Betaling",
    value: "Contant ter plaatse",
    sub: "Exact bedrag wordt gewaardeerd",
  },
];

export default function PracticalInfo() {
  return (
    <section id="praktisch" className="bg-white section-padding">
      <div className="container-max">

        <div className="mb-12">
          <span className="label-small">Praktische informatie</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950">
            Alles wat je moet weten
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          <div className="divide-y divide-stone-100">
            {infoItems.map((item) => (
              <div key={item.label} className="py-5 flex gap-6 items-start">
                <div className="w-28 flex-shrink-0">
                  <p className="label-small">{item.label}</p>
                </div>
                <div>
                  <p className="font-semibold text-green-950 text-base">{item.value}</p>
                  <p className="text-gray-400 text-sm mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-2xl overflow-hidden bg-green-50 border border-green-100/60 h-52 flex items-center justify-center">
              <div className="text-center text-green-400">
                <svg className="w-10 h-10 mx-auto mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="font-medium text-sm">Eikenhout 221, Houten</p>
                <p className="text-xs opacity-60 mt-0.5">Kaart volgt</p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f8f6f1] px-6 py-5 border border-stone-100">
              <p className="text-green-800 font-semibold text-base mb-1">
                Kom gewoon langs
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Je hoeft niets te regelen. Geen registratie, geen wachttijd.
                Rij op, kies je pakket en laat je auto wassen door onze
                gemeenteleden.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
