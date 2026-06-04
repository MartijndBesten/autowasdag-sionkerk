"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Action } from "@/lib/supabase/types";

const empty: Omit<Action, "id" | "created_at"> = {
  name: "",
  is_active: false,
  is_archived: false,
  event_date: null,
  start_time: "09:00",
  end_time: "16:00",
  wash_bays: 2,
  max_slots_per_time: 2,
  reservations_open: true,
  volunteers_open: true,
  price_buiten_wassen: 7.50,
  price_compleet: 12.50,
  notify_email: null,
  internal_notes: null,
};

const STATUS_LABEL: Record<string, string> = {
  active:   "Actief",
  inactive: "Inactief",
  archived: "Gearchiveerd",
};
const STATUS_COLOR: Record<string, string> = {
  active:   "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-600",
  archived: "bg-stone-100 text-stone-500",
};

function actionStatus(a: Action) {
  if (a.is_archived) return "archived";
  if (a.is_active)   return "active";
  return "inactive";
}

export default function ActiesClient({ initialActions }: { initialActions: Action[] }) {
  const [actions,  setActions]  = useState<Action[]>(initialActions);
  const [modal,    setModal]    = useState<"create" | "edit" | null>(null);
  const [editData, setEditData] = useState<Omit<Action, "id" | "created_at">>(empty);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [loadingId,setLoadingId]= useState<string | null>(null);
  const [msg,      setMsg]      = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createClient() as any;

  function openCreate() {
    setEditData(empty);
    setEditId(null);
    setModal("create");
  }

  function openEdit(a: Action) {
    const { id, created_at, ...rest } = a;
    void id; void created_at;
    setEditData(rest);
    setEditId(a.id);
    setModal("edit");
  }

  async function handleSave() {
    if (!editData.name.trim()) { setMsg({ type: "err", text: "Naam is verplicht." }); return; }
    setSaving(true);
    setMsg(null);
    try {
      if (modal === "create") {
        const { data, error } = await db.from("actions").insert(editData).select().single();
        if (error) throw error;
        setActions(prev => [data as Action, ...prev]);
      } else if (editId) {
        const { error } = await db.from("actions").update(editData).eq("id", editId);
        if (error) throw error;
        setActions(prev => prev.map(a => a.id === editId ? { ...a, ...editData } : a));
      }
      setModal(null);
      setMsg({ type: "ok", text: modal === "create" ? "Actie aangemaakt." : "Actie opgeslagen." });
    } catch { setMsg({ type: "err", text: "Opslaan mislukt." }); }
    setSaving(false);
  }

  async function handleActivate(a: Action) {
    setLoadingId(a.id);
    setMsg(null);
    try {
      // Deactiveer alle andere acties
      await db.from("actions").update({ is_active: false }).neq("id", a.id);
      // Activeer deze actie
      await db.from("actions").update({ is_active: true }).eq("id", a.id);

      // Synchroniseer naar settings tabel zodat bestaande code blijft werken
      await db.from("settings").upsert({
        key: "event",
        value: {
          date:                     a.event_date ?? "",
          start_time:               a.start_time,
          end_time:                 a.end_time,
          wash_bays:                a.wash_bays,
          slot_duration_minutes:    20,
          reservations_open:        a.reservations_open,
          volunteers_open:          a.volunteers_open,
          max_reservations_per_slot: a.max_slots_per_time,
        },
      }, { onConflict: "key" });

      await db.from("settings").upsert({
        key: "prices",
        value: {
          buiten_wassen: a.price_buiten_wassen,
          compleet:      a.price_compleet,
        },
      }, { onConflict: "key" });

      setActions(prev => prev.map(x => ({
        ...x,
        is_active: x.id === a.id,
      })));
      setMsg({ type: "ok", text: `"${a.name}" is nu actief. Instellingen gesynchroniseerd.` });
    } catch { setMsg({ type: "err", text: "Activeren mislukt." }); }
    setLoadingId(null);
  }

  async function handleDuplicate(a: Action) {
    setLoadingId(a.id);
    setMsg(null);
    try {
      const { id, created_at, ...rest } = a;
      void id; void created_at;
      const copy = {
        ...rest,
        name: `${a.name} (kopie)`,
        is_active: false,
        is_archived: false,
        event_date: null,
      };
      const { data, error } = await db.from("actions").insert(copy).select().single();
      if (error) throw error;
      setActions(prev => [data as Action, ...prev]);
      setMsg({ type: "ok", text: "Actie gedupliceerd. Pas de datum aan voor het nieuwe jaar." });
    } catch { setMsg({ type: "err", text: "Dupliceren mislukt." }); }
    setLoadingId(null);
  }

  async function handleArchive(a: Action) {
    if (!confirm(`Archiveer "${a.name}"? Reserveringen en aanmeldingen blijven bewaard.`)) return;
    setLoadingId(a.id);
    setMsg(null);
    try {
      await db.from("actions").update({ is_active: false, is_archived: true }).eq("id", a.id);
      setActions(prev => prev.map(x => x.id === a.id ? { ...x, is_active: false, is_archived: true } : x));
      setMsg({ type: "ok", text: `"${a.name}" is gearchiveerd.` });
    } catch { setMsg({ type: "err", text: "Archiveren mislukt." }); }
    setLoadingId(null);
  }

  const fc  = "w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 transition-colors";
  const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";

  const active   = actions.filter(a => !a.is_archived && a.is_active);
  const inactive = actions.filter(a => !a.is_archived && !a.is_active);
  const archived = actions.filter(a => a.is_archived);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acties</h1>
          <p className="text-gray-400 text-sm">Beheer actieronden (autowasdag per jaar of kerkactie)</p>
        </div>
        <button onClick={openCreate}
          className="bg-green-800 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-green-900 transition-colors">
          + Nieuwe actie
        </button>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-2 text-sm ${msg.type === "ok" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-3 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {actions.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 p-10 text-center text-gray-400">
          <p className="text-lg mb-2">Nog geen acties aangemaakt.</p>
          <p className="text-sm">Maak een nieuwe actie aan om te beginnen. Koppel daarna de bestaande instellingen via "Activeer".</p>
        </div>
      )}

      {/* Actief */}
      {active.map(a => <ActionCard key={a.id} a={a} onEdit={openEdit} onActivate={handleActivate} onDuplicate={handleDuplicate} onArchive={handleArchive} loading={loadingId === a.id} />)}

      {/* Inactief */}
      {inactive.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Inactieve acties</p>
          <div className="space-y-3">
            {inactive.map(a => <ActionCard key={a.id} a={a} onEdit={openEdit} onActivate={handleActivate} onDuplicate={handleDuplicate} onArchive={handleArchive} loading={loadingId === a.id} />)}
          </div>
        </div>
      )}

      {/* Gearchiveerd */}
      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 list-none flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            Gearchiveerde acties ({archived.length})
          </summary>
          <div className="space-y-3 mt-3">
            {archived.map(a => <ActionCard key={a.id} a={a} onEdit={openEdit} onActivate={handleActivate} onDuplicate={handleDuplicate} onArchive={handleArchive} loading={loadingId === a.id} />)}
          </div>
        </details>
      )}

      {/* Modal: aanmaken / bewerken */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <h2 className="font-bold text-gray-900">{modal === "create" ? "Nieuwe actie" : "Actie bewerken"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <div className="p-6 space-y-5">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={lbl}>Naam actie *</label>
                  <input value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))}
                    placeholder="bijv. Autowasdag Sionkerk 2026" className={fc} />
                </div>
                <div>
                  <label className={lbl}>Datum evenement</label>
                  <input type="date" value={editData.event_date ?? ""} onChange={e => setEditData(p => ({ ...p, event_date: e.target.value || null }))} className={fc} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Starttijd</label>
                    <input type="time" value={editData.start_time} onChange={e => setEditData(p => ({ ...p, start_time: e.target.value }))} className={fc} />
                  </div>
                  <div>
                    <label className={lbl}>Eindtijd</label>
                    <input type="time" value={editData.end_time} onChange={e => setEditData(p => ({ ...p, end_time: e.target.value }))} className={fc} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Wasplaatsen</label>
                  <input type="number" min="1" max="10" value={editData.wash_bays} onChange={e => setEditData(p => ({ ...p, wash_bays: Number(e.target.value) }))} className={fc} />
                </div>
                <div>
                  <label className={lbl}>Max reserveringen per tijdslot</label>
                  <input type="number" min="1" max="10" value={editData.max_slots_per_time} onChange={e => setEditData(p => ({ ...p, max_slots_per_time: Number(e.target.value) }))} className={fc} />
                </div>
                <div>
                  <label className={lbl}>Prijs buiten wassen (€)</label>
                  <input type="number" min="0" step="0.5" value={editData.price_buiten_wassen} onChange={e => setEditData(p => ({ ...p, price_buiten_wassen: Number(e.target.value) }))} className={fc} />
                </div>
                <div>
                  <label className={lbl}>Prijs compleet (€)</label>
                  <input type="number" min="0" step="0.5" value={editData.price_compleet} onChange={e => setEditData(p => ({ ...p, price_compleet: Number(e.target.value) }))} className={fc} />
                </div>
                <div>
                  <label className={lbl}>Notificatie e-mail (optioneel)</label>
                  <input type="email" value={editData.notify_email ?? ""} onChange={e => setEditData(p => ({ ...p, notify_email: e.target.value || null }))}
                    placeholder="m.denbesten@live.nl" className={fc} />
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={editData.reservations_open} onChange={e => setEditData(p => ({ ...p, reservations_open: e.target.checked }))} />
                    Reserveringen open
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input type="checkbox" checked={editData.volunteers_open} onChange={e => setEditData(p => ({ ...p, volunteers_open: e.target.checked }))} />
                    Vrijwilligers open
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}>Interne notitie (optioneel)</label>
                  <textarea rows={2} value={editData.internal_notes ?? ""} onChange={e => setEditData(p => ({ ...p, internal_notes: e.target.value || null }))}
                    placeholder="Bijv. planning, contactpersonen, bijzonderheden…" className={`${fc} resize-none`} />
                </div>
              </div>

              {msg?.type === "err" && <p className="text-red-500 text-sm">{msg.text}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-green-800 text-white font-semibold rounded-full py-3 hover:bg-green-900 disabled:opacity-50">
                  {saving ? "Opslaan…" : "Opslaan"}
                </button>
                <button onClick={() => setModal(null)} className="px-5 border border-stone-200 rounded-full text-gray-600 text-sm">Annuleren</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ a, onEdit, onActivate, onDuplicate, onArchive, loading }: {
  a: Action;
  onEdit: (a: Action) => void;
  onActivate: (a: Action) => Promise<void>;
  onDuplicate: (a: Action) => Promise<void>;
  onArchive: (a: Action) => Promise<void>;
  loading: boolean;
}) {
  const status = a.is_archived ? "archived" : a.is_active ? "active" : "inactive";
  const statusLabel: Record<string, string> = { active: "Actief", inactive: "Inactief", archived: "Gearchiveerd" };
  const statusColor: Record<string, string> = {
    active:   "bg-green-100 text-green-700",
    inactive: "bg-gray-100 text-gray-600",
    archived: "bg-stone-100 text-stone-500",
  };

  return (
    <div className={`bg-white rounded-2xl border ${a.is_active ? "border-green-300 shadow-sm" : "border-stone-100"} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 truncate">{a.name}</h3>
            <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[status]}`}>
              {statusLabel[status]}
            </span>
          </div>
          <div className="text-xs text-gray-500 space-y-0.5">
            {a.event_date && <p>📅 {new Date(a.event_date + "T12:00:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>}
            <p>🕐 {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)} · {a.wash_bays} wasplaatsen · max {a.max_slots_per_time}/slot</p>
            <p>💶 Buiten: €{Number(a.price_buiten_wassen).toFixed(2).replace(".", ",")} · Compleet: €{Number(a.price_compleet).toFixed(2).replace(".", ",")}</p>
            {!a.reservations_open && <p className="text-orange-600">⚠ Reserveringen gesloten</p>}
            {!a.volunteers_open   && <p className="text-orange-600">⚠ Vrijwilligers gesloten</p>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={() => onEdit(a)} disabled={loading}
            className="text-xs bg-stone-50 text-gray-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-100">
            Bewerken
          </button>
          {!a.is_active && !a.is_archived && (
            <button onClick={() => onActivate(a)} disabled={loading}
              className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">
              {loading ? "…" : "Activeer"}
            </button>
          )}
          <button onClick={() => onDuplicate(a)} disabled={loading}
            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100">
            {loading ? "…" : "Dupliceer"}
          </button>
          {!a.is_archived && (
            <button onClick={() => onArchive(a)} disabled={loading}
              className="text-xs bg-stone-50 text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-100">
              {loading ? "…" : "Archiveer"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
