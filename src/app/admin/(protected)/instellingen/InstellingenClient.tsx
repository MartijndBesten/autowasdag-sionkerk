"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EventSettings { date: string; start_time: string; end_time: string; wash_bays: number; reservations_open: boolean; volunteers_open: boolean; duration_buiten_wassen: number; duration_compleet: number; }
interface PriceSettings { buiten_wassen: number; compleet: number; }
interface SupplyOption  { value: string; label: string; }

const DEFAULT_SUPPLIES: SupplyOption[] = [
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

function labelToValue(label: string): string {
  return label.toLowerCase()
    .replace(/[/\\]/g, " ").trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

export default function InstellingenClient({ initialSettings }: { initialSettings: Record<string, unknown> }) {
  const ev0  = (initialSettings.event   as EventSettings) ?? { date:"", start_time:"09:00", end_time:"16:00", wash_bays:2, reservations_open:true, volunteers_open:true, duration_buiten_wassen:20, duration_compleet:40 };
  // Zorg dat pakketduur altijd een getal heeft (bestaande instellingen zonder deze velden)
  if (!ev0.duration_buiten_wassen) ev0.duration_buiten_wassen = 20;
  if (!ev0.duration_compleet)      ev0.duration_compleet      = 40;
  const pr0  = (initialSettings.prices  as PriceSettings) ?? { buiten_wassen:10.00, compleet:15.00 };
  const sup0 = Array.isArray(initialSettings.volunteer_supplies) && (initialSettings.volunteer_supplies as SupplyOption[]).length > 0
    ? (initialSettings.volunteer_supplies as SupplyOption[])
    : DEFAULT_SUPPLIES;

  const [event,    setEvent]    = useState<EventSettings>(ev0);
  const [prices,   setPrices]   = useState<PriceSettings>(pr0);
  const [supplies, setSupplies] = useState<SupplyOption[]>(sup0);
  const [newLabel, setNewLabel] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  function addSupply() {
    const label = newLabel.trim();
    if (!label) return;
    const value = labelToValue(label) || `item_${Date.now()}`;
    setSupplies(p => [...p, { value, label }]);
    setNewLabel("");
  }
  function removeSupply(i: number) {
    setSupplies(p => p.filter((_, idx) => idx !== i));
  }
  function updateLabel(i: number, label: string) {
    setSupplies(p => p.map((s, idx) => idx === i ? { ...s, label } : s));
  }

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("settings").upsert({ key:"event",             value: event    }, { onConflict:"key" }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("settings").upsert({ key:"prices",            value: prices   }, { onConflict:"key" }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("settings").upsert({ key:"volunteer_supplies",value: supplies }, { onConflict:"key" }),
    ]);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const f  = "w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600";
  const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Instellingen</h1>
        <p className="text-gray-400 text-sm">Evenement-configuratie en prijzen</p>
      </div>

      {/* Evenement */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-5">
        <h2 className="font-semibold text-gray-900">Evenement</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Datum</label>
            <input type="date" value={event.date} onChange={e => setEvent(p => ({...p, date: e.target.value}))} className={f} />
          </div>
          <div>
            <label className={lbl}>Wasplaatsen</label>
            <input type="number" min="1" max="10" value={event.wash_bays}
              onChange={e => setEvent(p => ({...p, wash_bays: Number(e.target.value)}))} className={f} />
          </div>
          <div>
            <label className={lbl}>Starttijd</label>
            <input type="time" value={event.start_time} onChange={e => setEvent(p => ({...p, start_time: e.target.value}))} className={f} />
          </div>
          <div>
            <label className={lbl}>Eindtijd</label>
            <input type="time" value={event.end_time} onChange={e => setEvent(p => ({...p, end_time: e.target.value}))} className={f} />
          </div>
        </div>

        <div className="flex gap-6 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={event.reservations_open}
              onChange={e => setEvent(p => ({...p, reservations_open: e.target.checked}))}
              className="w-4 h-4 rounded text-green-700" />
            <span className="text-sm text-gray-700">Reserveringen open</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={event.volunteers_open}
              onChange={e => setEvent(p => ({...p, volunteers_open: e.target.checked}))}
              className="w-4 h-4 rounded text-green-700" />
            <span className="text-sm text-gray-700">Vrijwilligers open</span>
          </label>
        </div>
      </div>

      {/* Pakketduur */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Pakketduur</h2>
          <p className="text-xs text-gray-400 mt-1">De pakketduur bepaalt hoeveel tijd en capaciteit een reservering in de planning gebruikt. Het tijdslotrooster loopt altijd in stappen van 20 minuten.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Buiten wassen (minuten)</label>
            <input type="number" min="10" max="120" step="5"
              value={event.duration_buiten_wassen}
              onChange={e => setEvent(p => ({...p, duration_buiten_wassen: Number(e.target.value)}))}
              className={f} />
            <p className="text-xs text-gray-400 mt-1">Standaard: 20 min</p>
          </div>
          <div>
            <label className={lbl}>Compleet (minuten)</label>
            <input type="number" min="10" max="180" step="5"
              value={event.duration_compleet}
              onChange={e => setEvent(p => ({...p, duration_compleet: Number(e.target.value)}))}
              className={f} />
            <p className="text-xs text-gray-400 mt-1">Standaard: 40 min</p>
          </div>
        </div>
      </div>

      {/* Prijzen */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Prijzen (€)</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "buiten_wassen", label: "Buiten wassen" },
            { key: "compleet",      label: "Compleet" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className={lbl}>{label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input type="number" min="0" step="0.50"
                  value={(prices as unknown as Record<string,number>)[key] ?? 0}
                  onChange={e => setPrices(p => ({...p, [key]: Number(e.target.value)}))}
                  className={`${f} pl-7`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spullen meenemen — opties */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Spullen meenemen — keuzeopties</h2>
          <p className="text-xs text-gray-400 mt-1">Deze opties verschijnen als vinkjes in het vrijwilligersformulier. De <strong>sleutel</strong> is niet aanpasbaar na aanmaken (wordt opgeslagen bij aanmeldingen).</p>
        </div>

        <div className="space-y-2">
          {supplies.map((s, i) => (
            <div key={s.value} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono bg-stone-50 border border-stone-200 rounded px-2 py-1 w-44 flex-shrink-0 truncate">{s.value}</span>
              <input
                value={s.label}
                onChange={e => updateLabel(i, e.target.value)}
                className={`${f} flex-1 min-w-0`}
                placeholder="Label (zichtbaar voor vrijwilliger)"
              />
              <button type="button" onClick={() => removeSupply(i)}
                className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0 px-1" title="Verwijderen">
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSupply(); } }}
            className={`${f} flex-1`}
            placeholder="Nieuw item, bijv. Bezem"
          />
          <button type="button" onClick={addSupply}
            className="bg-stone-100 text-stone-700 border border-stone-200 px-4 py-2 rounded-xl text-sm hover:bg-stone-200 transition-colors flex-shrink-0">
            + Toevoegen
          </button>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="bg-green-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-900 transition-colors disabled:opacity-50">
        {saving ? "Opslaan…" : saved ? "✓ Opgeslagen!" : "Wijzigingen opslaan"}
      </button>
    </div>
  );
}
