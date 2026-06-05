import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import ModalRoot from "@/components/ModalRoot";
import BijdragenForm from "./BijdragenForm";

export const metadata: Metadata = {
  title: "Bijdragen — Autowasdag Sionkerk Houten",
  description: "Steun de Autowasdag van de Sionkerk Houten met een losse bijdrage. De opbrengst gaat naar het opknappen van de zalen van de kerk.",
};

export default function BijdragenPage() {
  return (
    <main className="min-h-screen" style={{ background: "linear-gradient(160deg, #faf6e8 0%, #f5edd6 60%, #f3e8ff 100%)" }}>
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
          <span className="inline-block text-xs font-semibold text-purple-600 uppercase tracking-widest mb-3">Bijdragen</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-green-950 leading-tight">
            Steun de actie
          </h1>
          <p className="mt-4 text-gray-600 text-lg leading-relaxed">
            Wilt u de actie steunen zonder uw auto te laten wassen? Dan kunt u ook een losse bijdrage geven.
            De opbrengst is bestemd voor het opknappen van de zalen van de kerk.
          </p>

          {/* Kenmerken */}
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { icon: "💜", text: "Geen online betaling" },
              { icon: "🏦", text: "Contant of QR op de dag zelf" },
              { icon: "⛪", text: "Voor de Sionkerk Houten" },
            ].map(({ icon, text }) => (
              <span key={text} className="inline-flex items-center gap-1.5 text-sm text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full">
                <span>{icon}</span>{text}
              </span>
            ))}
          </div>
        </div>

        {/* Formulier */}
        <div className="bg-white rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] p-8">
          <BijdragenForm />
        </div>

        {/* Wil je ook vrijwilliger worden? */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 flex items-center gap-4">
          <span className="text-2xl">🙌</span>
          <div>
            <p className="font-semibold text-green-800 text-sm">Ook als vrijwilliger helpen?</p>
            <p className="text-green-700/70 text-xs mt-0.5">Je kunt je ook aanmelden als vrijwilliger op de dag zelf.</p>
          </div>
          <Link href="/help-mee" className="ml-auto text-xs font-semibold text-green-700 hover:text-green-900 whitespace-nowrap">
            Aanmelden →
          </Link>
        </div>

      </div>

      <ModalRoot />
    </main>
  );
}
