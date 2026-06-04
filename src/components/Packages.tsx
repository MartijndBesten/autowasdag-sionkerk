"use client";

import Link from "next/link";
import type { Action } from "@/lib/supabase/types";

const DEFAULT_PACKAGES = [
  {
    id: "buiten_wassen", name: "Buitenkant wassen", tagline: "Alleen buitenkant",
    description: "We wassen de buitenkant van de auto.",
    includes: ["Buitenkant wassen", "Met zorg door de jongeren", "Opbrengst voor de zalen"],
    variant: "light" as const,
  },
  {
    id: "compleet", name: "Compleet", tagline: "Buiten + binnen",
    description: "We wassen de buitenkant, stofzuigen de binnenkant en doen een eenvoudige interieurreiniging.",
    includes: ["Buitenkant wassen", "Binnenkant stofzuigen", "Eenvoudige interieurreiniging"],
    variant: "featured" as const,
  },
];

type Variant = "light" | "featured";
const styles: Record<Variant, { wrap: string; label: string; name: string; price: string; divider: string; desc: string; dot: string; item: string; btn: string }> = {
  light:    { wrap: "bg-white border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)]", label: "text-green-500", name: "text-green-950", price: "text-green-900", divider: "bg-stone-100", desc: "text-gray-400", dot: "bg-green-400", item: "text-gray-600", btn: "border-2 border-green-700 text-green-700 hover:bg-green-700 hover:text-white" },
  featured: { wrap: "bg-green-700 shadow-[0_8px_32px_rgba(26,71,49,0.25)]", label: "text-green-300", name: "text-white", price: "text-white", divider: "bg-green-600/50", desc: "text-green-100/70", dot: "bg-green-300", item: "text-green-100", btn: "bg-white text-green-800 hover:bg-green-50" },
};

export default function Packages({ action }: { action: Action | null }) {
  const coffeeNote = action?.coffee_text
    ?? "Laat uw reservering zien en ontvang een gratis bakje koffie. Gebak en andere lekkernijen zijn verkrijgbaar tijdens de actiedag.";

  const packages = DEFAULT_PACKAGES.map(pkg => {
    const override = action?.package_descriptions?.[pkg.id];
    const price = pkg.id === "buiten_wassen"
      ? Number(action?.price_buiten_wassen ?? 7.50)
      : Number(action?.price_compleet ?? 12.50);
    return {
      ...pkg,
      name:        override?.name        ?? pkg.name,
      tagline:     override?.tagline     ?? pkg.tagline,
      description: override?.description ?? pkg.description,
      includes:    override?.includes    ?? pkg.includes,
      price,
    };
  });

  return (
    <section id="pakketten" className="bg-[#faf6e8] section-padding">
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end mb-12">
          <div>
            <span className="label-small">Wat mag het kosten?</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950">Kies uw wasbeurt</h2>
          </div>
          <p className="text-gray-400 text-base lg:text-right max-w-sm lg:max-w-none ml-auto">De opbrengst gaat naar het opknappen van de zalen van de Sionkerk.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 max-w-2xl mx-auto lg:max-w-none">
          {packages.map(pkg => {
            const s = styles[pkg.variant];
            return (
              <div key={pkg.id} className={`relative rounded-3xl p-7 flex flex-col gap-5 ${s.wrap} ${pkg.variant === "featured" ? "md:-translate-y-2 md:scale-[1.015]" : ""}`}>
                {pkg.variant === "featured" && (
                  <div className="absolute -top-3 left-7">
                    <span className="bg-gold-300 text-green-950 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">Meest gekozen</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] mb-1 ${s.label}`}>{pkg.tagline}</p>
                    <h3 className={`text-xl font-bold ${s.name}`}>{pkg.name}</h3>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-[2.6rem] font-extrabold leading-none ${s.price}`}>€{pkg.price.toFixed(2).replace(".", ",")}</span>
                    <p className={`text-[10px] mt-1 ${s.label}`}>per auto</p>
                  </div>
                </div>
                <div className={`h-px ${s.divider}`} />
                <p className={`text-sm leading-relaxed ${s.desc}`}>{pkg.description}</p>
                <ul className="space-y-2.5 flex-1">
                  {pkg.includes.map(item => (
                    <li key={item} className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                      <span className={`text-sm ${s.item}`}>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href={`/reserveren?pakket=${pkg.id}`} className={`w-full py-3 rounded-full text-sm font-semibold text-center transition-colors ${s.btn}`}>
                  Reserveer nu
                </Link>
              </div>
            );
          })}
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-lg flex-shrink-0">☕</span>
            <p className="text-green-800 text-sm">{coffeeNote}</p>
          </div>
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-gold-100/60 border border-gold-200/60">
            <svg className="w-4 h-4 text-green-700 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-green-800 text-sm"><strong>Reserveren is handig</strong>, dan bent u zeker van een plek. Gewoon langskomen kan ook — zolang er nog ruimte is.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
