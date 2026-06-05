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

const SUPPLIES_OPTIONS = [
  { value: "emmer",             label: "Emmer" },
  { value: "autowasshampoo",    label: "Autowasshampoo" },
  { value: "wasborstel",        label: "Wasborstel" },
  { value: "haspel",            label: "Haspel / verlengsnoer" },
  { value: "zeem",              label: "Zeem" },
  { value: "doeken_binnenkant", label: "Doeken voor binnenkant auto" },
  { value: "stofzuiger",        label: "Stofzuiger" },
  { value: "spons",             label: "Spons" },
  { value: "droogdoeken",       label: "Droogdoeken" },
  { value: "tuinslang",         label: "Tuinslang" },
  { value: "hogedrukreiniger",  label: "Hogedrukreiniger" },
  { value: "partytent",         label: "Partytent" },
  { value: "tafel",             label: "Tafel" },
  { value: "anders",            label: "Anders, namelijk" },
];

const SUPPLIES_LABELS: Record<string, string> = Object.fromEntries(
  SUPPLIES_OPTIONS.map(o => [o.value, o.label])
);

const AVAIL_OPTIONS = [
  { value: "full_day",  label: "Hele dag",  sub: "09:00 – 16:00" },
  { value: "morning",   label: "Ochtend",   sub: "09:00 – 12:30" },
  { value: "afternoon", label: "Middag",    sub: "12:30 – 16:00" },
];

const COST_OPTIONS = [
  { value: "",                  label: "— Kies een optie —" },
  { value: "eigen_kosten",      label: "Ik betaal de ingrediënten zelf" },
  { value: "vergoeding_gewenst",label: "Ik zou graag een vergoeding willen" },
  { value: "gesponsord",        label: "De kosten worden gesponsord" },
  { value: "weet_ik_nog_niet",  label: "Weet ik nog niet" },
];

const COST_LABELS: Record<string, string> = {
  eigen_kosten:       "Eigen kosten",
  vergoeding_gewenst: "Vergoeding gewenst",
  gesponsord:         "Gesponsord",
  weet_ik_nog_niet:   "Weet ik nog niet",
};

const fieldCls = "w-full border border-stone-200 bg-white rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors";
const labelCls = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5";
const reqStar  = <span className="text-red-400 ml-1">*</span>;

export default function HelpMeeClient({ dateFormatted }: { dateFormatted: string }) {
  const [selected,          setSelected]          = useState<string[]>([]);
  const [availability,      setAvailability]      = useState("full_day");
  const [form,              setForm]              = useState({ name: "", email: "", phone: "", notes: "" });
  const [details,           setDetails]           = useState({ bakken: "", sponsoring: "" });
  const [spullenItems,      setSpullenItems]      = useState<string[]>([]);
  const [spullenAnders,     setSpullenAnders]     = useState("");
  const [spullenToelichting,setSpullenToelichting]= useState("");
  const [costPreference,    setCostPreference]    = useState("");
  const [status,            setStatus]            = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg,          setErrorMsg]          = useState("");

  function toggle(id: string) {
    setSelected(p => p.includes(id) ? p.filter(r => r !== id) : [...p, id]);
  }
  function toggleSpullen(item: string) {
    setSpullenItems(p => p.includes(item) ? p.filter(x => x !== item) : [...p, item]);
  }
  function set(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }
  function setDetail(k: keyof typeof details, v: string) { setDetails(p => ({ ...p, [k]: v })); }

  function buildContributionDetails(): string | null {
    const parts: string[] = [];
    if (selected.includes("bakken") && details.bakken.trim()) parts.push(`Bakken: ${details.bakken.trim()}`);
    if (selected.includes("spullen")) {
      const items = spullenItems.filter(s => s !== "anders");
      if (items.length > 0) parts.push(`Spullen: ${items.map(s => SUPPLIES_LABELS[s] ?? s).join(", ")}`);
      if (spullenItems.includes("anders") && spullenAnders.trim()) parts.push(`SpullenAnders: ${spullenAnders.trim()}`);
      if (spullenToelichting.trim()) parts.push(`SpullenToelichting: ${spullenToelichting.trim()}`);
    }
    if (selected.includes("sponsoring") && details.sponsoring.trim()) parts.push(`Sponsoring: ${details.sponsoring.trim()}`);
    return parts.length ? parts.join("\n") : null;
  }

  function clientValidate(): string | null {
    if (selected.includes("bakken")) {
      if (!details.bakken.trim()) return "Vul in wat je gaat bakken.";
      if (!costPreference)        return "Geef aan hoe de kosten van het bakken worden gedekt.";
    }
    if (selected.includes("spullen")) {
      const hasItem        = spullenItems.length > 0;
      const hasAnders      = spullenAnders.trim().length > 0;
      const hasToelichting = spullenToelichting.trim().length > 0;
      if (!hasItem && !hasAnders && !hasToelichting)
        return "Kies minimaal één spullenoptie of vul een toelichting in.";
      if (spullenItems.includes("anders") && !spullenAnders.trim())
        return "Vul in wat je nog meer meeneemt bij 'Anders, namelijk'.";
    }
    if (selected.includes("sponsoring") && !details.sponsoring.trim())
      return "Vul in hoe je wilt bijdragen als sponsor/verkoper.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = clientValidate();
    if (validationError) { setErrorMsg(validationError); return; }

    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/aanmelden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                 form.name,
          email:                form.email,
          phone:                form.phone || null,
          availability,
          tasks:                selected.length ? selected : ["onbekend"],
          contribution_details: buildContributionDetails(),
          cost_preference:      selected.includes("bakken") ? costPreference : null,
          notes:                form.notes || null,
          selected_supplies:    selected.includes("spullen") ? spullenItems : [],
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
    const chosenLabels  = selected.map(id => allOptions.find(o => o.id === id)).filter(Boolean).map(o => `${o!.emoji} ${o!.title}`);
    const contribDetails = buildContributionDetails();
    const availLabel    = AVAIL_OPTIONS.find(a => a.value === availability)?.label ?? availability;
    const costLabel     = costPreference ? COST_LABELS[costPreference] : null;

    return (
      <div className="max-w-md mx-auto px-4 pt-28 pb-20 text-center">
        <div className="text-5xl mb-5">🙌</div>
        <h1 className="text-3xl font-bold text-green-950 mb-3">Dankjewel, {form.name}!</h1>
        <p className="text-green-800/70 text-base leading-relaxed mb-4">
          We hebben je aanmelding en voorkeuren ontvangen. De organisatie maakt later de definitieve indeling en laat je weten waar je wordt ingepland.
        </p>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 text-left mb-4 space-y-3">
          {chosenLabels.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">Jouw opgegeven voorkeuren</p>
              <ul className="space-y-1">
                {chosenLabels.map(l => <li key={l} className="text-sm text-green-900">{l}</li>)}
              </ul>
            </div>
          )}
          {contribDetails && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">Extra informatie</p>
              {contribDetails.split("\n").map((line, i) => (
                <p key={i} className="text-sm text-gray-600">{line}</p>
              ))}
            </div>
          )}
          {costLabel && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Kosten bakken</p>
              <p className="text-sm text-gray-600">{costLabel}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Beschikbaarheid</p>
            <p className="text-sm text-gray-600">{availLabel}</p>
          </div>
          {form.notes && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Opmerking</p>
              <p className="text-sm text-gray-600">{form.notes}</p>
            </div>
          )}
        </div>

        <p className="text-gray-400 text-sm leading-relaxed mb-2">
          Er is een bevestiging verstuurd naar <strong>{form.email}</strong>.
        </p>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Je ontvangt nog bericht waar en wanneer je precies wordt ingepland.
        </p>
        <Link href="/" className="btn-primary inline-flex">Terug naar de homepage</Link>
      </div>
    );
  }

  // ── Formulier ───────────────────────────────────────────────────────────────
  const showDetails = selected.some(s => ["bakken", "spullen", "sponsoring"].includes(s));

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
        <p className="mt-3 text-sm text-green-700/70 leading-relaxed bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          Kies één of meer dingen waarmee je zou willen helpen. Wij maken daarna een indeling en laten je weten waar je uiteindelijk wordt ingepland.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-green-700/60">
          <span>📅 {dateFormatted}</span>
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
            ✓ Opgegeven voorkeuren: {selected.map(id => allOptions.find(o => o.id === id)?.title).join(" · ")}
          </p>
        )}

        {/* Verplichte detailvelden per geselecteerde bijdrageoptie */}
        {showDetails && (
          <div className="rounded-2xl bg-stone-50 border border-stone-100 p-4 space-y-5">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">
              Vertel ons meer — deze velden zijn verplicht
            </p>

            {selected.includes("bakken") && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Wat ga je bakken? {reqStar}</label>
                  <textarea rows={2} value={details.bakken} onChange={e => setDetail("bakken", e.target.value)}
                    placeholder="bijv. appeltaart en koekjes, ca. 30 stuks"
                    className={`${fieldCls} resize-none ${!details.bakken.trim() ? "border-rose-200" : ""}`} />
                </div>
                <div>
                  <label className={labelCls}>Kosten ingrediënten {reqStar}</label>
                  <select value={costPreference} onChange={e => setCostPreference(e.target.value)}
                    className={`${fieldCls} ${!costPreference ? "border-rose-200 text-gray-400" : ""}`}>
                    {COST_OPTIONS.map(o => (
                      <option key={o.value} value={o.value} disabled={o.value === ""}>{o.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Zo weet de organisatie of en hoe ze de kosten kunnen vergoeden.</p>
                </div>
              </div>
            )}

            {selected.includes("spullen") && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Wat kun je meenemen? {reqStar}</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {SUPPLIES_OPTIONS.map(opt => {
                      const checked = spullenItems.includes(opt.value);
                      return (
                        <label key={opt.value}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer text-sm transition-colors select-none ${checked ? "border-yellow-500 bg-yellow-50 text-yellow-900" : "border-stone-200 text-gray-600 hover:border-yellow-300"}`}>
                          <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleSpullen(opt.value)} />
                          <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${checked ? "border-yellow-500 bg-yellow-500" : "border-stone-300"}`}>
                            {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </span>
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
                {spullenItems.includes("anders") && (
                  <div>
                    <label className={labelCls}>Wat neem je nog meer mee? {reqStar}</label>
                    <input value={spullenAnders} onChange={e => setSpullenAnders(e.target.value)}
                      placeholder="Omschrijf wat je meeneemt"
                      className={`${fieldCls} ${!spullenAnders.trim() ? "border-rose-200" : ""}`} />
                  </div>
                )}
                <div>
                  <label className={labelCls}>Aantal / toelichting <span className="text-gray-300 font-normal normal-case tracking-normal">(optioneel)</span></label>
                  <input value={spullenToelichting} onChange={e => setSpullenToelichting(e.target.value)}
                    placeholder="bijv. 2 emmers en een haspel van 25 meter"
                    className={fieldCls} />
                </div>
              </div>
            )}

            {selected.includes("sponsoring") && (
              <div>
                <label className={labelCls}>Hoe wil je bijdragen? {reqStar}</label>
                <textarea rows={2} value={details.sponsoring} onChange={e => setDetail("sponsoring", e.target.value)}
                  placeholder="bijv. frisdrank en chips namens Bakkerij De Vries, ca. 60 blikjes"
                  className={`${fieldCls} resize-none ${!details.sponsoring.trim() ? "border-rose-200" : ""}`} />
              </div>
            )}
          </div>
        )}

        {/* Beschikbaarheid */}
        <div>
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-3">Wanneer kun je er zijn?</p>
          <div className="grid grid-cols-3 gap-2">
            {AVAIL_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => setAvailability(opt.value)}
                className={`rounded-xl border-2 px-3 py-3 text-center transition-colors ${availability === opt.value ? "border-green-700 bg-green-50" : "border-stone-200 hover:border-green-300"}`}>
                <p className={`font-semibold text-sm ${availability === opt.value ? "text-green-800" : "text-gray-700"}`}>{opt.label}</p>
                <p className={`text-xs mt-0.5 ${availability === opt.value ? "text-green-600" : "text-gray-400"}`}>{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-green-200/50" />
          <span className="text-xs text-gray-300 font-medium">jouw gegevens</span>
          <div className="h-px flex-1 bg-green-200/50" />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Naam {reqStar}</label>
              <input required value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Hoe mogen we je noemen?" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>E-mail {reqStar}</label>
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
            <label className={labelCls}>Wil je nog iets kwijt? <span className="text-gray-300 font-normal normal-case tracking-normal">(optioneel)</span></label>
            <textarea rows={3} value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Hoe laat je er bent, een vraag, bijzonderheden…"
              className={`${fieldCls} resize-none`} />
          </div>
        </div>

        {errorMsg && (
          <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{errorMsg}</p>
        )}

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
