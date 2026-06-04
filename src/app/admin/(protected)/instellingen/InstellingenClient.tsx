"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EventSettings { date: string; start_time: string; end_time: string; wash_bays: number; reservations_open: boolean; volunteers_open: boolean; }
interface PriceSettings { buiten_wassen: number; binnen_zuigen: number; compleet: number; }

export default function InstellingenClient({ initialSettings }: { initialSettings: Record<string, unknown> }) {
  const ev0 = (initialSettings.event   as EventSettings) ?? { date:"", start_time:"09:00", end_time:"16:00", wash_bays:2, reservations_open:true, volunteers_open:true };
  const pr0 = (initialSettings.prices  as PriceSettings) ?? { buiten_wassen:5, binnen_zuigen:5, compleet:10 };

  const [event,  setEvent]  = useState<EventSettings>(ev0);
  const [prices, setPrices] = useState<PriceSettings>(pr0);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("settings").upsert({ key:"event",  value: event  }, { onConflict:"key" }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase as any).from("settings").upsert({ key:"prices", value: prices }, { onConflict:"key" }),
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

      {/* Prijzen */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Prijzen (€)</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { key: "buiten_wassen", label: "Buiten wassen" },
            { key: "binnen_zuigen", label: "Binnen zuigen" },
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

      <button onClick={save} disabled={saving}
        className="bg-green-800 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-900 transition-colors disabled:opacity-50">
        {saving ? "Opslaan…" : saved ? "✓ Opgeslagen!" : "Wijzigingen opslaan"}
      </button>
    </div>
  );
}
