"use client";

import { useState, useMemo } from "react";
import type { VolunteerSignup, PlanningStatus, FinalShift } from "@/lib/supabase/types";

// ─── Labels ──────────────────────────────────────────────────────────────────

const TASK_LABELS: Record<string, string> = {
  wassen:     "🚿 Auto's wassen",
  koffie:     "☕ Koffie schenken",
  friet:      "🍟 Friet & snacks",
  kinderhoek: "🎈 Kinderhoek",
  opbouwen:   "🔧 Op- en afbouwen",
  bakken:     "🎂 Bakken",
  spullen:    "📦 Spullen meenemen",
  sponsoring: "🤝 Sponsoring / verkopen",
  anders:     "✋ Iets anders",
  reserve:    "🔔 Reserve / oproepbaar",
  not_needed: "❌ Niet nodig",
};

const FINAL_TASK_OPTIONS = [
  { value: "",          label: "— Nog niet ingepland —" },
  { value: "wassen",    label: "Auto's wassen" },
  { value: "koffie",    label: "Koffie schenken" },
  { value: "friet",     label: "Friet & snacks" },
  { value: "kinderhoek",label: "Kinderhoek" },
  { value: "opbouwen",  label: "Op- en afbouwen" },
  { value: "bakken",    label: "Bakken" },
  { value: "spullen",   label: "Spullen meenemen" },
  { value: "sponsoring",label: "Sponsoring / verkopen" },
  { value: "reserve",   label: "Reserve / oproepbaar" },
  { value: "not_needed",label: "Niet nodig" },
];

const AVAIL_LABELS: Record<string, string> = {
  full_day:  "Hele dag",
  morning:   "Ochtend",
  afternoon: "Middag",
};

const SHIFT_OPTIONS: { value: FinalShift; label: string }[] = [
  { value: "not_chosen", label: "— Nog niet gekozen —" },
  { value: "morning",    label: "Ochtend (09:00 – 12:30)" },
  { value: "afternoon",  label: "Middag (12:30 – 16:00)" },
  { value: "full_day",   label: "Hele dag (09:00 – 16:00)" },
  { value: "specific",   label: "Specifieke tijd" },
];

const PLANNING_STATUS_OPTIONS: { value: PlanningStatus; label: string }[] = [
  { value: "new",              label: "Nieuw" },
  { value: "review",           label: "Te beoordelen" },
  { value: "planned",          label: "Ingepland" },
  { value: "assignment_sent",  label: "Bevestiging verstuurd" },
  { value: "cancelled",        label: "Afgezegd" },
  { value: "reserve",          label: "Reserve" },
  { value: "not_needed",       label: "Niet nodig" },
];

const STATUS_BADGE: Record<string, string> = {
  new:             "bg-gray-100 text-gray-600",
  review:          "bg-yellow-100 text-yellow-800",
  planned:         "bg-blue-100 text-blue-800",
  assignment_sent: "bg-green-100 text-green-700",
  cancelled:       "bg-red-100 text-red-700",
  reserve:         "bg-orange-100 text-orange-700",
  not_needed:      "bg-stone-100 text-stone-500",
};

const STATUS_LABEL: Record<string, string> = {
  new:             "Nieuw",
  review:          "Te beoordelen",
  planned:         "Ingepland",
  assignment_sent: "Bevestiging verstuurd",
  cancelled:       "Afgezegd",
  reserve:         "Reserve",
  not_needed:      "Niet nodig",
};

function shiftLabel(s: VolunteerSignup): string {
  if (!s.final_shift || s.final_shift === "not_chosen") return "—";
  if (s.final_shift === "specific" && s.final_start_time && s.final_end_time) {
    return `${s.final_start_time.slice(0,5)}–${s.final_end_time.slice(0,5)}`;
  }
  return SHIFT_OPTIONS.find(o => o.value === s.final_shift)?.label ?? s.final_shift;
}

const COST_LABELS: Record<string, string> = {
  eigen_kosten:       "Eigen kosten",
  vergoeding_gewenst: "Vergoeding gewenst",
  gesponsord:         "Gesponsord",
  weet_ik_nog_niet:   "Weet ik nog niet",
};

function parseContrib(details: string | null, key: string): string | null {
  if (!details) return null;
  const line = details.split("\n").find(l => l.toLowerCase().startsWith(key.toLowerCase() + ":"));
  return line ? line.slice(key.length + 1).trim() : null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type EditState = {
  final_tasks: string[];
  final_shift: FinalShift;
  final_start_time: string;
  final_end_time: string;
  internal_note: string;
  planning_status: PlanningStatus;
};

type Tab = "lijst" | "planning" | "bakken" | "spullen";

// ─── Component ────────────────────────────────────────────────────────────────

export default function VrijwilligersClient({ initialRows }: { initialRows: VolunteerSignup[] }) {
  const [rows,         setRows]         = useState<VolunteerSignup[]>(initialRows);
  const [activeTab,    setActiveTab]    = useState<Tab>("lijst");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editVolunteer,setEditVolunteer]= useState<VolunteerSignup | null>(null);
  const [editState,    setEditState]    = useState<EditState>({
    final_tasks: [], final_shift: "not_chosen",
    final_start_time: "", final_end_time: "",
    internal_note: "", planning_status: "new",
  });
  const [saving,       setSaving]       = useState(false);
  const [emailSending, setEmailSending] = useState<string | null>(null);
  const [emailError,   setEmailError]   = useState<string | null>(null);
  const [saveError,    setSaveError]    = useState<string | null>(null);

  // Filters
  const [fStatus,      setFStatus]      = useState("");
  const [fTask,        setFTask]        = useState("");
  const [fFinalTask,   setFFinalTask]   = useState("");
  const [fOnlyUnplanned, setFOnlyUnplanned] = useState(false);
  const [fOnlyNoEmail, setFOnlyNoEmail] = useState(false);
  const [fBakkers,     setFBakkers]     = useState(false);
  const [fSpullen,     setFSpullen]     = useState(false);

  function openEdit(v: VolunteerSignup) {
    setEditVolunteer(v);
    setEditState({
      final_tasks:      v.final_tasks      ?? [],
      final_shift:      (v.final_shift     ?? "not_chosen") as FinalShift,
      final_start_time: v.final_start_time ?? "",
      final_end_time:   v.final_end_time   ?? "",
      internal_note:    v.internal_note    ?? "",
      planning_status:  (v.planning_status ?? "new") as PlanningStatus,
    });
    setSaveError(null);
    setModalOpen(true);
  }

  function toggleFinalTask(t: string) {
    setEditState(p => ({
      ...p,
      final_tasks: p.final_tasks.includes(t)
        ? p.final_tasks.filter(x => x !== t)
        : [...p.final_tasks, t],
    }));
  }

  async function handleSave() {
    if (!editVolunteer) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/vrijwilligers/${editVolunteer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editState),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fout");
      setRows(rows.map(r => r.id === editVolunteer.id ? { ...r, ...editState } : r));
      setModalOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Opslaan mislukt.");
    }
    setSaving(false);
  }

  async function handleSendEmail(v: VolunteerSignup) {
    setEmailSending(v.id);
    setEmailError(null);
    try {
      const res = await fetch(`/api/vrijwilligers/${v.id}/indelingsmail`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fout");
      const sentAt = json.sent_at ?? new Date().toISOString();
      setRows(rows.map(r => r.id === v.id ? {
        ...r,
        planning_status:          "assignment_sent" as PlanningStatus,
        assignment_email_sent:    true,
        assignment_email_sent_at: sentAt,
      } : r));
    } catch (err) {
      setEmailError(`${v.full_name}: ${err instanceof Error ? err.message : "Fout"}`);
    }
    setEmailSending(null);
  }

  // ─── Filtered rows ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => rows.filter(r => {
    if (fStatus && r.planning_status !== fStatus) return false;
    if (fTask && !r.selected_tasks?.includes(fTask)) return false;
    if (fFinalTask && !r.final_tasks?.includes(fFinalTask)) return false;
    if (fOnlyUnplanned && r.final_tasks?.length > 0) return false;
    if (fOnlyNoEmail && r.assignment_email_sent) return false;
    if (fBakkers && !r.selected_tasks?.includes("bakken") && !r.final_tasks?.includes("bakken")) return false;
    if (fSpullen && !r.selected_tasks?.some(t => ["spullen","sponsoring"].includes(t)) &&
                   !r.final_tasks?.some(t => ["spullen","sponsoring"].includes(t))) return false;
    return true;
  }), [rows, fStatus, fTask, fFinalTask, fOnlyUnplanned, fOnlyNoEmail, fBakkers, fSpullen]);

  // ─── Baklijst ───────────────────────────────────────────────────────────────

  const bakkers = useMemo(() => rows.filter(r =>
    r.selected_tasks?.includes("bakken") || r.final_tasks?.includes("bakken")
  ), [rows]);

  const spullenRows = useMemo(() => rows.filter(r =>
    r.selected_tasks?.some(t => ["spullen","sponsoring"].includes(t)) ||
    r.final_tasks?.some(t => ["spullen","sponsoring"].includes(t))
  ), [rows]);

  // ─── Planning per taak ──────────────────────────────────────────────────────

  const taskGroups = useMemo(() => {
    const groups: Record<string, VolunteerSignup[]> = { "": [] };
    FINAL_TASK_OPTIONS.slice(1).forEach(o => { groups[o.value] = []; });
    rows.forEach(r => {
      if (!r.final_tasks || r.final_tasks.length === 0) {
        groups[""].push(r);
      } else {
        r.final_tasks.forEach(t => {
          if (!groups[t]) groups[t] = [];
          groups[t].push(r);
        });
      }
    });
    return groups;
  }, [rows]);

  const fc  = "w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-green-950 focus:outline-none focus:border-green-600 transition-colors";
  const lbl = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1";

  // ─── Tabs ───────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "lijst",    label: "Aanmeldingen", count: rows.length },
    { key: "planning", label: "Planning per taak" },
    { key: "bakken",   label: "Baklijst",    count: bakkers.length },
    { key: "spullen",  label: "Spullen & sponsoring", count: spullenRows.length },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vrijwilligers</h1>
          <p className="text-gray-400 text-sm">{rows.length} aanmeldingen</p>
        </div>
      </div>

      {emailError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm flex items-center justify-between">
          {emailError}
          <button onClick={() => setEmailError(null)} className="ml-4 text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === t.key ? "bg-white border border-b-white border-stone-200 text-green-800 -mb-px" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}{t.count !== undefined ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {/* ── Tab: Aanmeldingen ─────────────────────────────────────────────────── */}
      {activeTab === "lijst" && (
        <div className="space-y-4">

          {/* Filters */}
          <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={lbl}>Status</label>
              <select value={fStatus} onChange={e => setFStatus(e.target.value)} className={fc}>
                <option value="">Alle statussen</option>
                {PLANNING_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Voorkeur</label>
              <select value={fTask} onChange={e => setFTask(e.target.value)} className={fc}>
                <option value="">Alle voorkeuren</option>
                {FINAL_TASK_OPTIONS.slice(1).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Definitieve taak</label>
              <select value={fFinalTask} onChange={e => setFFinalTask(e.target.value)} className={fc}>
                <option value="">Alle taken</option>
                {FINAL_TASK_OPTIONS.slice(1).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={fOnlyUnplanned} onChange={e => setFOnlyUnplanned(e.target.checked)} className="rounded" />
                Nog niet ingepland
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={fOnlyNoEmail} onChange={e => setFOnlyNoEmail(e.target.checked)} className="rounded" />
                Bevestiging niet verstuurd
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={fBakkers} onChange={e => setFBakkers(e.target.checked)} className="rounded" />
                Alleen bakkers
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input type="checkbox" checked={fSpullen} onChange={e => setFSpullen(e.target.checked)} className="rounded" />
                Alleen spullen/sponsoring
              </label>
            </div>
          </div>

          <p className="text-xs text-gray-400">{filtered.length} resultaten</p>

          {/* Tabel */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-stone-100">
                  <tr>
                    {["Naam","Beschikbaarheid","Opgegeven voorkeuren","Definitieve taak","Tijd/dagdeel","Status","Mail","Ingediend","Acties"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {filtered.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 whitespace-nowrap">{r.full_name}</p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                        {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{AVAIL_LABELS[r.availability] ?? r.availability}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(r.selected_tasks ?? []).map(t => (
                            <span key={t} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {TASK_LABELS[t]?.replace(/^[^ ]+ /, "") ?? t}
                            </span>
                          ))}
                        </div>
                        {r.contribution_details && (
                          <p className="text-xs text-gray-400 mt-1 max-w-xs">{r.contribution_details}</p>
                        )}
                        {r.cost_preference && (
                          <span className={`inline-block mt-1 text-xs font-medium px-1.5 py-0.5 rounded ${r.cost_preference === "vergoeding_gewenst" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-500"}`}>
                            {COST_LABELS[r.cost_preference] ?? r.cost_preference}
                          </span>
                        )}
                        {r.notes && <p className="text-xs text-gray-300 mt-0.5 italic">{r.notes}</p>}
                      </td>
                      <td className="px-4 py-3">
                        {r.final_tasks && r.final_tasks.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {r.final_tasks.map(t => (
                              <span key={t} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                {TASK_LABELS[t]?.replace(/^[^ ]+ /, "") ?? t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Nog niet ingepland</span>
                        )}
                        {r.internal_note && (
                          <p className="text-xs text-amber-600 mt-1 max-w-xs">📝 {r.internal_note}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{shiftLabel(r)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[r.planning_status ?? "new"] ?? "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABEL[r.planning_status ?? "new"] ?? r.planning_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {r.assignment_email_sent ? (
                          <span className="text-green-600">
                            ✓ {r.assignment_email_sent_at ? new Date(r.assignment_email_sent_at).toLocaleDateString("nl-NL") : "verzonden"}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("nl-NL")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 whitespace-nowrap">
                          <button onClick={() => openEdit(r)}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                            Indelen
                          </button>
                          <button
                            onClick={() => handleSendEmail(r)}
                            disabled={emailSending === r.id}
                            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50">
                            {emailSending === r.id ? "…" : "✉ Indeling"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Geen aanmeldingen gevonden</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Planning per taak ──────────────────────────────────────────── */}
      {activeTab === "planning" && (
        <div className="space-y-6">
          {[...FINAL_TASK_OPTIONS.slice(1), { value: "", label: "Nog niet ingepland" }].map(opt => {
            const group = taskGroups[opt.value] ?? [];
            if (group.length === 0) return null;
            return (
              <div key={opt.value} className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">{opt.label}</h3>
                  <span className="text-xs text-gray-400">{group.length} personen</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {["Naam","Telefoon","E-mail","Tijd/dagdeel","Status","Notitie"].map(h => (
                          <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {group.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">
                            <button onClick={() => openEdit(r)} className="hover:text-green-700">{r.full_name}</button>
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{r.phone ?? "—"}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{r.email}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">{shiftLabel(r)}</td>
                          <td className="px-4 py-2">
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[r.planning_status ?? "new"] ?? ""}`}>
                              {STATUS_LABEL[r.planning_status ?? "new"]}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-amber-600 max-w-xs truncate">{r.internal_note ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Tab: Baklijst ───────────────────────────────────────────────────── */}
      {activeTab === "bakken" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-stone-100">
                <tr>
                  {["Naam","Telefoon","Wat wordt gebakken","Kosten/gesponsord","Status","Interne notitie","Acties"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {bakkers.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{r.full_name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{r.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">{parseContrib(r.contribution_details, "Bakken") ?? "—"}</td>
                    <td className="px-4 py-3">
                      {r.cost_preference ? (
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${r.cost_preference === "vergoeding_gewenst" ? "bg-amber-100 text-amber-800" : "bg-stone-100 text-stone-600"}`}>
                          {COST_LABELS[r.cost_preference] ?? r.cost_preference}
                        </span>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[r.planning_status ?? "new"] ?? ""}`}>
                        {STATUS_LABEL[r.planning_status ?? "new"]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-amber-600 max-w-xs">{r.internal_note ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openEdit(r)} className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">Indelen</button>
                    </td>
                  </tr>
                ))}
                {bakkers.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Geen bakkers gevonden</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Spullen & Sponsoring ───────────────────────────────────────── */}
      {activeTab === "spullen" && (
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-stone-100">
                <tr>
                  {["Naam","Telefoon","Type","Omschrijving","Status","Interne notitie","Acties"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {spullenRows.map(r => {
                  const spul  = parseContrib(r.contribution_details, "Spullen");
                  const spons = parseContrib(r.contribution_details, "Sponsoring");
                  const types = r.selected_tasks?.filter(t => ["spullen","sponsoring"].includes(t)).map(t => TASK_LABELS[t]?.replace(/^[^ ]+ /, "") ?? t).join(", ") || "—";
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.full_name}</p>
                        <p className="text-xs text-gray-400">{r.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{r.phone ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{types}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs">
                        {spul  && <p>📦 {spul}</p>}
                        {spons && <p>🤝 {spons}</p>}
                        {!spul && !spons && <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[r.planning_status ?? "new"] ?? ""}`}>
                          {STATUS_LABEL[r.planning_status ?? "new"]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-amber-600 max-w-xs">{r.internal_note ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openEdit(r)} className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">Indelen</button>
                      </td>
                    </tr>
                  );
                })}
                {spullenRows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Geen aanmeldingen gevonden</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal: Bewerken / Indelen ─────────────────────────────────────────── */}
      {modalOpen && editVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{editVolunteer.full_name}</h2>
                <p className="text-xs text-gray-400">{editVolunteer.email}{editVolunteer.phone ? ` · ${editVolunteer.phone}` : ""}</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-6">

              {/* Opgegeven voorkeuren (readonly) */}
              <div className="bg-stone-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Opgegeven voorkeuren</p>
                <div className="flex flex-wrap gap-1">
                  {(editVolunteer.selected_tasks ?? []).map(t => (
                    <span key={t} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
                      {TASK_LABELS[t]?.replace(/^[^ ]+ /, "") ?? t}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Beschikbaarheid: <strong>{AVAIL_LABELS[editVolunteer.availability] ?? editVolunteer.availability}</strong>
                </p>
                {editVolunteer.contribution_details && (
                  <p className="text-xs text-gray-500">{editVolunteer.contribution_details}</p>
                )}
                {editVolunteer.cost_preference && (
                  <p className="text-xs">
                    <span className="font-semibold text-green-700">Kosten bakken: </span>
                    <span className={`font-medium ${editVolunteer.cost_preference === "vergoeding_gewenst" ? "text-amber-700" : "text-gray-600"}`}>
                      {COST_LABELS[editVolunteer.cost_preference] ?? editVolunteer.cost_preference}
                    </span>
                  </p>
                )}
                {editVolunteer.notes && (
                  <p className="text-xs text-gray-400 italic">{editVolunteer.notes}</p>
                )}
              </div>

              {/* A. Definitieve taak */}
              <div>
                <label className={lbl}>A. Definitieve taak (meerdere mogelijk)</label>
                <div className="grid grid-cols-2 gap-1.5 mt-1">
                  {FINAL_TASK_OPTIONS.slice(1).map(opt => (
                    <label key={opt.value} className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer text-sm transition-colors ${editState.final_tasks.includes(opt.value) ? "border-green-600 bg-green-50 text-green-800" : "border-stone-200 text-gray-600 hover:border-green-300"}`}>
                      <input type="checkbox" className="sr-only" checked={editState.final_tasks.includes(opt.value)} onChange={() => toggleFinalTask(opt.value)} />
                      <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${editState.final_tasks.includes(opt.value) ? "border-green-600 bg-green-600" : "border-stone-300"}`}>
                        {editState.final_tasks.includes(opt.value) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </span>
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* B. Definitief dagdeel */}
              <div>
                <label className={lbl}>B. Definitief dagdeel / tijd</label>
                <select value={editState.final_shift} onChange={e => setEditState(p => ({ ...p, final_shift: e.target.value as FinalShift }))} className={fc}>
                  {SHIFT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {editState.final_shift === "specific" && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className={lbl}>Van</label>
                      <input type="time" value={editState.final_start_time} onChange={e => setEditState(p => ({ ...p, final_start_time: e.target.value }))} className={fc} />
                    </div>
                    <div>
                      <label className={lbl}>Tot</label>
                      <input type="time" value={editState.final_end_time} onChange={e => setEditState(p => ({ ...p, final_end_time: e.target.value }))} className={fc} />
                    </div>
                  </div>
                )}
              </div>

              {/* C. Interne notitie */}
              <div>
                <label className={lbl}>C. Interne notitie (alleen zichtbaar voor organisatie)</label>
                <textarea rows={3} value={editState.internal_note}
                  onChange={e => setEditState(p => ({ ...p, internal_note: e.target.value }))}
                  placeholder="Bijvoorbeeld: handig bij kinderhoek, liever niet bij friet, neemt 2 cakes mee, heeft emmers beschikbaar."
                  className={`${fc} resize-none`} />
              </div>

              {/* D. Status */}
              <div>
                <label className={lbl}>D. Planningsstatus</label>
                <select value={editState.planning_status} onChange={e => setEditState(p => ({ ...p, planning_status: e.target.value as PlanningStatus }))} className={fc}>
                  {PLANNING_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {/* Communicatie (readonly) */}
              <div className="bg-stone-50 rounded-2xl p-4 space-y-1">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">Communicatie</p>
                <p className="text-xs text-gray-500">
                  Indelingsmail: {editVolunteer.assignment_email_sent
                    ? `✓ verzonden op ${editVolunteer.assignment_email_sent_at ? new Date(editVolunteer.assignment_email_sent_at).toLocaleString("nl-NL") : "—"}`
                    : "Nog niet verstuurd"}
                </p>
              </div>

              {saveError && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{saveError}</p>}

              {/* Acties */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-green-800 text-white font-semibold rounded-full py-3 hover:bg-green-900 transition-colors disabled:opacity-50">
                  {saving ? "Opslaan…" : "Opslaan"}
                </button>
                <button
                  onClick={() => { setModalOpen(false); handleSendEmail(editVolunteer); }}
                  disabled={emailSending === editVolunteer.id}
                  className="flex-1 bg-blue-600 text-white font-semibold rounded-full py-3 hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {emailSending === editVolunteer.id ? "Verzenden…" : "✉ Indelingsmail sturen"}
                </button>
                <button onClick={() => setModalOpen(false)} className="px-5 py-3 border border-stone-200 rounded-full text-gray-600 hover:bg-stone-50 transition-colors text-sm">
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
