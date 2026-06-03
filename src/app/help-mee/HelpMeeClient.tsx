"use client";

import { useState } from "react";
import Link from "next/link";

const categories = [
  {
    group: "Op de dag helpen",
    options: [
      { id: "wassen",     emoji: "🚿", title: "Auto's wassen",       desc: "Emmer en spons — de kern van de dag.",                    colors: { idle: "bg-green-50 border-green-200",   active: "bg-green-700 border-green-700 text-white"  } },
      { id: "koffie",     emoji: "☕", title: "Koffie schenken",      desc: "Zorgen dat er altijd een bakje klaarstaat.",               colors: { idle: "bg-amber-50 border-amber-200",   active: "bg-amber-500 border-amber-500 text-white"  } },
      { id: "friet",      emoji: "🍟", title: "Friet & snacks",       desc: "Bakken en uitserveren in de middag.",                     colors: { idle: "bg-orange-50 border-orange-200", active: "bg-orange-500 border-orange-500 text-white" } },
      { id: "kinderhoek", emoji: "🎈", title: "Kinderhoek",           desc: "Spelletjes en aandacht voor de kleintjes.",               colors: { idle: "bg-sky-50 border-sky-200",       active: "bg-sky-500 border-sky-500 text-white"      } },
      { id: "opbouwen",   emoji: "🔧", title: "Op- en afbouwen",      desc: "Vroeg aanwezig om alles klaar te zetten.",                 colors: { idle: "bg-purple-50 border-purple-200", active: "bg-purple-600 border-purple-600 text-white" } },
    ],
  },
  {
    group: "Iets meebrengen of bijdragen",
    options: [
      { id: "bakken",     emoji: "🎂", title: "Iets bakken",          desc: "Taart, koekjes, cake — vers gebak is altijd welkom.",      colors: { idle: "bg-rose-50 border-rose-200",     active: "bg-rose-500 border-rose-500 text-white"    } },
      { id: "spullen",    emoji: "📦", title: "Spullen meenemen",      desc: "Emmers, zeep, sponzen of materiaal voor de kinderhoek.",   colors: { idle: "bg-yellow-50 border-yellow-200", active: "bg-yellow-500 border-yellow-500 text-white" } },
      { id: "sponsoring", emoji: "🤝", title: "Sponsoring / verkopen", desc: "Bijdragen in natura, producten of financieel.",            colors: { idle: "bg-teal-50 border-teal-200",     active: "bg-teal-600 border-teal-600 text-white"    } },
    ],
  },
  {
    group: "Anders",
    options: [
      { id: "anders",     emoji: "✋", title: "Iets anders",           desc: "Heb je een andere manier om bij te dragen? Vertel het.",   colors: { idle: "bg-stone-50 border-stone-200",   active: "bg-stone-600 border-stone-600 text-white"  } },
    ],
  },
];

const allOptions = categories.flatMap(c => c.options);

const fieldCls = "w-full border border-stone-200 bg-white rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors";
const labelCls = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5";

export default function HelpMeeClient() {
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm]         = useState({ name: "", email: "", phone: "", notes: "" });
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function toggle(id: string) {
    setSelected(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
  }
  function set(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/aanmelden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         form.name,
          email:        form.email,
          phone:        form.phone || null,
          availability: "full_day",
          tasks:        selected.length ? selected : ["onbekend"],
          notes:        form.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fout");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan. Probeer het opnieuw.");
      setStatus("error");
    }
  }

  // ── Succes ──────────────────────────────────────────────────────────────────
  if (status === "success") {
    const chosenLabels = selected
      .map(id => allOptions.find(o => o.id === id))
      .filter(Boolean)
      .map(o => `${o!.emoji} ${o!.title}`);

    return (
      <div className="max-w-md mx-auto px-4 pt-28 pb-20 text-center">
        <div className="text-5xl mb-5">🙌</div>
        <h1 className="text-3xl font-bold text-green-950 mb-3">Dankjewel, {form.name}!</h1>
        <p className="text-green-800/60 text-lg leading-relaxed mb-4">We zijn blij dat je meedoet.</p>
        {chosenLabels.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 text-left mb-6">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Jouw bijdrage</p>
            <ul className="space-y-1">
              {chosenLabels.map(l => <li key={l} className="text-sm text-green-900">{l}</li>)}
            </ul>
          </div>
        )}
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          We nemen contact op via {form.email} met meer informatie over de dag.
        </p>
        <Link href="/" className="btn-primary inline-flex">Terug naar de homepage</Link>
      </div>
    );
  }

  // ── Formulier ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 pb-20">
      <div className="pt-20 sm:pt-24 pb-2">
        <Link href="/" className="inline-flex items-center gap-2 text-green-600 text-sm hover:text-green-800 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Terug
        </Link>
      </div>

      <div className="mt-6 mb-8">
        <p className="label-small mb-2">Doe je mee?</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-green-950 leading-tight">
          Samen maken we<br />deze dag mogelijk
        </h1>
        <p className="mt-4 text-green-800/60 text-base leading-relaxed">
          De Autowasdag draait op vrijwilligers van de Sionkerk. Of je nu
          een paar uur kunt of iets wilt meebrengen — elke bijdrage helpt.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-green-700/60">
          <span>📅 Zaterdag 22 augustus</span>
          <span>🕗 09:00 – 17:00 (ook een dagdeel is prima)</span>
          <span>📍 Eikenhout 221, Houten</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Categorieën */}
        {categories.map(cat => (
          <div key={cat.group}>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">{cat.group}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {cat.options.map(opt => {
                const active = selected.includes(opt.id);
                return (
                  <button key={opt.id} type="button" onClick={() => toggle(opt.id)}
                    className={`relative text-left rounded-2xl border-2 p-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 ${active ? opt.colors.active : opt.colors.idle}`}
                  >
                    {active && (
                      <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white/25 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <div className="text-xl mb-2 leading-none">{opt.emoji}</div>
                    <p className={`font-semibold text-sm leading-snug ${active ? "text-white" : "text-green-950"}`}>{opt.title}</p>
                    <p className={`text-xs leading-relaxed mt-1 ${active ? "text-white/70" : "text-gray-400"}`}>{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {selected.length > 0 && (
          <p className="text-xs text-green-600 font-medium -mt-4">
            ✓ {selected.map(id => allOptions.find(o => o.id === id)?.title).join(" · ")}
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-green-200/50" />
          <span className="text-xs text-gray-300 font-medium">jouw gegevens</span>
          <div className="h-px flex-1 bg-green-200/50" />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Naam <span className="text-red-400">*</span></label>
              <input required value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Hoe mogen we je noemen?" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>E-mail <span className="text-red-400">*</span></label>
              <input type="email" required value={form.email} onChange={e => set("email", e.target.value)}
                placeholder="jouw@email.nl" className={fieldCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Telefoon <span className="text-gray-300 font-normal normal-case tracking-normal">(optioneel)</span></label>
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              placeholder="06 00 00 00 00" className={fieldCls} />
          </div>
          <div>
            <label className={labelCls}>Wil je iets kwijt? <span className="text-gray-300 font-normal normal-case tracking-normal">(optioneel)</span></label>
            <textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Hoe laat je er bent, wat je meebrengt, een vraag…"
              className={`${fieldCls} resize-none`} />
          </div>
        </div>

        {status === "error" && <p className="text-red-500 text-sm">{errorMsg}</p>}

        <button type="submit" disabled={status === "loading" || !form.name || !form.email}
          className="w-full bg-green-800 text-white font-semibold text-base rounded-full py-4 hover:bg-green-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {status === "loading"
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Bezig…</>
            : <>Ik doe mee <span className="text-lg leading-none">→</span></>
          }
        </button>

        <p className="text-center text-gray-400 text-sm pb-4">
          Je kunt ook gewoon op de dag zelf langskomen —{" "}
          <span className="text-green-600">we zijn altijd blij met extra handen.</span>
        </p>
      </form>
    </div>
  );
}
