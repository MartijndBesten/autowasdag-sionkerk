import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import ReserverenForm from "@/components/forms/ReserverenPageForm";
import ModalRoot from "@/components/ModalRoot";
import { getActiveAction, getEventDate, formatEventDate } from "@/lib/event";

export const metadata: Metadata = {
  title: "Reserveren — Autowasdag Sionkerk Houten",
  description: "Reserveer eenvoudig een wasbeurt voor de Autowasdag van de Sionkerk in Houten.",
};

export default async function ReserverenPage() {
  const action        = await getActiveAction();
  const eventDate     = action?.event_date ?? await getEventDate();
  const dateFormatted = formatEventDate(eventDate);

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
            Reserveer je wasbeurt
          </h1>
          <p className="mt-4 text-gray-500 text-lg leading-relaxed">
            Vul je gegevens in en kies je pakket. Reserveren is handig, dan ben
            je zeker van een plek. Langskomen zonder reservering kan ook — zolang
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

        {/* Formulier — Suspense vereist door useSearchParams */}
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-8">
          <Suspense fallback={<p className="text-gray-400 text-sm py-4">Formulier laden…</p>}>
            <ReserverenForm eventDate={eventDate} />
          </Suspense>
        </div>
      </div>

      <ModalRoot />
    </main>
  );
}
