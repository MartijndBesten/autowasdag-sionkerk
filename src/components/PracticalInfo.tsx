import type { Action } from "@/lib/supabase/types";
import { formatEventDate } from "@/lib/event";

function buildDefaultItems(action: Action | null) {
  const date = action?.event_date ? formatEventDate(action.event_date) : "";
  const start = (action?.start_time ?? "09:00").slice(0, 5);
  const end   = (action?.end_time   ?? "16:00").slice(0, 5);
  return [
    { label: "Datum",         value: date || "Datum volgt",            sub: "Jaarlijks terugkerend evenement" },
    { label: "Openingstijden",value: `${start} – ${end} uur`,          sub: `Laatste auto om ${end === "16:00" ? "15:45" : end}` },
    { label: "Locatie",       value: action?.location_address ? `${action.location_address}, ${action.location_city}` : "Eikenhout 221, Houten", sub: action ? `${action.location_postal} Houten` : "3991 PN Houten" },
    { label: "Betaling",      value: "U kunt op de dag zelf contant betalen of via Tikkie." },
  ];
}

export default function PracticalInfo({ action }: { action: Action | null }) {
  const items = (action?.practical_info && action.practical_info.length > 0)
    ? action.practical_info
    : buildDefaultItems(action);

  return (
    <section id="praktisch" className="bg-white section-padding">
      <div className="container-max">
        <div className="mb-12">
          <span className="label-small">Terugblik – Autowasdag 2026</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950">Hoe het was georganiseerd</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div className="divide-y divide-stone-100">
            {items.map((item) => (
              <div key={item.label} className="py-5 flex gap-6 items-start">
                <div className="w-28 flex-shrink-0"><p className="label-small">{item.label}</p></div>
                <div>
                  <p className="font-semibold text-green-950 text-base">{item.value}</p>
                  {item.sub && <p className="text-gray-400 text-sm mt-0.5">{item.sub}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5">
            <div className="rounded-2xl overflow-hidden bg-green-50 border border-green-100/60 h-52 flex items-center justify-center">
              <div className="text-center text-green-400">
                {action?.location_maps_url ? (
                  <a href={action.location_maps_url} target="_blank" rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-green-700 text-white rounded-full text-sm font-semibold hover:bg-green-800 transition-colors">
                    Bekijk op kaart →
                  </a>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <p className="font-medium text-sm">{action?.location_address ?? "Eikenhout 221"}, {action?.location_city ?? "Houten"}</p>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-[#f8f6f1] px-6 py-5 border border-stone-100">
              <p className="text-green-800 font-semibold text-base mb-1">Mogelijk een nieuwe editie in 2027</p>
              <p className="text-gray-400 text-sm leading-relaxed">
                Waarschijnlijk organiseren we in 2027 opnieuw een Autowasdag. Zodra de datum en verdere informatie bekend zijn, wordt deze website bijgewerkt.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
