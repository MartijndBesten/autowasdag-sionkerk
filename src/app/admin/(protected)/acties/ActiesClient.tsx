"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Action, TimelineItem, FaqItem, PracticalItem, PackageDesc } from "@/lib/supabase/types";

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CONTENT: Action = {
  id: "", created_at: "",
  name: "Autowasdag Sionkerk",
  is_active: true, is_archived: false,
  event_date: null,
  start_time: "09:00", end_time: "16:00",
  wash_bays: 2, max_slots_per_time: 2,
  reservations_open: true, volunteers_open: true,
  price_buiten_wassen: 7.50, price_compleet: 12.50,
  notify_email: null, internal_notes: null,
  location_address: "Eikenhout 221", location_city: "Houten", location_postal: "3991 PN", location_maps_url: null,
  hero_title: "Autowasdag", hero_subtitle: "Sionkerk Houten",
  hero_description: "Laat uw auto wassen door de jongeren van de Sionkerk, geniet van koffie en gezelligheid en steun het opknappen van de zalen van de kerk!",
  hero_image_path: "/images/hero.jpg",
  action_tagline: "Sionkerk Houten · Jeugdclubs actie",
  coffee_text: "Laat uw reservering zien en ontvang een gratis bakje koffie. Gebak en andere lekkernijen zijn verkrijgbaar tijdens de actiedag.",
  timeline: [], faq: [], practical_info: [],
  package_descriptions: {
    buiten_wassen: { name: "Buitenkant wassen", tagline: "Alleen buitenkant", description: "We wassen de buitenkant van de auto.", includes: ["Buitenkant wassen", "Met zorg door de jongeren", "Opbrengst voor de zalen"] },
    compleet:      { name: "Compleet", tagline: "Buiten + binnen", description: "We wassen de buitenkant, stofzuigen de binnenkant en doen een eenvoudige interieurreiniging.", includes: ["Buitenkant wassen", "Binnenkant stofzuigen", "Eenvoudige interieurreiniging"] },
  },
  footer_email: "autowasdag@sionkerkhouten.nl", footer_website: "https://www.hervormdhouten.nl", footer_tagline: null,
};

const fc  = "w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 transition-colors bg-white";
const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";
type Tab = "basis" | "homepage" | "tijdlijn" | "praktisch" | "faq" | "pakketten" | "footer";
const TABS: [Tab, string][] = [["basis","Basisinfo"],["homepage","Homepage"],["tijdlijn","Tijdlijn"],["praktisch","Praktische info"],["faq","FAQ"],["pakketten","Pakketten"],["footer","Footer & locatie"]];

// ─── Hoofd-component ──────────────────────────────────────────────────────────

export default function ActiesClient({ initialContent }: { initialContent: Action | null }) {
  const [content, setContent] = useState<Action>(initialContent ?? DEFAULT_CONTENT);
  const [tab,     setTab]     = useState<Tab>("basis");
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createClient() as any;

  function e<K extends keyof Action>(k: K, v: Action[K]) {
    setContent(p => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    setSaving(true); setMsg(null);
    try {
      // Sla volledige sitecontent op in instellingen (sleutel: sitecontent)
      const { error } = await db.from("settings").upsert(
        { key: "sitecontent", value: content },
        { onConflict: "key" }
      );
      if (error) throw error;

      // Synchroniseer ook naar bestaande settings-sleutels zodat API-routes blijven werken
      await db.from("settings").upsert({ key: "event", value: {
        date:                      content.event_date ?? "",
        start_time:                content.start_time,
        end_time:                  content.end_time,
        wash_bays:                 content.wash_bays,
        slot_duration_minutes:     20,
        reservations_open:         content.reservations_open,
        volunteers_open:           content.volunteers_open,
        max_reservations_per_slot: content.max_slots_per_time,
      }}, { onConflict: "key" });

      await db.from("settings").upsert({ key: "prices", value: {
        buiten_wassen: content.price_buiten_wassen,
        compleet:      content.price_compleet,
      }}, { onConflict: "key" });

      setMsg({ type: "ok", text: "Sitecontent opgeslagen en gesynchroniseerd." });
    } catch (err) {
      setMsg({ type: "err", text: `Opslaan mislukt: ${err instanceof Error ? err.message : "onbekende fout"}` });
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sitecontent beheren</h1>
        <p className="text-gray-400 text-sm">Alle websitecontent staat in één plek: <code className="bg-stone-100 px-1 rounded text-xs">instellingen → sitecontent</code></p>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-2 text-sm flex items-center justify-between ${msg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-3 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-stone-100 pb-2">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === k ? "bg-green-700 text-white" : "text-gray-500 hover:bg-stone-100"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
        {tab === "basis"     && <TabBasis     d={content} e={e} />}
        {tab === "homepage"  && <TabHomepage  d={content} e={e} />}
        {tab === "tijdlijn"  && <TabTijdlijn  d={content} e={e} />}
        {tab === "praktisch" && <TabPraktisch d={content} e={e} />}
        {tab === "faq"       && <TabFaq       d={content} e={e} />}
        {tab === "pakketten" && <TabPakketten d={content} e={e} />}
        {tab === "footer"    && <TabFooter    d={content} e={e} />}
      </div>

      <button onClick={handleSave} disabled={saving}
        className="bg-green-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-900 transition-colors disabled:opacity-50 text-sm">
        {saving ? "Opslaan…" : "✓ Wijzigingen opslaan"}
      </button>
    </div>
  );
}

// ─── Hulpcomponent ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={lbl}>{label}</label>{children}</div>;
}

type SetFn = <K extends keyof Action>(k: K, v: Action[K]) => void;

// ─── Tab: Basisinfo ───────────────────────────────────────────────────────────

function TabBasis({ d, e }: { d: Action; e: SetFn }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2"><Field label="Naam / titel actie"><input value={d.name} onChange={ev => e("name", ev.target.value)} placeholder="Autowasdag Sionkerk 2026" className={fc} /></Field></div>
      <Field label="Datum evenement"><input type="date" value={d.event_date ?? ""} onChange={ev => e("event_date", ev.target.value || null)} className={fc} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Starttijd"><input type="time" value={d.start_time} onChange={ev => e("start_time", ev.target.value)} className={fc} /></Field>
        <Field label="Eindtijd"><input type="time" value={d.end_time} onChange={ev => e("end_time", ev.target.value)} className={fc} /></Field>
      </div>
      <Field label="Wasplaatsen"><input type="number" min="1" max="10" value={d.wash_bays} onChange={ev => e("wash_bays", Number(ev.target.value))} className={fc} /></Field>
      <Field label="Max per tijdslot"><input type="number" min="1" max="10" value={d.max_slots_per_time} onChange={ev => e("max_slots_per_time", Number(ev.target.value))} className={fc} /></Field>
      <Field label="Prijs buiten wassen (€)"><input type="number" min="0" step="0.5" value={d.price_buiten_wassen} onChange={ev => e("price_buiten_wassen", Number(ev.target.value))} className={fc} /></Field>
      <Field label="Prijs compleet (€)"><input type="number" min="0" step="0.5" value={d.price_compleet} onChange={ev => e("price_compleet", Number(ev.target.value))} className={fc} /></Field>
      <div className="flex items-center gap-4 pt-2 sm:col-span-2">
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"><input type="checkbox" checked={d.reservations_open} onChange={ev => e("reservations_open", ev.target.checked)} /> Reserveringen open</label>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700"><input type="checkbox" checked={d.volunteers_open} onChange={ev => e("volunteers_open", ev.target.checked)} /> Vrijwilligers open</label>
      </div>
      <div className="sm:col-span-2"><Field label="Notificatie e-mail"><input type="email" value={d.notify_email ?? ""} onChange={ev => e("notify_email", ev.target.value || null)} placeholder="m.denbesten@live.nl" className={fc} /></Field></div>
      <div className="sm:col-span-2"><Field label="Interne notitie (niet zichtbaar op site)"><textarea rows={2} value={d.internal_notes ?? ""} onChange={ev => e("internal_notes", ev.target.value || null)} className={`${fc} resize-none`} /></Field></div>
    </div>
  );
}

// ─── Tab: Homepage ────────────────────────────────────────────────────────────

function TabHomepage({ d, e }: { d: Action; e: SetFn }) {
  return (
    <div className="space-y-4">
      <Field label="H1 titel"><input value={d.hero_title} onChange={ev => e("hero_title", ev.target.value)} className={fc} /></Field>
      <Field label="H1 subtitel (gekleurd)"><input value={d.hero_subtitle} onChange={ev => e("hero_subtitle", ev.target.value)} className={fc} /></Field>
      <Field label="Label boven titel"><input value={d.action_tagline} onChange={ev => e("action_tagline", ev.target.value)} className={fc} /></Field>
      <Field label="Introductietekst"><textarea rows={3} value={d.hero_description} onChange={ev => e("hero_description", ev.target.value)} className={`${fc} resize-none`} /></Field>
      <Field label="Pad heldfoto">
        <input value={d.hero_image_path} onChange={ev => e("hero_image_path", ev.target.value)} placeholder="/images/hero.jpg" className={fc} />
        <p className="text-xs text-gray-400 mt-1">Bestand plaatsen in <code>public/images/</code> en hier het pad invullen.</p>
      </Field>
      <Field label="Koffie/gebak tekst (op pakkettenpagina en in sectie &apos;Op de dag&apos;)">
        <textarea rows={2} value={d.coffee_text} onChange={ev => e("coffee_text", ev.target.value)} className={`${fc} resize-none`} />
      </Field>
    </div>
  );
}

// ─── Tab: Tijdlijn ────────────────────────────────────────────────────────────

function TabTijdlijn({ d, e }: { d: Action; e: SetFn }) {
  const items = d.timeline ?? [];
  const update = (i: number, f: keyof TimelineItem, v: string) =>
    e("timeline", items.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]]; e("timeline", next);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Tijdstipten die op de homepagina verschijnen. Laat leeg om de standaard tijdlijn te gebruiken.</p>
      {items.map((it, i) => (
        <div key={i} className="border border-stone-200 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div><label className={lbl}>Tijd</label><input type="time" value={it.time} onChange={ev => update(i,"time",ev.target.value)} className={fc} /></div>
            <div className="col-span-2"><label className={lbl}>Titel</label><input value={it.title} onChange={ev => update(i,"title",ev.target.value)} className={fc} /></div>
          </div>
          <div><label className={lbl}>Beschrijving</label><input value={it.desc} onChange={ev => update(i,"desc",ev.target.value)} className={fc} /></div>
          <div className="flex items-center gap-2">
            <label className={lbl + " mb-0 mr-1"}>Kleur:</label>
            {["green","amber","orange","blue"].map(c => (
              <button key={c} type="button" onClick={() => update(i,"color",c)}
                className={`w-5 h-5 rounded-full border-2 ${it.color===c ? "border-gray-800 scale-110" : "border-transparent"} bg-${c}-300`} />
            ))}
            <div className="ml-auto flex gap-1">
              <button type="button" onClick={() => move(i,-1)} className="text-gray-400 hover:text-gray-700 text-xs px-1">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="text-gray-400 hover:text-gray-700 text-xs px-1">↓</button>
              <button type="button" onClick={() => e("timeline", items.filter((_,x)=>x!==i))} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => e("timeline", [...items, { time:"09:00", title:"", desc:"", color:"green" }])} className="text-sm text-green-700 hover:text-green-900 font-medium">+ Tijdstip toevoegen</button>
    </div>
  );
}

// ─── Tab: Praktische info ─────────────────────────────────────────────────────

function TabPraktisch({ d, e }: { d: Action; e: SetFn }) {
  const items = d.practical_info ?? [];
  const update = (i: number, f: keyof PracticalItem, v: string) =>
    e("practical_info", items.map((it, idx) => idx === i ? { ...it, [f]: v } : it));

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Infoblokken op de "Praktische informatie"-sectie. Als leeg, worden de defaults gebruikt (datum uit basisinfo + adres uit footer).</p>
      {items.map((it, i) => (
        <div key={i} className="border border-stone-200 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Label</label><input value={it.label} onChange={ev => update(i,"label",ev.target.value)} placeholder="Datum" className={fc} /></div>
            <div><label className={lbl}>Waarde</label><input value={it.value} onChange={ev => update(i,"value",ev.target.value)} placeholder="Zaterdag 11 juli 2026" className={fc} /></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><label className={lbl}>Sub-tekst (optioneel)</label><input value={it.sub ?? ""} onChange={ev => update(i,"sub",ev.target.value)} className={fc} /></div>
            <button type="button" onClick={() => e("practical_info", items.filter((_,x)=>x!==i))} className="mt-5 text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => e("practical_info", [...items, { label:"", value:"", sub:"" }])} className="text-sm text-green-700 hover:text-green-900 font-medium">+ Infoblok toevoegen</button>
    </div>
  );
}

// ─── Tab: FAQ ─────────────────────────────────────────────────────────────────

function TabFaq({ d, e }: { d: Action; e: SetFn }) {
  const items = d.faq ?? [];
  const update = (i: number, f: keyof FaqItem, v: string) =>
    e("faq", items.map((it, idx) => idx === i ? { ...it, [f]: v } : it));

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Veelgestelde vragen. Worden getoond als er items zijn.</p>
      {items.map((it, i) => (
        <div key={i} className="border border-stone-200 rounded-xl p-3 space-y-2">
          <div><label className={lbl}>Vraag</label><input value={it.question} onChange={ev => update(i,"question",ev.target.value)} className={fc} /></div>
          <div className="flex gap-2">
            <div className="flex-1"><label className={lbl}>Antwoord</label><textarea rows={2} value={it.answer} onChange={ev => update(i,"answer",ev.target.value)} className={`${fc} resize-none`} /></div>
            <button type="button" onClick={() => e("faq", items.filter((_,x)=>x!==i))} className="mt-5 text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => e("faq", [...items, { question:"", answer:"" }])} className="text-sm text-green-700 hover:text-green-900 font-medium">+ Vraag toevoegen</button>
    </div>
  );
}

// ─── Tab: Pakketten ───────────────────────────────────────────────────────────

function TabPakketten({ d, e }: { d: Action; e: SetFn }) {
  const pkgs = d.package_descriptions ?? {};
  const updatePkg = (slug: string, f: keyof PackageDesc, v: string | string[]) =>
    e("package_descriptions", { ...pkgs, [slug]: { ...pkgs[slug], [f]: v } });
  const updateInclude = (slug: string, i: number, v: string) => {
    const list = [...(pkgs[slug]?.includes ?? [])]; list[i] = v;
    updatePkg(slug, "includes", list);
  };

  return (
    <div className="space-y-6">
      {(["buiten_wassen","compleet"] as const).map(slug => {
        const def = DEFAULT_CONTENT.package_descriptions[slug];
        const pkg = pkgs[slug] ?? def;
        return (
          <div key={slug} className="border border-stone-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">{slug.replace("_"," ")}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Naam"><input value={pkg.name} onChange={ev => updatePkg(slug,"name",ev.target.value)} className={fc} /></Field>
              <Field label="Tagline"><input value={pkg.tagline} onChange={ev => updatePkg(slug,"tagline",ev.target.value)} className={fc} /></Field>
            </div>
            <Field label="Beschrijving"><textarea rows={2} value={pkg.description} onChange={ev => updatePkg(slug,"description",ev.target.value)} className={`${fc} resize-none`} /></Field>
            <div>
              <label className={lbl}>Inbegrepen (bullets)</label>
              {(pkg.includes ?? []).map((inc, i) => (
                <div key={i} className="flex gap-2 mb-1">
                  <input value={inc} onChange={ev => updateInclude(slug,i,ev.target.value)} className={fc} />
                  <button type="button" onClick={() => updatePkg(slug,"includes",(pkg.includes??[]).filter((_,x)=>x!==i))} className="text-red-400 text-xs">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => updatePkg(slug,"includes",[...(pkg.includes??[]),""])} className="text-xs text-green-700 hover:text-green-900">+ Toevoegen</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Footer & locatie ────────────────────────────────────────────────────

function TabFooter({ d, e }: { d: Action; e: SetFn }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Locatie</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Straat & huisnummer"><input value={d.location_address} onChange={ev => e("location_address", ev.target.value)} className={fc} /></Field>
        <Field label="Stad"><input value={d.location_city} onChange={ev => e("location_city", ev.target.value)} className={fc} /></Field>
        <Field label="Postcode"><input value={d.location_postal} onChange={ev => e("location_postal", ev.target.value)} className={fc} /></Field>
        <Field label="Google Maps URL (optioneel)"><input value={d.location_maps_url ?? ""} onChange={ev => e("location_maps_url", ev.target.value || null)} placeholder="https://maps.google.com/..." className={fc} /></Field>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">Footer</p>
      <Field label="E-mailadres contactformulier"><input type="email" value={d.footer_email} onChange={ev => e("footer_email", ev.target.value)} className={fc} /></Field>
      <Field label="Website Sionkerk"><input value={d.footer_website} onChange={ev => e("footer_website", ev.target.value)} className={fc} /></Field>
      <Field label="Footer-slogan (optioneel)"><input value={d.footer_tagline ?? ""} onChange={ev => e("footer_tagline", ev.target.value || null)} placeholder="Gemaakt met liefde door de gemeenteleden" className={fc} /></Field>
    </div>
  );
}
