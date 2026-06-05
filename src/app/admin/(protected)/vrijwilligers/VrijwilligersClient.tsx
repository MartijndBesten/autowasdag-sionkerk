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

const TASK_LABELS_PLAIN: Record<string, string> = {
  wassen:     "Auto's wassen",
  koffie:     "Koffie schenken",
  friet:      "Friet & snacks",
  kinderhoek: "Kinderhoek",
  opbouwen:   "Op- en afbouwen",
  bakken:     "Bakken",
  spullen:    "Spullen meenemen",
  sponsoring: "Sponsoring / verkopen",
  anders:     "Iets anders",
  reserve:    "Reserve / oproepbaar",
  not_needed: "Niet nodig",
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

const COST_LABELS: Record<string, string> = {
  eigen_kosten:       "Eigen kosten",
  vergoeding_gewenst: "Vergoeding gewenst",
  gesponsord:         "Gesponsord",
  weet_ik_nog_niet:   "Weet ik nog niet",
};

function shiftLabel(s: VolunteerSignup): string {
  if (!s.final_shift || s.final_shift === "not_chosen") return "—";
  if (s.final_shift === "specific" && s.final_start_time && s.final_end_time) {
    return `${s.final_start_time.slice(0,5)}–${s.final_end_time.slice(0,5)}`;
  }
  return SHIFT_OPTIONS.find(o => o.value === s.final_shift)?.label ?? s.final_shift;
}

function parseContrib(details: string | null, key: string): string | null {
  if (!details) return null;
  const line = details.split("\n").find(l => l.toLowerCase().startsWith(key.toLowerCase() + ":"));
  return line ? line.slice(key.length + 1).trim() : null;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function csvCell(v: string | null | undefined): string {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

function generateCsv(rows: VolunteerSignup[], internal: boolean, suppliesLabels: Record<string, string>): string {
  const BOM = "﻿";
  const SEP = ";";

  const headers = internal
    ? ["Naam","E-mailadres","Telefoon","Beschikbaarheid","Opgegeven voorkeuren","Definitieve taak","Tijd/dagdeel","Status","Wat wordt gebakken","Meegenomen spullen","Kosten/sponsoring","Notitie vrijwilliger","Interne notitie","Indieningsdatum"]
    : ["Naam","Beschikbaarheid","Opgegeven voorkeuren","Definitieve taak","Tijd/dagdeel","Status","Wat wordt gebakken","Meegenomen spullen","Indieningsdatum"];

  const dataRows = rows.map(r => {
    const selectedTasksStr = (r.selected_tasks ?? []).map(t => TASK_LABELS_PLAIN[t] ?? t).join(", ");
    const finalTasksStr    = (r.final_tasks   ?? []).map(t => TASK_LABELS_PLAIN[t] ?? t).join(", ");
    const suppliesStr      = (r.selected_supplies ?? []).map(s => suppliesLabels[s] ?? s).join(", ");
    const bakkenStr        = parseContrib(r.contribution_details, "Bakken") ?? "";
    const costStr          = COST_LABELS[r.cost_preference ?? ""] ?? (r.cost_preference ?? "");
    const dateStr          = new Date(r.created_at).toLocaleDateString("nl-NL");

    if (internal) {
      return [
        r.full_name,
        r.email,
        r.phone ?? "",
        AVAIL_LABELS[r.availability] ?? r.availability,
        selectedTasksStr,
        finalTasksStr,
        shiftLabel(r),
        STATUS_LABEL[r.planning_status ?? "new"] ?? (r.planning_status ?? ""),
        bakkenStr,
        suppliesStr,
        costStr,
        r.notes ?? "",
        r.internal_note ?? "",
        dateStr,
      ].map(csvCell).join(SEP);
    } else {
      return [
        r.full_name,
        AVAIL_LABELS[r.availability] ?? r.availability,
        selectedTasksStr,
        finalTasksStr,
        shiftLabel(r),
        STATUS_LABEL[r.planning_status ?? "new"] ?? (r.planning_status ?? ""),
        bakkenStr,
        suppliesStr,
        dateStr,
      ].map(csvCell).join(SEP);
    }
  });

  return BOM + [headers.map(csvCell).join(SEP), ...dataRows].join("\r\n");
}

function downloadCsv(rows: VolunteerSignup[], internal: boolean, suppliesLabels: Record<string, string>) {
  const csv      = generateCsv(rows, internal, suppliesLabels);
  const blob     = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url      = URL.createObjectURL(blob);
  const filename = internal ? "autowasdag-interne-planning.csv" : "autowasdag-vrijwilligersoverzicht.csv";
  const a        = document.createElement("a");
  a.href         = url;
  a.download     = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Print helpers ────────────────────────────────────────────────────────────

function openPrintWindow(rows: VolunteerSignup[], suppliesLabels: Record<string, string>) {
  const shiftGroups: { label: string; shift: string | null }[] = [
    { label: "Hele dag (09:00 – 16:00)", shift: "full_day" },
    { label: "Ochtend (09:00 – 12:30)",  shift: "morning"  },
    { label: "Middag (12:30 – 16:00)",   shift: "afternoon"},
    { label: "Specifieke tijd / anders", shift: "specific"  },
    { label: "Nog niet ingepland",       shift: null        },
  ];

  const planned = rows.filter(r => !["cancelled","not_needed"].includes(r.planning_status ?? ""));

  let html = `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8">
<title>Dagplanning Autowasdag</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; margin: 20mm; color: #111; }
  h1   { font-size: 16pt; margin-bottom: 4px; }
  h2   { font-size: 13pt; margin-top: 20px; margin-bottom: 6px; border-bottom: 1px solid #aaa; padding-bottom: 3px; color: #1a4731; }
  h3   { font-size: 11pt; margin-top: 14px; margin-bottom: 4px; color: #555; }
  table{ width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10pt; }
  th   { background: #f0f0f0; text-align: left; padding: 4px 8px; font-size: 9pt; font-weight: 600; border-bottom: 1px solid #ccc; }
  td   { padding: 4px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  .badge { display:inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9pt; }
  .planned { background:#dbeafe; color:#1e40af; }
  .sent    { background:#dcfce7; color:#166534; }
  .reserve { background:#fed7aa; color:#9a3412; }
  .new     { background:#f3f4f6; color:#374151; }
  @page { size: A4; margin: 15mm; }
  @media print { body { margin: 0; } }
</style></head><body>`;

  html += `<h1>Dagplanning Autowasdag Sionkerk Houten</h1>
<p style="color:#666;font-size:10pt;margin-bottom:16px;">Gegenereerd op ${new Date().toLocaleDateString("nl-NL", { day:"numeric", month:"long", year:"numeric" })} &mdash; ${planned.length} vrijwilligers</p>`;

  for (const sg of shiftGroups) {
    const shiftRows = planned.filter(r => {
      if (sg.shift === null) return !r.final_shift || r.final_shift === "not_chosen";
      if (sg.shift === "specific") return r.final_shift === "specific";
      return r.final_shift === sg.shift;
    });
    if (shiftRows.length === 0) continue;

    html += `<h2>${sg.label} &mdash; ${shiftRows.length} persoon/personen</h2>`;

    const taskMap: Record<string, VolunteerSignup[]> = {};
    for (const r of shiftRows) {
      const tasks = r.final_tasks?.length ? r.final_tasks : ["__onbekend__"];
      for (const t of tasks) {
        if (!taskMap[t]) taskMap[t] = [];
        taskMap[t].push(r);
      }
    }

    for (const [taskKey, taskRows] of Object.entries(taskMap)) {
      const taskLabel = taskKey === "__onbekend__" ? "Nog niet toegewezen" : (TASK_LABELS_PLAIN[taskKey] ?? taskKey);
      html += `<h3>${taskLabel} (${taskRows.length})</h3>
<table><thead><tr><th>Naam</th><th>Telefoon</th><th>Status</th><th>Spullen</th><th>Extra info</th></tr></thead><tbody>`;
      for (const r of taskRows) {
        const supplies = (r.selected_supplies ?? []).map(s => suppliesLabels[s] ?? s).join(", ");
        const bakken   = parseContrib(r.contribution_details, "Bakken");
        const extra    = [bakken ? `Bakt: ${bakken}` : "", r.notes ?? ""].filter(Boolean).join(" | ");
        const badgeMap: Record<string, string> = { planned:"planned", assignment_sent:"sent", reserve:"reserve" };
        const badgeCls = badgeMap[r.planning_status ?? ""] ?? "new";
        const statusLbl = STATUS_LABEL[r.planning_status ?? "new"] ?? r.planning_status ?? "";
        html += `<tr>
  <td><strong>${r.full_name}</strong></td>
  <td>${r.phone ?? "—"}</td>
  <td><span class="badge ${badgeCls}">${statusLbl}</span></td>
  <td>${supplies || "—"}</td>
  <td style="color:#666;font-size:9pt;">${extra || "—"}</td>
</tr>`;
      }
      html += `</tbody></table>`;
    }
  }

  html += `</body></html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
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

type Tab = "lijst" | "planning" | "bakken" | "spullen" | "export" | "afdrukken";

const STANDAARD_MAILTEKST = `Beste vrijwilliger,

De indeling voor de autowasdag van de Sionkerk Houten is rond!

Je vindt je taak en tijd terug in de bijlage of in het overzicht dat we meesturen. Lees dit even goed door zodat je weet waar je moet zijn en wanneer.

Heb je vragen of kan je onverhoopt toch niet komen? Reageer dan zo snel mogelijk op dit bericht, dan kunnen we tijdig iets regelen.

Tot dan en alvast bedankt voor je inzet!

Hartelijke groet,
De organisatie van de autowasdag
Sionkerk Houten`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function VrijwilligersClient({ initialRows, suppliesOptions }: { initialRows: VolunteerSignup[]; suppliesOptions: { value: string; label: string }[] }) {
  const SUPPLIES_LABELS = Object.fromEntries(suppliesOptions.map(o => [o.value, o.label]));
  const [rows,          setRows]          = useState<VolunteerSignup[]>(initialRows);
  const [activeTab,     setActiveTab]     = useState<Tab>("lijst");
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editVolunteer, setEditVolunteer] = useState<VolunteerSignup | null>(null);
  const [editState,     setEditState]     = useState<EditState>({
    final_tasks: [], final_shift: "not_chosen",
    final_start_time: "", final_end_time: "",
    internal_note: "", planning_status: "new",
  });
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<VolunteerSignup | null>(null);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [copiedKey,     setCopiedKey]     = useState<string | null>(null);

  // Filters
  const [fStatus,        setFStatus]        = useState("");
  const [fTask,          setFTask]          = useState("");
  const [fFinalTask,     setFFinalTask]     = useState("");
  const [fOnlyUnplanned, setFOnlyUnplanned] = useState(false);
  const [fBakkers,       setFBakkers]       = useState(false);
  const [fSpullen,       setFSpullen]       = useState(false);

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

  async function handleDelete() {
    if (!deleteConfirm) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/vrijwilligers/${deleteConfirm.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fout");
      setRows(rows.filter(r => r.id !== deleteConfirm.id));
      setDeleteSuccess(`${deleteConfirm.full_name} is verwijderd.`);
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Verwijderen mislukt.");
    }
    setDeleting(false);
  }

  async function copyEmails(emailList: string[], key: string) {
    if (emailList.length === 0) return;
    await navigator.clipboard.writeText(emailList.join("; "));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  }

  // ─── Filtered rows ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => rows.filter(r => {
    if (fStatus && r.planning_status !== fStatus) return false;
    if (fTask && !r.selected_tasks?.includes(fTask)) return false;
    if (fFinalTask && !r.final_tasks?.includes(fFinalTask)) return false;
    if (fOnlyUnplanned && r.final_tasks?.length > 0) return false;
    if (fBakkers && !r.selected_tasks?.includes("bakken") && !r.final_tasks?.includes("bakken")) return false;
    if (fSpullen && !r.selected_tasks?.some(t => ["spullen","sponsoring"].includes(t)) &&
                   !r.final_tasks?.some(t => ["spullen","sponsoring"].includes(t))) return false;
    return true;
  }), [rows, fStatus, fTask, fFinalTask, fOnlyUnplanned, fBakkers, fSpullen]);

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

  // ─── Export helpers ──────────────────────────────────────────────────────────

  const plannedRows = useMemo(() =>
    rows.filter(r => ["planned","assignment_sent"].includes(r.planning_status ?? "")),
  [rows]);

  const emailGroups = useMemo(() => {
    const all       = plannedRows.map(r => r.email);
    const morning   = plannedRows.filter(r => r.final_shift === "morning").map(r => r.email);
    const afternoon = plannedRows.filter(r => r.final_shift === "afternoon").map(r => r.email);
    const fullDay   = plannedRows.filter(r => r.final_shift === "full_day").map(r => r.email);
    const byTask: { key: string; label: string; emails: string[] }[] = FINAL_TASK_OPTIONS.slice(1)
      .map(o => ({
        key:    o.value,
        label:  o.label,
        emails: plannedRows.filter(r => r.final_tasks?.includes(o.value)).map(r => r.email),
      }))
      .filter(g => g.emails.length > 0);
    return { all, morning, afternoon, fullDay, byTask };
  }, [plannedRows]);

  const fc  = "w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-green-950 focus:outline-none focus:border-green-600 transition-colors";
  const lbl = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1";

  // ─── Tabs ───────────────────────────────────────────────────────────────────

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "lijst",     label: "Aanmeldingen",         count: rows.length },
    { key: "planning",  label: "Planning per taak" },
    { key: "bakken",    label: "Baklijst",             count: bakkers.length },
    { key: "spullen",   label: "Spullen & sponsoring", count: spullenRows.length },
    { key: "export",    label: "Exporteren & mailen" },
    { key: "afdrukken", label: "Afdrukken" },
  ];

  // ─── Copy button ─────────────────────────────────────────────────────────────

  function CopyBtn({ emails, label, btnKey }: { emails: string[]; label: string; btnKey: string }) {
    const copied = copiedKey === btnKey;
    return (
      <button
        onClick={() => copyEmails(emails, btnKey)}
        disabled={emails.length === 0}
        className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed ${
          copied
            ? "bg-green-50 border-green-300 text-green-700"
            : "bg-white border-stone-200 text-gray-700 hover:bg-stone-50 hover:border-stone-300"
        }`}
      >
        <span>{copied ? "✓ Gekopieerd!" : "📋 " + label}</span>
        {emails.length > 0 && <span className="text-xs text-gray-400 font-normal">({emails.length})</span>}
      </button>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vrijwilligers</h1>
          <p className="text-gray-400 text-sm">{rows.length} aanmeldingen</p>
        </div>
      </div>

      {deleteSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-green-700 text-sm flex items-center justify-between">
          {deleteSuccess}
          <button onClick={() => setDeleteSuccess(null)} className="ml-4 text-green-400 hover:text-green-700">✕</button>
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm flex items-center justify-between">
          {deleteError}
          <button onClick={() => setDeleteError(null)} className="ml-4 text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* ── Actiewerkbalk ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">

        {/* Downloads + print */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-full sm:w-auto sm:mr-1">Downloaden</span>
          <button
            onClick={() => downloadCsv(rows, true, SUPPLIES_LABELS)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-green-800 text-white px-3 py-2 rounded-xl hover:bg-green-900 transition-colors"
          >
            ⬇ Interne planning <span className="font-normal opacity-75">({rows.length})</span>
          </button>
          <button
            onClick={() => downloadCsv(rows, false, SUPPLIES_LABELS)}
            className="flex items-center gap-1.5 text-xs font-semibold bg-stone-600 text-white px-3 py-2 rounded-xl hover:bg-stone-700 transition-colors"
          >
            ⬇ Vrijwilligersoverzicht <span className="font-normal opacity-75">({rows.length})</span>
          </button>
          <button
            onClick={() => downloadCsv(filtered, true, SUPPLIES_LABELS)}
            className="flex items-center gap-1.5 text-xs font-medium border border-stone-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
            title="Exporteer alleen de gefilterde rijen"
          >
            ⬇ Gefilterde selectie <span className="font-normal text-gray-400">({filtered.length})</span>
          </button>
          <button
            onClick={() => openPrintWindow(rows, SUPPLIES_LABELS)}
            className="flex items-center gap-1.5 text-xs font-medium border border-stone-200 text-gray-600 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
          >
            🖨 Dagplanning afdrukken
          </button>
        </div>

        {/* E-mailadressen */}
        <div className="border-t border-stone-100 pt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-full sm:w-auto sm:mr-1">E-mails kopiëren</span>
            <CopyBtn emails={emailGroups.all}       label="Alle ingeplande"   btnKey="tb-all" />
            <CopyBtn emails={emailGroups.morning}   label="Ochtend"           btnKey="tb-morning" />
            <CopyBtn emails={emailGroups.afternoon} label="Middag"            btnKey="tb-afternoon" />
            <CopyBtn emails={emailGroups.fullDay}   label="Hele dag"          btnKey="tb-fullday" />
            {emailGroups.byTask.map(g => (
              <CopyBtn key={g.key} emails={g.emails} label={g.label} btnKey={`tb-task-${g.key}`} />
            ))}
          </div>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex gap-1.5 items-start">
            <span className="flex-shrink-0">⚠️</span>
            <span><strong>Gebruik altijd BCC</strong> — zodat vrijwilligers elkaars e-mailadres niet zien.</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200 flex-wrap">
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
                    {["Naam","Beschikbaarheid","Opgegeven voorkeuren","Definitieve taak","Tijd/dagdeel","Status","Ingediend","Acties"].map(h => (
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
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("nl-NL")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 whitespace-nowrap flex-wrap">
                          <button onClick={() => openEdit(r)}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors">
                            Indelen
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(r)}
                            className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
                            Verwijderen
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Geen aanmeldingen gevonden</td></tr>
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
                <div className="px-5 py-3 bg-gray-50 border-b border-stone-100 flex items-center gap-3">
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
                  const spul            = parseContrib(r.contribution_details, "Spullen");
                  const spulAnders      = parseContrib(r.contribution_details, "SpullenAnders");
                  const spulToelichting = parseContrib(r.contribution_details, "SpullenToelichting");
                  const spons           = parseContrib(r.contribution_details, "Sponsoring");
                  const hasSupplies     = spul || spulAnders || spulToelichting || (r.selected_supplies?.length > 0);
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
                        {hasSupplies && (
                          <div className="space-y-0.5">
                            {r.selected_supplies?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {r.selected_supplies.map(s => (
                                  <span key={s} className="inline-block bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-1.5 py-0.5 rounded">
                                    {SUPPLIES_LABELS[s] ?? s}
                                  </span>
                                ))}
                              </div>
                            )}
                            {spul && !r.selected_supplies?.length && <p>📦 {spul}</p>}
                            {spulAnders      && <p>➕ {spulAnders}</p>}
                            {spulToelichting && <p className="text-gray-400 italic">{spulToelichting}</p>}
                          </div>
                        )}
                        {spons && <p>🤝 {spons}</p>}
                        {!hasSupplies && !spons && <span className="text-gray-300">—</span>}
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

      {/* ── Tab: Exporteren & mailen ────────────────────────────────────────── */}
      {activeTab === "export" && (
        <div className="space-y-8">

          {/* Downloads */}
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-bold text-gray-900 text-base mb-0.5">Downloads</h2>
              <p className="text-sm text-gray-500">Exporteer de vrijwilligerslijst als CSV-bestand dat direct in Excel te openen is.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="border border-stone-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  <p className="font-semibold text-gray-800 text-sm">Download interne planning</p>
                </div>
                <p className="text-xs text-gray-500">Inclusief e-mailadressen, telefoonnummers en interne notities. <strong>Alleen voor organisatiegebruik.</strong></p>
                <button
                  onClick={() => downloadCsv(rows, true, SUPPLIES_LABELS)}
                  className="w-full mt-2 bg-green-800 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-green-900 transition-colors"
                >
                  ⬇ Download interne planning ({rows.length})
                </button>
              </div>
              <div className="border border-stone-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📄</span>
                  <p className="font-semibold text-gray-800 text-sm">Download vrijwilligersoverzicht</p>
                </div>
                <p className="text-xs text-gray-500">Zonder e-mailadressen en interne notities. Geschikt om te printen of te delen met helpers.</p>
                <button
                  onClick={() => downloadCsv(rows, false, SUPPLIES_LABELS)}
                  className="w-full mt-2 bg-stone-700 text-white text-sm font-semibold rounded-xl py-2.5 hover:bg-stone-800 transition-colors"
                >
                  ⬇ Download vrijwilligersoverzicht ({rows.length})
                </button>
              </div>
            </div>
          </div>

          {/* BCC-waarschuwing */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex gap-3">
            <span className="text-amber-500 text-xl flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm mb-0.5">Gebruik altijd BCC bij het mailen aan meerdere vrijwilligers</p>
              <p className="text-amber-700 text-sm">Plak e-mailadressen in het BCC-veld van je eigen mailprogramma (niet aan of CC), zodat vrijwilligers elkaars e-mailadres niet kunnen zien. Dit is verplicht vanuit privacyoverwegingen.</p>
            </div>
          </div>

          {/* E-mailadressen kopiëren */}
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-bold text-gray-900 text-base mb-0.5">E-mailadressen kopiëren</h2>
              <p className="text-sm text-gray-500">
                Klik op een groep om de e-mailadressen naar het klembord te kopiëren. Alleen vrijwilligers met status <strong>Ingepland</strong> of <strong>Bevestiging verstuurd</strong> worden meegenomen ({plannedRows.length} personen).
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Per dagdeel</p>
              <div className="flex flex-wrap gap-2">
                <CopyBtn emails={emailGroups.all}       label="Alle ingeplande vrijwilligers"  btnKey="all" />
                <CopyBtn emails={emailGroups.morning}   label="Alleen ochtend"                 btnKey="morning" />
                <CopyBtn emails={emailGroups.afternoon} label="Alleen middag"                  btnKey="afternoon" />
                <CopyBtn emails={emailGroups.fullDay}   label="Alleen hele dag"                btnKey="fullday" />
              </div>
            </div>

            {emailGroups.byTask.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Per definitieve taak</p>
                <div className="flex flex-wrap gap-2">
                  {emailGroups.byTask.map(g => (
                    <CopyBtn key={g.key} emails={g.emails} label={g.label} btnKey={`task-${g.key}`} />
                  ))}
                </div>
              </div>
            )}

            {plannedRows.length === 0 && (
              <p className="text-sm text-gray-400 italic">Geen ingeplande vrijwilligers gevonden. Zet vrijwilligers eerst op status &ldquo;Ingepland&rdquo; of &ldquo;Bevestiging verstuurd&rdquo;.</p>
            )}
          </div>

          {/* Standaardmailtekst */}
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-bold text-gray-900 text-base mb-0.5">Standaardmailtekst kopiëren</h2>
              <p className="text-sm text-gray-500">Kopieer deze mailtekst als startpunt voor je mail aan vrijwilligers. Pas hem aan naar eigen inzicht.</p>
            </div>
            <pre className="bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {STANDAARD_MAILTEKST}
            </pre>
            <button
              onClick={() => copyText(STANDAARD_MAILTEKST, "mailtekst")}
              className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border transition-colors font-medium ${
                copiedKey === "mailtekst"
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-white border-stone-200 text-gray-700 hover:bg-stone-50"
              }`}
            >
              {copiedKey === "mailtekst" ? "✓ Gekopieerd!" : "📋 Kopieer standaardmailtekst"}
            </button>
            <p className="text-xs text-gray-400">Tip: stuur de gedownloade CSV als bijlage mee zodat vrijwilligers hun taak en tijd in Excel kunnen terugvinden.</p>
          </div>
        </div>
      )}

      {/* ── Tab: Afdrukken ──────────────────────────────────────────────────── */}
      {activeTab === "afdrukken" && (
        <div className="space-y-6">
          <div className="bg-white border border-stone-100 rounded-2xl shadow-sm p-6 space-y-4">
            <div>
              <h2 className="font-bold text-gray-900 text-base mb-0.5">Printvriendelijke dagplanning</h2>
              <p className="text-sm text-gray-500">
                Genereert een A4-overzicht gegroepeerd per dagdeel en taak. Er wordt een nieuw venster geopend — gebruik daarin de afdrukfunctie van je browser (<kbd className="bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5 text-xs font-mono">Ctrl+P</kbd>).
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Het afdrukoverzicht bevat geen e-mailadressen en geen interne notities — geschikt om op papier te delen.
              </p>
            </div>
            <button
              onClick={() => openPrintWindow(rows, SUPPLIES_LABELS)}
              className="bg-green-800 text-white text-sm font-semibold rounded-xl px-6 py-3 hover:bg-green-900 transition-colors"
            >
              🖨 Open afdrukvenster
            </button>
          </div>

          {/* Preview van de groepen */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Overzicht (preview)</p>
            {[
              { label: "Hele dag", shift: "full_day" },
              { label: "Ochtend",  shift: "morning"  },
              { label: "Middag",   shift: "afternoon"},
            ].map(sg => {
              const shiftRowsAll = rows.filter(r =>
                !["cancelled","not_needed"].includes(r.planning_status ?? "") && r.final_shift === sg.shift
              );
              if (shiftRowsAll.length === 0) return null;
              return (
                <div key={sg.shift} className="bg-white border border-stone-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-gray-50 border-b border-stone-100">
                    <h3 className="font-semibold text-gray-900 text-sm">{sg.label} — {shiftRowsAll.length} persoon/personen</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {["Naam","Definitieve taak","Status","Spullen"].map(h => (
                            <th key={h} className="text-left px-4 py-2 text-xs font-semibold text-gray-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {shiftRowsAll.map(r => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap">{r.full_name}</td>
                            <td className="px-4 py-2 text-xs text-gray-600">
                              {r.final_tasks?.length
                                ? r.final_tasks.map(t => TASK_LABELS_PLAIN[t] ?? t).join(", ")
                                : <span className="text-gray-300 italic">—</span>}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[r.planning_status ?? "new"] ?? ""}`}>
                                {STATUS_LABEL[r.planning_status ?? "new"]}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-500">
                              {(r.selected_supplies ?? []).map(s => SUPPLIES_LABELS[s] ?? s).join(", ") || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
            {rows.filter(r => !["cancelled","not_needed"].includes(r.planning_status ?? "") && (!r.final_shift || r.final_shift === "not_chosen")).length > 0 && (
              <p className="text-xs text-amber-600">
                ⚠ Er zijn nog vrijwilligers zonder definitief dagdeel — die verschijnen in het afdrukvenster onder &ldquo;Nog niet ingepland&rdquo;.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Verwijder bevestiging ─────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Vrijwilliger verwijderen</h2>
            <p className="text-gray-600 text-sm">
              Weet u zeker dat u <strong>{deleteConfirm.full_name}</strong> uit de lijst wilt verwijderen?
            </p>
            {deleteError && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{deleteError}</p>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 bg-red-600 text-white font-semibold rounded-full py-2.5 hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting ? "Verwijderen…" : "Ja, verwijderen"}
              </button>
              <button onClick={() => { setDeleteConfirm(null); setDeleteError(null); }}
                className="flex-1 border border-stone-200 rounded-full py-2.5 text-gray-600 hover:bg-stone-50 transition-colors text-sm">
                Annuleren
              </button>
            </div>
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

              {saveError && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{saveError}</p>}

              {/* Acties */}
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-green-800 text-white font-semibold rounded-full py-3 hover:bg-green-900 transition-colors disabled:opacity-50">
                  {saving ? "Opslaan…" : "Opslaan"}
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
