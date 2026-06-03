import Link from "next/link";
import { formatEventDate } from "@/lib/event";

export default function Footer({ eventDate }: { eventDate: string }) {
  const dateFormatted = formatEventDate(eventDate);

  return (
    <footer id="contact" className="bg-green-950">

      <div className="section-padding border-b border-green-900/60">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

            <div>
              <span className="label-small text-green-500">Vragen?</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-white leading-snug">We horen graag<br />van je</h2>
              <p className="mt-5 text-green-100/50 text-lg leading-relaxed max-w-sm">
                Vragen over de dag, een pakket of als vrijwilliger meehelpen? Stuur een berichtje.
              </p>

              <div className="mt-8 space-y-5">
                <a href="mailto:autowasdag@sionkerkhouten.nl" className="group flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-green-900 flex items-center justify-center text-green-400 flex-shrink-0 group-hover:bg-green-800 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-500 uppercase tracking-wider mb-0.5">E-mail</p>
                    <p className="text-green-100 text-sm group-hover:text-white transition-colors">autowasdag@sionkerkhouten.nl</p>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-green-900 flex items-center justify-center text-green-400 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] text-green-500 uppercase tracking-wider mb-0.5">Adres</p>
                    <p className="text-green-100 text-sm">Eikenhout 221</p>
                    <p className="text-green-400/50 text-xs mt-0.5">3991 PN Houten</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-10 lg:pt-12">
              <div>
                <p className="text-white font-semibold text-sm mb-4">Wasbeurten</p>
                <ul className="space-y-2.5">
                  {["Basis — €5", "Compleet — €10", "Deluxe — €15"].map((t) => (
                    <li key={t}><a href="#pakketten" className="text-green-400/60 text-sm hover:text-green-300 transition-colors">{t}</a></li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-white font-semibold text-sm mb-4">Evenement</p>
                <ul className="space-y-2.5 text-green-400/60 text-sm">
                  <li>{dateFormatted}</li>
                  <li>09:00 – 16:00 uur</li>
                  <li>Reservering aanbevolen</li>
                  <li>Contante betaling</li>
                </ul>
              </div>

              <div>
                <p className="text-white font-semibold text-sm mb-4">Sionkerk</p>
                <ul className="space-y-2.5">
                  <li><a href="https://www.sionkerkhouten.nl" className="text-green-400/60 text-sm hover:text-green-300 transition-colors">sionkerkhouten.nl</a></li>
                  <li><a href="#over-ons" className="text-green-400/60 text-sm hover:text-green-300 transition-colors">Over ons</a></li>
                  <li><Link href="/reserveren" className="text-green-400/60 text-sm hover:text-green-300 transition-colors">Reserveren</Link></li>
                </ul>
              </div>

              <div>
                <p className="text-white font-semibold text-sm mb-4">Op de dag</p>
                <ul className="space-y-2.5 text-green-400/60 text-sm">
                  <li>Koffie & gebak</li>
                  <li>Friet & snacks</li>
                  <li>Kinderhoek</li>
                  <li>Springkussen</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-6">
        <div className="container-max px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center">
              <svg className="w-3 h-3 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 2 5 5.5 5 9.5c0 5 7 12.5 7 12.5s7-7.5 7-12.5C19 5.5 16 2 12 2z" />
              </svg>
            </div>
            <span className="text-green-600 text-xs">© {new Date().getFullYear()} Autowasdag Sionkerk Houten</span>
          </div>
          <p className="text-green-800 text-xs">Gemaakt met liefde door de gemeenteleden</p>
        </div>
      </div>
    </footer>
  );
}
