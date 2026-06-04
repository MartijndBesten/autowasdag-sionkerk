import type { Action, TimelineItem } from "@/lib/supabase/types";

const DEFAULT_STEPS = [
  { number: "01", title: "Reserveer online of kom langs", description: "Via de website reserveer je eenvoudig een tijdslot. Langskomen zonder reservering kan ook, zolang er plek is." },
  { number: "02", title: "Kies je wasbeurt", description: "Kies voor Buiten wassen (€7,50, alleen buitenkant) of Compleet (€12,50, buiten wassen + stofzuigen + eenvoudige interieurreiniging)." },
  { number: "03", title: "Gratis koffie bij je reservering", description: "Laat je reservering zien en ontvang een gratis bakje koffie. Gebak en andere lekkernijen zijn verkrijgbaar tijdens de actiedag." },
  { number: "04", title: "Samen steunen we de zalen", description: "De opbrengst gaat naar het opknappen van de zalen van de Sionkerk." },
];

const DEFAULT_TIMELINE: TimelineItem[] = [
  { time: "09:00", title: "Start autowassen",  desc: "De eerste auto's worden gewassen. Koffie en gebak staan klaar.", color: "green" },
  { time: "10:00", title: "Koffie & gebak",    desc: "Gratis koffie bij je reservering. Gebak en lekkernijen zijn verkrijgbaar.", color: "amber" },
  { time: "12:00", title: "Friet & snacks",    desc: "Vanaf de middag zijn er friet en snacks verkrijgbaar (tegen betaling).", color: "orange" },
  { time: "16:00", title: "Laatste auto",       desc: "De laatste auto's worden afgerond. We sluiten gezamenlijk af.", color: "green" },
];

const COLOR_MAP: Record<string, { accent: string; mobile: string }> = {
  green:  { accent: "bg-green-100 text-green-700 border-green-200",   mobile: "bg-green-100 text-green-700" },
  amber:  { accent: "bg-amber-100 text-amber-700 border-amber-200",   mobile: "bg-amber-100 text-amber-700" },
  orange: { accent: "bg-orange-100 text-orange-700 border-orange-200", mobile: "bg-orange-100 text-orange-700" },
  blue:   { accent: "bg-blue-100 text-blue-700 border-blue-200",      mobile: "bg-blue-100 text-blue-700" },
};

export default function HowItWorks({ action }: { action: Action | null }) {
  const timeline = (action?.timeline && action.timeline.length > 0)
    ? action.timeline
    : DEFAULT_TIMELINE;

  const coffeeNote = action?.coffee_text
    ? `Laat je reservering zien voor een <em>gratis koffie</em>. Gebak en snacks zijn verkrijgbaar.`
    : `Laat je reservering zien voor een <em>gratis koffie</em>. Gebak en snacks zijn verkrijgbaar.`;

  return (
    <section id="hoe-werkt-het" className="bg-white section-padding">
      <div className="container-max">
        <div className="max-w-lg mb-14">
          <span className="label-small">Zo werkt het</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950">Hoe werkt het?</h2>
          <p className="mt-4 text-gray-400 text-lg">Simpel, gezellig en voor een goed doel.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {DEFAULT_STEPS.map((step, i) => (
            <div key={step.number} className="relative flex flex-col gap-4">
              {i < DEFAULT_STEPS.length - 1 && (
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

        <div className="mt-14 rounded-3xl overflow-hidden border border-gold-200/70"
             style={{ background: "linear-gradient(135deg, #faf6e8 0%, #fef9ec 100%)" }}>
          <div className="px-6 sm:px-10 pt-7 pb-2">
            <p className="label-small">Tijdlijn op de dag</p>
            <p className="mt-1 text-green-800/50 text-sm" dangerouslySetInnerHTML={{ __html: coffeeNote }} />
          </div>

          {/* Desktop */}
          <div className="hidden sm:grid sm:grid-cols-4 gap-0 px-6 sm:px-10 pb-8 pt-6 relative">
            <div aria-hidden="true" className="absolute top-[2.35rem] left-[calc(12.5%+1rem)] right-[calc(12.5%+1rem)] h-px bg-green-200/70" />
            {timeline.slice(0, 4).map(item => {
              const c = COLOR_MAP[item.color ?? "green"] ?? COLOR_MAP.green;
              return (
                <div key={item.time} className="flex flex-col items-center text-center px-3 gap-3 relative z-10">
                  <div className={`w-12 h-12 rounded-full border-2 ${c.accent} flex items-center justify-center bg-white shadow-sm`}>
                    <span className="text-xs font-bold">{item.time}</span>
                  </div>
                  <span className="text-green-700 font-bold text-sm tabular-nums">{item.time}</span>
                  <h4 className="font-semibold text-green-950 text-sm leading-tight">{item.title}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Mobiel */}
          <div className="sm:hidden px-6 pt-6 pb-8 space-y-0">
            {timeline.map((item, i) => {
              const c = COLOR_MAP[item.color ?? "green"] ?? COLOR_MAP.green;
              return (
                <div key={item.time} className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-9 h-9 rounded-full ${c.mobile} flex items-center justify-center flex-shrink-0 text-xs font-bold`}>
                      {item.time.replace(":", "·")}
                    </div>
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-green-200/60 my-1" style={{ minHeight: 24 }} />}
                  </div>
                  <div className="pb-6">
                    <h4 className="font-semibold text-green-950 text-sm leading-snug">{item.title}</h4>
                    <p className="text-gray-400 text-xs leading-relaxed mt-1">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
