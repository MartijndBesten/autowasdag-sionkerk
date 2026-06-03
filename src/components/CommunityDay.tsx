"use client";

import { useModal } from "@/context/ModalContext";

const activities = [
  {
    id: "koffie",
    title: "Koffie & gebak",
    description:
      "Zit gezellig bij een kop koffie of thee terwijl je auto wordt gewassen. Vers gebak van de gemeenteleden — opbrengst gaat naar de zalen.",
    tag: "Tegen betaling",
    tagColor: "text-amber-700 bg-amber-50 border-amber-200",
    bgPlaceholder: "bg-amber-50",
    iconColor: "text-amber-400",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 1v3M10 1v3M14 1v3" />
      </svg>
    ),
  },
  {
    id: "friet",
    title: "Friet & snacks",
    description:
      "Vanaf de middag zijn er verse friet en snacks — lekker buiten op het plein. Tegen betaling; opbrengst gaat naar de zalen.",
    tag: "Tegen betaling",
    tagColor: "text-orange-700 bg-orange-50 border-orange-200",
    bgPlaceholder: "bg-orange-50",
    iconColor: "text-orange-400",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v10.5a1.5 1.5 0 003 0V3M12 3h3a3 3 0 013 3v1a3 3 0 01-3 3h-3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3H3v4a3 3 0 003 3h.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6M12 18v3" />
      </svg>
    ),
  },
  {
    id: "kids",
    title: "Kinderhoek & springkussen",
    description:
      "De kleintjes vervelen zich geen moment. Er is een springkussen op het plein en een gezellige kinderhoek binnen — zodat ouders even kunnen ontspannen.",
    tag: "Vrij toegankelijk",
    tagColor: "text-green-700 bg-green-50 border-green-200",
    bgPlaceholder: "bg-green-50",
    iconColor: "text-green-500",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function CommunityDay() {
  const { openModal } = useModal();

  return (
    <section id="op-de-dag" className="bg-white section-padding">
      <div className="container-max">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-end mb-12">
          <div>
            <span className="label-small">Op de dag zelf</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-green-950">
              Er is meer dan een wasbeurt
            </h2>
          </div>
          <p className="text-gray-400 text-base max-w-sm lg:ml-auto">
            De Autowasdag is een gezellige communitydag. Neem de tijd — er is
            genoeg te doen en te eten.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex flex-col rounded-2xl overflow-hidden border border-stone-100 shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow duration-200"
            >
              {/* Foto-placeholder */}
              <div className={`${act.bgPlaceholder} flex items-center justify-center`} style={{ height: 148 }}>
                <div className={`${act.iconColor} opacity-40`}>{act.icon}</div>
              </div>

              <div className="flex flex-col flex-1 p-6 bg-white gap-3">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-green-950 text-base leading-snug">{act.title}</h3>
                  <span className={`flex-shrink-0 text-[10px] font-semibold border px-2 py-1 rounded-full uppercase tracking-wide whitespace-nowrap ${act.tagColor}`}>
                    {act.tag}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{act.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Help mee callout */}
        <div className="rounded-2xl bg-green-800 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-8 sm:p-10 flex flex-col justify-center">
              <span className="label-small text-green-400 mb-3">Doe je mee?</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-4">
                Help mee als vrijwilliger
              </h3>
              <p className="text-green-100/70 text-base leading-relaxed mb-7 max-w-md">
                Hoe meer handen, hoe leuker de dag. Je hoeft niks te kunnen —
                enthousiasme is genoeg. Meld je aan of kom vroeg op de dag zelf langs.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => openModal("volunteer")}
                  className="inline-flex items-center gap-2 bg-white text-green-800 px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-green-50 transition-colors"
                >
                  Meld je aan
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <span className="inline-flex items-center text-green-200/60 text-sm">
                  of gewoon vroeg op de dag zelf langskomen
                </span>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center bg-green-700/40 min-h-[220px]">
              <div className="text-center text-green-600/30">
                <svg className="w-14 h-14 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs">foto vrijwilligers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
