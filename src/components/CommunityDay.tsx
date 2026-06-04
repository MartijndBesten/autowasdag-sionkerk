"use client";

import Image from "next/image";
import type { Action } from "@/lib/supabase/types";

const DEFAULT_COFFEE = "Laat uw reservering zien en ontvang een gratis bakje koffie. Gebak en andere lekkernijen zijn verkrijgbaar tijdens de actiedag.";

const activities = [
  {
    id: "koffie",
    title: "Koffie & gebak",
    bgFallback: "bg-amber-50",
    imagePath: "/images/dag-koffie.jpg",
  },
  {
    id: "friet",
    title: "Friet & snacks",
    bgFallback: "bg-orange-50",
    imagePath: "/images/dag-friet.jpg",
  },
  {
    id: "fruit",
    title: "Fruit & bloemen",
    bgFallback: "bg-rose-50",
    imagePath: "/images/dag-fruit.jpg",
  },
  {
    id: "kids",
    title: "Kinderhoek & springkussen",
    bgFallback: "bg-green-50",
    imagePath: "/images/dag-kinderhoek.jpg",
  },
];

const DESCRIPTIONS: Record<string, string> = {
  koffie: "",
  friet:  "Vanaf de middag zijn er verse friet en snacks — lekker buiten op het plein. Tegen betaling; opbrengst gaat naar de zalen.",
  fruit:  "Vers seizoensfruit en mooie bloemen — verkrijgbaar tijdens de actiedag. Leuk als cadeau of voor thuis.",
  kids:   "De kleintjes vervelen zich geen moment. Er is een springkussen op het plein en een gezellige kinderhoek binnen.",
};

export default function CommunityDay({ action }: { action: Action | null }) {
  const coffeeText = action?.coffee_text ?? DEFAULT_COFFEE;

  return (
    <section id="op-de-dag" className="bg-white section-padding">
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end mb-12">
          <div>
            <span className="label-small">Op de dag zelf</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950">Er is meer dan een wasbeurt</h2>
          </div>
          <p className="text-gray-400 text-base max-w-sm lg:ml-auto">De Autowasdag is een gezellige communitydag. Neem de tijd — er is genoeg te doen en te eten.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          {activities.map(act => (
            <div key={act.id} className="flex flex-col rounded-2xl overflow-hidden border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-200">

              {/* Afbeeldingsvlak — gekleurde achtergrond toont als fallback als foto ontbreekt */}
              <div className={`relative overflow-hidden ${act.bgFallback}`} style={{ height: 148 }}>
                <Image
                  src={act.imagePath}
                  alt={act.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Tekst */}
              <div className="flex flex-col flex-1 p-6 bg-white gap-3">
                <div>
                  <h3 className="font-bold text-green-950 text-base leading-snug">{act.title}</h3>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {act.id === "koffie" ? coffeeText : DESCRIPTIONS[act.id]}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
