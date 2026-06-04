"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Action, TimelineItem, FaqItem, PracticalItem, PackageDesc } from "@/lib/supabase/types";

// ─── Defaults ────────────────────────────────────────────────────────────────

const emptyAction: Omit<Action, "id" | "created_at"> = {
  name: "", is_active: false, is_archived: false,
  event_date: null, start_time: "09:00", end_time: "16:00",
  wash_bays: 2, max_slots_per_time: 2, reservations_open: true, volunteers_open: true,
  price_buiten_wassen: 7.50, price_compleet: 12.50,
  notify_email: null, internal_notes: null,
  location_address: "Eikenhout 221", location_city: "Houten", location_postal: "3991 PN", location_maps_url: null,
  hero_title: "Autowasdag", hero_subtitle: "Sionkerk Houten",
  hero_description: "Laat uw auto wassen door de jongeren van de Sionkerk, geniet van koffie en gezelligheid en steun het opknappen van de zalen.",
  hero_image_path: "/images/hero.png", action_tagline: "Sionkerk Houten · Jeugdclubs actie",
  coffee_text: "Laat je reservering zien en ontvang een gratis bakje koffie. Gebak en andere lekkernijen zijn verkrijgbaar tijdens de actiedag.",
  timeline: [], faq: [], practical_info: [], package_descriptions: {},
  footer_email: "autowasdag@sionkerkhouten.nl", footer_website: "https://www.sionkerkhouten.nl", footer_tagline: null,
};

const emptyTimeline: TimelineItem = { time: "09:00", title: "", desc: "", color: "green" };
const emptyFaq: FaqItem = { question: "", answer: "" };
const emptyPractical: PracticalItem = { label: "", value: "", sub: "" };
const defaultPackageDesc: Record<string, PackageDesc> = {
  buiten_wassen: { name: "Buiten wassen", tagline: "Buitenwas", description: "Een grondige handwas aan de buitenkant.", includes: ["Exterieur handwas", "Spoelen & afdrogen", "Ramen wassen"] },
  compleet:      { name: "Compleet",      tagline: "Buiten én binnen", description: "Van buiten én van binnen helemaal fris.", includes: ["Buitenwas", "Interieur reinigen", "Wielen poetsen"] },
};

// ─── Hulpcomponenten ──────────────────────────────────────────────────────────

const fc  = "w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 transition-colors bg-white";
const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";
const TAB_CLS = (active: boolean) => `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${active ? "bg-green-700 text-white" : "text-gray-500 hover:bg-stone-100"}`;

type Tab = "basis" | "homepage" | "tijdlijn" | "praktisch" | "faq" | "pakketten" | "footer";

// ─── Hoofd-component ──────────────────────────────────────────────────────────

export default function ActiesClient({ initialActions }: { initialActions: Action[] }) {
  const [actions,  setActions]  = useState<Action[]>(initialActions);
  const [modal,    setModal]    = useState<"create" | "edit" | null>(null);
  const [tab,      setTab]      = useState<Tab>("basis");
  const [editData, setEditData] = useState<Omit<Action, "id" | "created_at">>(emptyAction);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [loadingId,setLoadingId]= useState<string | null>(null);
  const [msg,      setMsg]      = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createClient() as any;

  function e<K extends keyof typeof editData>(k: K, v: typeof editData[K]) {
    setEditData(p => ({ ...p, [k]: v }));
  }

  function openCreate() {
    setEditData({ ...emptyAction, package_descriptions: defaultPackageDesc });
    setEditId(null); setTab("basis"); setMsg(null); setModal("create");
  }

  function openEdit(a: Action) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, created_at, ...rest } = a;
    setEditData({
      ...rest,
      package_descriptions: Object.keys(rest.package_descriptions ?? {}).length
        ? rest.package_descriptions : defaultPackageDesc,
    });
    setEditId(a.id); setTab("basis"); setMsg(null); setModal("edit");
  }

  async function handleSave() {
    if (!editData.name.trim()) { setMsg({ type: "err", text: "Naam is verplicht." }); return; }
    setSaving(true); setMsg(null);
    try {
      if (modal === "create") {
        const { data, error } = await db.from("actions").insert(editData).select().single();
        if (error) throw error;
        setActions(p => [data as Action, ...p]);
      } else if (editId) {
        const { error } = await db.from("actions").update(editData).eq("id", editId);
        if (error) throw error;
        setActions(p => p.map(a => a.id === editId ? { ...a, ...editData } : a));
      }
      setModal(null);
      setMsg({ type: "ok", text: modal === "create" ? "Actie aangemaakt." : "Actie opgeslagen." });
    } catch { setMsg({ type: "err", text: "Opslaan mislukt." }); }
    setSaving(false);
  }

  async function handleActivate(a: Action) {
    setLoadingId(a.id); setMsg(null);
    try {
      await db.from("actions").update({ is_active: false }).neq("id", a.id);
      await db.from("actions").update({ is_active: true }).eq("id", a.id);
      await db.from("settings").upsert({ key: "event", value: {
        date: a.event_date ?? "", start_time: a.start_time, end_time: a.end_time,
        wash_bays: a.wash_bays, slot_duration_minutes: 20,
        reservations_open: a.reservations_open, volunteers_open: a.volunteers_open,
        max_reservations_per_slot: a.max_slots_per_time,
      }}, { onConflict: "key" });
      await db.from("settings").upsert({ key: "prices", value: {
        buiten_wassen: a.price_buiten_wassen, compleet: a.price_compleet,
      }}, { onConflict: "key" });
      setActions(p => p.map(x => ({ ...x, is_active: x.id === a.id })));
      setMsg({ type: "ok", text: `"${a.name}" is nu actief. Instellingen gesynchroniseerd.` });
    } catch { setMsg({ type: "err", text: "Activeren mislukt." }); }
    setLoadingId(null);
  }

  async function handleDuplicate(a: Action) {
    setLoadingId(a.id); setMsg(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, ...rest } = a;
      const { data, error } = await db.from("actions").insert({ ...rest, name: `${a.name} (kopie)`, is_active: false, is_archived: false, event_date: null }).select().single();
      if (error) throw error;
      setActions(p => [data as Action, ...p]);
      setMsg({ type: "ok", text: "Gedupliceerd. Pas de datum aan voor het nieuwe jaar." });
    } catch { setMsg({ type: "err", text: "Dupliceren mislukt." }); }
    setLoadingId(null);
  }

  async function handleArchive(a: Action) {
    if (!confirm(`Archiveer "${a.name}"? Reserveringen blijven bewaard.`)) return;
    setLoadingId(a.id); setMsg(null);
    try {
      await db.from("actions").update({ is_active: false, is_archived: true }).eq("id", a.id);
      setActions(p => p.map(x => x.id === a.id ? { ...x, is_active: false, is_archived: true } : x));
      setMsg({ type: "ok", text: `"${a.name}" gearchiveerd.` });
    } catch { setMsg({ type: "err", text: "Archiveren mislukt." }); }
    setLoadingId(null);
  }

  const active   = actions.filter(a => !a.is_archived &&  a.is_active);
  const inactive = actions.filter(a => !a.is_archived && !a.is_active);
  const archived = actions.filter(a =>  a.is_archived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acties</h1>
          <p className="text-gray-400 text-sm">Beheer actieronden — datum, teksten, prijzen, tijdlijn en meer</p>
        </div>
        <button onClick={openCreate} className="bg-green-800 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-green-900 transition-colors">+ Nieuwe actie</button>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-2 text-sm flex items-center justify-between ${msg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-3 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {actions.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center text-gray-400">
          <p className="mb-2">Nog geen acties aangemaakt.</p>
          <p className="text-sm">Maak een nieuwe actie aan. Voer daarna de migratie-SQL uit in Supabase om de content-velden te activeren.</p>
        </div>
      )}

      {active.map(a  => <ActionCard key={a.id} a={a} loading={loadingId===a.id} onEdit={openEdit} onActivate={handleActivate} onDuplicate={handleDuplicate} onArchive={handleArchive} />)}
      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactieve acties</p>
          <div className="space-y-3">{inactive.map(a => <ActionCard key={a.id} a={a} loading={loadingId===a.id} onEdit={openEdit} onActivate={handleActivate} onDuplicate={handleDuplicate} onArchive={handleArchive} />)}</div>
        </div>
      )}
      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-semibold text-gray-400 uppercase tracking-wider list-none flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span> Gearchiveerd ({archived.length})
          </summary>
          <div className="space-y-3 mt-3">{archived.map(a => <ActionCard key={a.id} a={a} loading={loadingId===a.id} onEdit={openEdit} onActivate={handleActivate} onDuplicate={handleDuplicate} onArchive={handleArchive} />)}</div>
        </details>
      )}

      {/* ── Modal ─────────────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

            {/* Header */}
            <div className="border-b border-stone-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-gray-900">{modal === "create" ? "Nieuwe actie" : `Bewerken: ${editData.name || "…"}`}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-6 pt-3 pb-1 flex-shrink-0 flex-wrap border-b border-stone-50">
              {([["basis","Basisinfo"],["homepage","Homepage"],["tijdlijn","Tijdlijn"],["praktisch","Praktische info"],["faq","FAQ"],["pakketten","Pakketten"],["footer","Footer & locatie"]] as [Tab,string][]).map(([k,l]) => (
                <button key={k} onClick={() => setTab(k)} className={TAB_CLS(tab===k)}>{l}</button>
              ))}
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">

              {tab === "basis" && <TabBasis d={editData} e={e} />}
              {tab === "homepage" && <TabHomepage d={editData} e={e} />}
              {tab === "tijdlijn" && <TabTijdlijn d={editData} e={e} />}
              {tab === "praktisch" && <TabPraktisch d={editData} e={e} />}
              {tab === "faq" && <TabFaq d={editData} e={e} />}
              {tab === "pakketten" && <TabPakketten d={editData} e={e} />}
              {tab === "footer" && <TabFooter d={editData} e={e} />}

              {msg?.type === "err" && <p className="text-red-500 text-sm">{msg.text}</p>}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-100 px-6 py-4 flex gap-3 flex-shrink-0">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-800 text-white font-semibold rounded-full py-2.5 hover:bg-green-900 disabled:opacity-50 text-sm">
                {saving ? "Opslaan…" : "Opslaan"}
              </button>
              <button onClick={() => setModal(null)} className="px-5 border border-stone-200 rounded-full text-gray-600 text-sm hover:bg-stone-50">Annuleren</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Actie-kaart ──────────────────────────────────────────────────────────────

function ActionCard({ a, onEdit, onActivate, onDuplicate, onArchive, loading }: {
  a: Action; loading: boolean;
  onEdit: (a: Action) => void;
  onActivate: (a: Action) => Promise<void>;
  onDuplicate: (a: Action) => Promise<void>;
  onArchive: (a: Action) => Promise<void>;
}) {
  const status = a.is_archived ? "archived" : a.is_active ? "active" : "inactive";
  const badgeC: Record<string,string> = { active: "bg-green-100 text-green-700", inactive: "bg-gray-100 text-gray-600", archived: "bg-stone-100 text-stone-500" };
  const badgeL: Record<string,string> = { active: "Actief", inactive: "Inactief", archived: "Gearchiveerd" };

  return (
    <div className={`bg-white rounded-2xl border ${a.is_active ? "border-green-300 shadow-sm" : "border-stone-100"} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-gray-900 truncate">{a.name}</h3>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeC[status]}`}>{badgeL[status]}</span>
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            {a.event_date && <p>📅 {new Date(a.event_date + "T12:00:00").toLocaleDateString("nl-NL", { weekday:"long",day:"numeric",month:"long",year:"numeric" })}</p>}
            <p>🕐 {a.start_time?.slice(0,5)} – {a.end_time?.slice(0,5)} · {a.wash_bays} wasplaatsen · max {a.max_slots_per_time}/slot</p>
            <p>💶 Buiten: €{Number(a.price_buiten_wassen).toFixed(2).replace(".",",")} · Compleet: €{Number(a.price_compleet).toFixed(2).replace(".",",")}</p>
            <p>📍 {a.location_address}, {a.location_city}</p>
            {!a.reservations_open && <p className="text-orange-600">⚠ Reserveringen gesloten</p>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(a)} disabled={loading} className="text-xs bg-stone-50 text-gray-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-100">Bewerken</button>
          {!a.is_active && !a.is_archived && <button onClick={() => onActivate(a)} disabled={loading} className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">{loading?"…":"Activeer"}</button>}
          <button onClick={() => onDuplicate(a)} disabled={loading} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100">{loading?"…":"Dupliceer"}</button>
          {!a.is_archived && <button onClick={() => onArchive(a)} disabled={loading} className="text-xs bg-stone-50 text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-100">{loading?"…":"Archiveer"}</button>}
        </div>
      </div>
    </div>
  );
}

// ─── Tab-componenten ──────────────────────────────────────────────────────────

type D = Omit<Action, "id" | "created_at">;
type SetFn = <K extends keyof D>(k: K, v: D[K]) => void;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={lbl}>{label}</label>{children}</div>;
}

function TabBasis({ d, e }: { d: D; e: SetFn }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2"><Field label="Naam actie *"><input value={d.name} onChange={ev => e("name", ev.target.value)} placeholder="bijv. Autowasdag Sionkerk 2026" className={fc} /></Field></div>
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
      <div className="sm:col-span-2"><Field label="Interne notitie"><textarea rows={2} value={d.internal_notes ?? ""} onChange={ev => e("internal_notes", ev.target.value || null)} className={`${fc} resize-none`} /></Field></div>
    </div>
  );
}

function TabHomepage({ d, e }: { d: D; e: SetFn }) {
  return (
    <div className="space-y-4">
      <Field label="H1 titel (groot)"><input value={d.hero_title} onChange={ev => e("hero_title", ev.target.value)} placeholder="Autowasdag" className={fc} /></Field>
      <Field label="H1 subtitel (gekleurd)"><input value={d.hero_subtitle} onChange={ev => e("hero_subtitle", ev.target.value)} placeholder="Sionkerk Houten" className={fc} /></Field>
      <Field label="Label boven titel"><input value={d.action_tagline} onChange={ev => e("action_tagline", ev.target.value)} placeholder="Sionkerk Houten · Jeugdclubs actie" className={fc} /></Field>
      <Field label="Introductietekst"><textarea rows={3} value={d.hero_description} onChange={ev => e("hero_description", ev.target.value)} className={`${fc} resize-none`} /></Field>
      <Field label="Pad heldfoto"><input value={d.hero_image_path} onChange={ev => e("hero_image_path", ev.target.value)} placeholder="/images/hero.png" className={fc} /><p className="text-xs text-gray-400 mt-1">Bestand plaatsen in <code>public/images/</code></p></Field>
      <Field label="Koffie/gebak tekst (op pakkettenpagina)"><textarea rows={2} value={d.coffee_text} onChange={ev => e("coffee_text", ev.target.value)} className={`${fc} resize-none`} /></Field>
    </div>
  );
}

function TabTijdlijn({ d, e }: { d: D; e: SetFn }) {
  const items = d.timeline ?? [];
  function update(i: number, field: keyof TimelineItem, val: string) {
    const next = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it);
    e("timeline", next);
  }
  function add() { e("timeline", [...items, { ...emptyTimeline }]); }
  function remove(i: number) { e("timeline", items.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const next = [...items]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    e("timeline", next);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Tijdlijn-items verschijnen op de homepagina onder "Hoe werkt het?"</p>
      {items.map((it, i) => (
        <div key={i} className="border border-stone-200 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div><label className={lbl}>Tijd</label><input type="time" value={it.time} onChange={ev => update(i,"time",ev.target.value)} className={fc} /></div>
            <div className="col-span-2"><label className={lbl}>Titel</label><input value={it.title} onChange={ev => update(i,"title",ev.target.value)} className={fc} /></div>
          </div>
          <div><label className={lbl}>Beschrijving</label><input value={it.desc} onChange={ev => update(i,"desc",ev.target.value)} className={fc} /></div>
          <div className="flex items-center gap-2">
            <label className={lbl + " mb-0"}>Kleur:</label>
            {["green","amber","orange","blue"].map(c => (
              <button key={c} type="button" onClick={() => update(i,"color",c)}
                className={`w-6 h-6 rounded-full border-2 ${it.color===c?"border-gray-900":"border-transparent"} bg-${c === "green" ? "green-300" : c === "amber" ? "amber-300" : c === "orange" ? "orange-300" : "blue-300"}`} />
            ))}
            <div className="ml-auto flex gap-1">
              <button type="button" onClick={() => move(i,-1)} className="text-gray-400 hover:text-gray-700 text-xs px-1">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="text-gray-400 hover:text-gray-700 text-xs px-1">↓</button>
              <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-xs px-1">✕</button>
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-green-700 hover:text-green-900 font-medium">+ Tijdstip toevoegen</button>
    </div>
  );
}

function TabPraktisch({ d, e }: { d: D; e: SetFn }) {
  const items = d.practical_info ?? [];
  function update(i: number, field: keyof PracticalItem, val: string) {
    e("practical_info", items.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  }
  function add() { e("practical_info", [...items, { ...emptyPractical }]); }
  function remove(i: number) { e("practical_info", items.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">Infoblokken die verschijnen op de "Praktische informatie"-sectie. Als leeg, worden de defaults gebruikt.</p>
      {items.map((it, i) => (
        <div key={i} className="border border-stone-200 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><label className={lbl}>Label</label><input value={it.label} onChange={ev => update(i,"label",ev.target.value)} placeholder="Datum" className={fc} /></div>
            <div><label className={lbl}>Waarde</label><input value={it.value} onChange={ev => update(i,"value",ev.target.value)} placeholder="Zaterdag 22 augustus" className={fc} /></div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1"><label className={lbl}>Sub-tekst (optioneel)</label><input value={it.sub ?? ""} onChange={ev => update(i,"sub",ev.target.value)} placeholder="Jaarlijks terugkerend evenement" className={fc} /></div>
            <button type="button" onClick={() => remove(i)} className="mt-5 text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-green-700 hover:text-green-900 font-medium">+ Infoblok toevoegen</button>
    </div>
  );
}

function TabFaq({ d, e }: { d: D; e: SetFn }) {
  const items = d.faq ?? [];
  function update(i: number, field: keyof FaqItem, val: string) {
    e("faq", items.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  }
  function add() { e("faq", [...items, { ...emptyFaq }]); }
  function remove(i: number) { e("faq", items.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400">FAQ-items (worden later als sectie getoond als er items zijn).</p>
      {items.map((it, i) => (
        <div key={i} className="border border-stone-200 rounded-xl p-3 space-y-2">
          <div><label className={lbl}>Vraag</label><input value={it.question} onChange={ev => update(i,"question",ev.target.value)} className={fc} /></div>
          <div className="flex gap-2">
            <div className="flex-1"><label className={lbl}>Antwoord</label><textarea rows={2} value={it.answer} onChange={ev => update(i,"answer",ev.target.value)} className={`${fc} resize-none`} /></div>
            <button type="button" onClick={() => remove(i)} className="mt-5 text-red-400 hover:text-red-600 text-xs">✕</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="text-sm text-green-700 hover:text-green-900 font-medium">+ Vraag toevoegen</button>
    </div>
  );
}

function TabPakketten({ d, e }: { d: D; e: SetFn }) {
  const pkgs = d.package_descriptions ?? {};
  function updatePkg(slug: string, field: keyof PackageDesc, val: string | string[]) {
    e("package_descriptions", { ...pkgs, [slug]: { ...pkgs[slug], [field]: val } });
  }
  function updateIncludes(slug: string, idx: number, val: string) {
    const list = [...(pkgs[slug]?.includes ?? [])];
    list[idx] = val;
    updatePkg(slug, "includes", list);
  }
  function addInclude(slug: string) { updatePkg(slug, "includes", [...(pkgs[slug]?.includes ?? []), ""]); }
  function removeInclude(slug: string, idx: number) { updatePkg(slug, "includes", (pkgs[slug]?.includes ?? []).filter((_,i)=>i!==idx)); }

  return (
    <div className="space-y-6">
      {["buiten_wassen","compleet"].map(slug => {
        const pkg = pkgs[slug] ?? defaultPackageDesc[slug as "buiten_wassen"|"compleet"];
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
                  <input value={inc} onChange={ev => updateIncludes(slug,i,ev.target.value)} className={fc} />
                  <button type="button" onClick={() => removeInclude(slug,i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => addInclude(slug)} className="text-xs text-green-700 hover:text-green-900">+ Toevoegen</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabFooter({ d, e }: { d: D; e: SetFn }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Locatie</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Straatnaam & huisnummer"><input value={d.location_address} onChange={ev => e("location_address", ev.target.value)} className={fc} /></Field>
        <Field label="Stad"><input value={d.location_city} onChange={ev => e("location_city", ev.target.value)} className={fc} /></Field>
        <Field label="Postcode"><input value={d.location_postal} onChange={ev => e("location_postal", ev.target.value)} className={fc} /></Field>
        <Field label="Google Maps URL (optioneel)"><input value={d.location_maps_url ?? ""} onChange={ev => e("location_maps_url", ev.target.value || null)} placeholder="https://maps.google.com/..." className={fc} /></Field>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">Footer</p>
      <Field label="E-mailadres"><input type="email" value={d.footer_email} onChange={ev => e("footer_email", ev.target.value)} className={fc} /></Field>
      <Field label="Website Sionkerk"><input value={d.footer_website} onChange={ev => e("footer_website", ev.target.value)} className={fc} /></Field>
      <Field label="Footer-slogan (optioneel)"><input value={d.footer_tagline ?? ""} onChange={ev => e("footer_tagline", ev.target.value || null)} placeholder="Gemaakt met liefde door de gemeenteleden" className={fc} /></Field>
    </div>
  );
}
