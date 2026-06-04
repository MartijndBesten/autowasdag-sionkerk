import Link from "next/link";
import Image from "next/image";
import type { Action } from "@/lib/supabase/types";
import { formatEventDate, formatEventDateShort, getEventDay, getEventMonthName } from "@/lib/event";

const DEFAULTS = {
  hero_title:      "Autowasdag",
  hero_subtitle:   "Sionkerk Houten",
  hero_description:"Laat uw auto wassen door de jongeren van de Sionkerk, geniet van koffie en gezelligheid en steun het opknappen van de zalen.",
  hero_image_path: "/images/hero.jpg",
  action_tagline:  "Sionkerk Houten · Jeugdclubs actie",
  location_address:"Eikenhout 221, 3991 PN Houten",
  start_time:      "09:00",
  end_time:        "16:00",
};

export default function Hero({ action }: { action: Action | null }) {
  const eventDate   = action?.event_date ?? "";
  const dayNum      = getEventDay(eventDate);
  const monthName   = getEventMonthName(eventDate);
  const dateFull    = formatEventDate(eventDate);
  const dateShort   = formatEventDateShort(eventDate);
  const title       = action?.hero_title       ?? DEFAULTS.hero_title;
  const subtitle    = action?.hero_subtitle    ?? DEFAULTS.hero_subtitle;
  const description = action?.hero_description ?? DEFAULTS.hero_description;
  const imagePath   = action?.hero_image_path  ?? DEFAULTS.hero_image_path;
  const tagline     = action?.action_tagline   ?? DEFAULTS.action_tagline;
  const address     = action
    ? `${action.location_address}, ${action.location_postal} ${action.location_city}`
    : DEFAULTS.location_address;
  const startTime   = (action?.start_time ?? DEFAULTS.start_time).slice(0, 5);
  const endTime     = (action?.end_time   ?? DEFAULTS.end_time).slice(0, 5);

  return (
    <section id="home" className="relative overflow-hidden min-h-screen flex flex-col"
      style={{ background: "linear-gradient(160deg, #faf6e8 0%, #f5edd6 55%, #e8f5ef 100%)" }}>
      <div className="pointer-events-none select-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-[540px] h-[540px] rounded-full border-[52px] border-green-100/60" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-gold-100/50" />
        <div className="absolute bottom-10 -left-16 w-56 h-56 rounded-full bg-green-100/50" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-px w-8 bg-green-600" />
          <span className="label-small">{tagline}</span>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-center pb-14">
          <div className="order-2 lg:order-1">
            {dayNum && (
              <div className="relative mb-1 select-none" aria-hidden="true">
                <span className="text-[8rem] sm:text-[10rem] font-extrabold leading-none text-green-100 tracking-tight">{dayNum}</span>
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-green-400 font-bold text-xs uppercase tracking-[0.22em]">{monthName}</span>
              </div>
            )}

            <h1 className="text-[clamp(3.2rem,7.5vw,5.5rem)] font-extrabold text-green-950 leading-[0.9] tracking-tight -mt-6">
              {title}<br />
              <span className="text-green-700">{subtitle}</span>
            </h1>

            <p className="mt-8 text-lg text-green-800/70 leading-relaxed max-w-lg">{description}</p>

            <div className="mt-8 space-y-2.5 text-[15px] text-green-900/60">
              {dateFull && (
                <p className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {dateFull}
                </p>
              )}
              <p className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {startTime} – {endTime} uur
              </p>
              <p className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {action?.location_maps_url
                  ? <a href={action.location_maps_url} target="_blank" rel="noopener noreferrer" className="hover:text-green-700 underline">{address}</a>
                  : address}
              </p>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/reserveren" className="btn-primary">Reserveer je wasbeurt</Link>
              <a href="#help-mee" className="inline-flex items-center gap-2 border-2 border-green-700 text-green-700 px-6 py-3.5 rounded-full text-sm font-semibold hover:bg-green-700 hover:text-white transition-colors">
                Help mee als vrijwilliger
              </a>
            </div>
          </div>

          <div className="order-1 lg:order-2 flex gap-3">
            <div className="flex-1 rounded-3xl bg-green-800/90 relative overflow-hidden" style={{ minHeight: 360, maxHeight: 500 }}>
              <Image src={imagePath} alt={`${title} ${subtitle}`} fill className="object-cover" priority />
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-950/80 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-green-300/70 text-xs mb-0.5">Jeugdclubs Sionkerk</p>
                <p className="text-white text-lg font-bold leading-tight">{dateFull || title}</p>
                <p className="text-green-200/60 text-xs mt-0.5">{startTime} – {endTime} · {action?.location_address ?? "Eikenhout 221"}</p>
              </div>
            </div>

            <div className="hidden sm:flex flex-col gap-3 w-24">
              <div className="flex-1 rounded-2xl bg-gold-100 p-4 flex flex-col justify-end">
                <p className="text-green-700/60 text-[10px] mb-1 uppercase tracking-wide font-semibold">Datum</p>
                <p className="text-green-950 font-bold text-sm leading-snug">{dateShort || "—"}</p>
                <p className="text-green-700/50 text-[10px] mt-1.5">{startTime} – {endTime}</p>
              </div>
              <div className="rounded-2xl bg-green-800 p-3.5">
                <p className="text-green-300 text-[10px] leading-relaxed font-medium">Reserveren<br />aanbevolen</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-green-300/40" />
          <a href="#hoe-werkt-het" className="flex items-center gap-1.5 text-green-500 text-xs font-medium hover:text-green-700 transition-colors">
            Hoe werkt het?
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </a>
          <div className="h-px flex-1 bg-green-300/40" />
        </div>
      </div>
    </section>
  );
}
