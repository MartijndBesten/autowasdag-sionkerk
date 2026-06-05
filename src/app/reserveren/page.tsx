import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import ReserverenForm from "@/components/forms/ReserverenPageForm";
import ModalRoot from "@/components/ModalRoot";
import { getActiveAction, getEventDate, formatEventDate } from "@/lib/event";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Reserveren — Autowasdag Sionkerk Houten",
  description: "Reserveer eenvoudig een wasbeurt voor de Autowasdag van de Sionkerk in Houten.",
};

export default async function ReserverenPage() {
  const action        = await getActiveAction();
  const eventDate     = action?.event_date ?? await getEventDate();
  const dateFormatted = formatEventDate(eventDate);

  // Open/gesloten check + pakketduur ophalen
  let reservationsOpen     = true;
  let durationBuitenWassen = 20;
  let durationCompleet     = 40;
  try {
    const supabase = createAdminClient() as any;
    const { data } = await supabase
      .from("settings").select("value").eq("key", "event").single();
    const ev = (data?.value as Record<string, unknown>) ?? {};
    if (ev.reservations_open === false) reservationsOpen = false;
    if (typeof ev.duration_buiten_wassen === "number") durationBuitenWassen = ev.duration_buiten_wassen;
    if (typeof ev.duration_compleet      === "number") durationCompleet      = ev.duration_compleet;
  } catch { /* val terug op defaults */ }

  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(160deg, #faf6e8 0%, #f5edd6 60%, #e8f5ef 100%)" }}>
      <Navigation />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-28 pb-20">

        {/* Terug-link */}
        <Link href="/" className="inline-flex items-center gap-2 text-green-600 text-sm hover:text-green-800 transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug naar de homepage
        </Link>

        {/* Header */}
        <div className="mb-10">
          <span className="label-small">Autowasdag · {dateFormatted}</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950">
            Reserveer uw wasbeurt
          </h1>
          <p className="mt-4 text-gray-500 text-lg leading-relaxed">
            Vul uw gegevens in en kies uw pakket. Reserveren is handig, dan bent
            u zeker van een plek. Langskomen zonder reservering kan ook — zolang
            er plek is.
          </p>

          {/* Info-strip */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-green-700">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {dateFormatted}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              09:00 – 16:00 uur
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Eikenhout 221, Houten
            </span>
          </div>
        </div>

        {/* Formulier of gesloten-melding */}
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-8">
          {reservationsOpen ? (
            <Suspense fallback={<p className="text-gray-400 text-sm py-4">Formulier laden…</p>}>
              <ReserverenForm
                eventDate={eventDate}
                durationBuitenWassen={durationBuitenWassen}
                durationCompleet={durationCompleet}
              />
            </Suspense>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-6V5" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h2 className="font-bold text-gray-900 text-xl">Reserveren is gesloten</h2>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">
                Reserveren is op dit moment gesloten. Neem contact op met de organisatie als u nog een vraag heeft.
              </p>
            </div>
          )}
        </div>
      </div>

      <ModalRoot />
    </main>
  );
}
