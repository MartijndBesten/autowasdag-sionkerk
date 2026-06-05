"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CarReservation, ReservationStatus, PaymentStatus } from "@/lib/supabase/types";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const PAYMENT_COLORS: Record<string, string> = {
  unpaid:        "bg-orange-100 text-orange-700",
  paid_cash:     "bg-green-100 text-green-700",
  paid_qr:       "bg-green-100 text-green-700",
  donated_extra: "bg-purple-100 text-purple-700",
};

const PACKAGE_LABELS: Record<string, string> = {
  buiten_wassen: "Buiten wassen",
  compleet:      "Compleet",
  basis:         "Basis",
  binnen_zuigen: "Binnen zuigen",
  deluxe:        "Deluxe",
};

const PACKAGE_PRICES: Record<string, number> = {
  buiten_wassen: 10.00,
  compleet:      15.00,
  basis:         5,
  binnen_zuigen: 7.50,
  deluxe:        15,
};

const STATUS_LABELS: Record<string, string> = {
  pending:   "In behandeling",
  confirmed: "Bevestigd",
  completed: "Voltooid",
  cancelled: "Geannuleerd",
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid:        "Nog te betalen",
  paid_cash:     "Betaald contant",
  paid_qr:       "Betaald via QR",
  donated_extra: "Extra donatie",
};

// dd-mm-jjjj voor weergave
function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}-${m}-${y}`;
}

function addMins(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total  = h * 60 + m + minutes;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function pkgDuration(r: CarReservation): number {
  if (r.package_duration && r.package_duration > 0) return r.package_duration;
  return r.package_type === "compleet" ? 40 : 20;
}

// Zaterdag 11 juli voor compacte weergave
function fmtDateShort(dateStr: string): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y) return dateStr;
  const s = new Date(y, m - 1, d).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmt(v: string | number | null | undefined): string {
  if (v == null) return "";
  return String(v).replace(/"/g, "'");
}

function csvCell(v: string | number | null | undefined): string {
  return `"${fmt(v)}"`;
}

function exportCSV(rows: CarReservation[]) {
  const SEP = ";";
  const headers = [
    "Naam", "E-mail", "Telefoon", "Kenteken",
    "Pakket", "Prijs (€)", "Extra donatie (€)",
    "Datum", "Starttijd", "Duur (min)", "Eindtijd",
    "Status", "Betaling",
    "Opmerkingen",
  ];
  const lines = rows.map(r => {
    const dur     = pkgDuration(r);
    const start   = String(r.reservation_time).slice(0, 5);
    const endT    = addMins(start, dur);
    return [
      fmt(r.full_name),
      fmt(r.email),
      fmt(r.phone),
      fmt(r.license_plate),
      fmt(PACKAGE_LABELS[r.package_type] ?? r.package_type),
      fmt((PACKAGE_PRICES[r.package_type] ?? 0).toFixed(2)),
      fmt((r.extra_donation ?? 0).toFixed(2)),
      fmt(fmtDate(r.reservation_date)),
      fmt(start),
      fmt(String(dur)),
      fmt(endT),
      fmt(STATUS_LABELS[r.status] ?? r.status),
      fmt(PAYMENT_LABELS[r.payment_status] ?? r.payment_status),
      fmt(r.notes),
    ].map(csvCell).join(SEP);
  });

  const csv  = "﻿" + [headers.map(csvCell).join(SEP), ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "reserveringen.csv"; a.click();
  URL.revokeObjectURL(url);
}

export default function ReserveringenClient({ initialData }: { initialData: CarReservation[] }) {
  const [data, setData]         = useState<CarReservation[]>(initialData);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFS]   = useState<string>("all");
  const [deleteConfirm, setDC]      = useState<CarReservation | null>(null);

  // ── Bewerken ─────────────────────────────────────────────────────────────────
  const [editRow,  setEditRow]  = useState<CarReservation | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "", email: "", phone: "", notes: "",
    package_type: "", reservation_date: "", status: "", payment_status: "",
  });
  const [editBusy,     setEditBusy]     = useState(false);
  const [editErr,      setEditErr]      = useState<string | null>(null);
  const [editMailSent, setEditMailSent] = useState(false);
  const [editMailBusy, setEditMailBusy] = useState(false);

  function openEdit(r: CarReservation) {
    setEditRow(r);
    setEditForm({
      full_name:        r.full_name,
      email:            r.email,
      phone:            r.phone ?? "",
      notes:            r.notes ?? "",
      package_type:     r.package_type,
      reservation_date: r.reservation_date,
      status:           r.status,
      payment_status:   r.payment_status,
    });
    setEditErr(null);
    setEditMailSent(false);
  }

  async function saveEdit() {
    if (!editRow) return;
    setEditBusy(true);
    setEditErr(null);
    try {
      const res = await fetch(`/api/reserveren/${editRow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fout");
      const updated = { ...editRow, ...editForm, phone: editForm.phone || null, notes: editForm.notes || null } as CarReservation;
      setData(prev => prev.map(r => r.id === editRow.id ? updated : r));
      setEditRow(null);
    } catch (e) {
      setEditErr(e instanceof Error ? e.message : "Opslaan mislukt.");
    }
    setEditBusy(false);
  }

  async function sendEditMail() {
    if (!editRow) return;
    setEditMailBusy(true);
    try {
      const res = await fetch(`/api/reserveren/${editRow.id}`, { method: "POST" });
      if (!res.ok) throw new Error();
      setEditMailSent(true);
    } catch {
      setEditErr("E-mail versturen mislukt.");
    }
    setEditMailBusy(false);
  }

  // ── Verplaatsen ──────────────────────────────────────────────────────────────
  const [moveRow,     setMoveRow]   = useState<CarReservation | null>(null);
  const [moveSlots,   setMoveSlots] = useState<{ time: string; availableBays: number; available: boolean }[]>([]);
  const [washBays,    setWashBays]  = useState(2);
  const [moveTarget,  setMoveTarget]= useState<string>("");
  const [moveBusy,    setMoveBusy]  = useState(false);
  const [moveErr,     setMoveErr]   = useState<string | null>(null);
  const [movedRow,    setMovedRow]  = useState<CarReservation | null>(null);
  const [mailBusy,    setMailBusy]  = useState(false);
  const [mailSent,    setMailSent]  = useState(false);

  const supabase = createClient();

  const filtered = useMemo(() => data.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q
      || r.full_name.toLowerCase().includes(q)
      || r.email.toLowerCase().includes(q)
      || (r.license_plate ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "all" || r.status === filterStatus;
    return matchQ && matchS;
  }), [data, search, filterStatus]);

  const totalExpected = useMemo(() =>
    filtered
      .filter(r => r.status !== "cancelled")
      .reduce((s, r) => s + (PACKAGE_PRICES[r.package_type] ?? 0) + (r.extra_donation ?? 0), 0),
  [filtered]);

  async function updateStatus(id: string, status: ReservationStatus) {
    await (supabase as any).from("car_reservations").update({ status }).eq("id", id);
    setData(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  async function updatePayment(id: string, payment_status: PaymentStatus) {
    await (supabase as any).from("car_reservations").update({ payment_status }).eq("id", id);
    setData(prev => prev.map(r => r.id === id ? { ...r, payment_status } : r));
  }

  async function openMove(r: CarReservation) {
    setMoveRow(r);
    setMoveTarget("");
    setMoveErr(null);
    setMovedRow(null);
    setMailSent(false);
    try {
      const res = await fetch(
        `/api/timeslots?date=${r.reservation_date}&package=${r.package_type}&exclude_id=${r.id}`
      );
      const json = await res.json();
      setMoveSlots(json.slots ?? []);
      setWashBays(json.wash_bays ?? 2);
    } catch {
      setMoveSlots([]);
    }
  }

  async function confirmMove() {
    if (!moveRow || !moveTarget) return;
    setMoveBusy(true);
    setMoveErr(null);
    try {
      const res = await fetch(`/api/reserveren/${moveRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_time: moveTarget }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fout");
      const updated = { ...moveRow, reservation_time: moveTarget };
      setData(prev => prev.map(r => r.id === moveRow.id ? updated : r));
      setMovedRow(updated);
    } catch (e) {
      setMoveErr(e instanceof Error ? e.message : "Verplaatsen mislukt.");
    }
    setMoveBusy(false);
  }

  async function sendConfirmation() {
    if (!movedRow) return;
    setMailBusy(true);
    try {
      const res = await fetch(`/api/reserveren/${movedRow.id}`, { method: "POST" });
      if (!res.ok) throw new Error();
      setMailSent(true);
    } catch {
      setMoveErr("E-mail versturen mislukt.");
    }
    setMailBusy(false);
  }

  async function softDelete(r: CarReservation) {
    // Soft-delete: zet status op cancelled en sla op in admin_notes
    await (supabase as any)
      .from("car_reservations")
      .update({ status: "cancelled", admin_notes: `__verwijderd__ ${new Date().toISOString()}` })
      .eq("id", r.id);
    setData(prev => prev.filter(x => x.id !== r.id));
    setDC(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reserveringen</h1>
          <p className="text-gray-400 text-sm">
            {filtered.length} van {data.length}
            {filtered.length > 0 && (
              <span className="ml-3 text-green-700 font-medium">
                Verwacht: €{totalExpected.toFixed(2).replace(".", ",")}
              </span>
            )}
          </p>
        </div>
        <button onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV exporteren
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op naam, e-mail, kenteken…"
          className="border border-stone-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:border-green-600" />
        <select value={filterStatus} onChange={e => setFS(e.target.value)}
          className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600">
          <option value="all">Alle statussen</option>
          <option value="pending">In behandeling</option>
          <option value="confirmed">Bevestigd</option>
          <option value="completed">Voltooid</option>
          <option value="cancelled">Geannuleerd</option>
        </select>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-stone-100">
              <tr>
                {["Naam","Pakket / Prijs","Datum","Tijd","Telefoon","Kenteken","Status","Betaling","Acties"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map(r => (
                <tr key={r.id} className={`hover:bg-gray-50 ${r.status === "cancelled" ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.full_name}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                    {r.notes && <p className="text-xs text-gray-300 italic mt-0.5">{r.notes}</p>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-gray-700 font-medium">{PACKAGE_LABELS[r.package_type] ?? r.package_type}</p>
                    <p className="text-xs text-gray-400">
                      €{(PACKAGE_PRICES[r.package_type] ?? 0).toFixed(2).replace(".", ",")}
                      {r.extra_donation > 0 && <span className="text-purple-600"> + €{r.extra_donation.toFixed(2).replace(".", ",")} donatie</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-medium">{fmtDateShort(r.reservation_date)}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    <span className="font-medium">{String(r.reservation_time).slice(0,5)}</span>
                    <span className="text-gray-400 text-xs"> – {addMins(String(r.reservation_time).slice(0,5), pkgDuration(r))}</span>
                    <span className="block text-xs text-gray-400">{pkgDuration(r)} min</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.license_plate ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value as ReservationStatus)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      <option value="pending">In behandeling</option>
                      <option value="confirmed">Bevestigd</option>
                      <option value="completed">Voltooid</option>
                      <option value="cancelled">Geannuleerd</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={r.payment_status}
                      onChange={e => updatePayment(r.id, e.target.value as PaymentStatus)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${PAYMENT_COLORS[r.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
                      <option value="unpaid">Nog te betalen</option>
                      <option value="paid_cash">Betaald contant</option>
                      <option value="paid_qr">Betaald via QR</option>
                      <option value="donated_extra">Extra donatie</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 whitespace-nowrap flex-wrap">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-xs bg-stone-50 text-gray-700 border border-stone-200 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                      >
                        Bewerken
                      </button>
                      <button
                        onClick={() => openMove(r)}
                        disabled={r.status === "cancelled"}
                        className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Verplaatsen
                      </button>
                      <button onClick={() => setDC(r)}
                        className="text-red-400 hover:text-red-600 text-xs transition-colors">
                        Verwijder
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Geen resultaten</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verwijder-bevestiging modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setDC(null); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Reservering verwijderen</h2>
            <p className="text-gray-600 text-sm">
              Weet u zeker dat u de reservering van <strong>{deleteConfirm.full_name}</strong> wilt verwijderen?
            </p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              De reservering wordt als &ldquo;Geannuleerd&rdquo; gemarkeerd en verborgen in het overzicht. U kunt dit terugvinden via het filter &ldquo;Geannuleerd&rdquo;.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => softDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white font-semibold rounded-full py-2.5 hover:bg-red-700 transition-colors">
                Ja, verwijderen
              </button>
              <button onClick={() => setDC(null)}
                className="flex-1 border border-stone-200 rounded-full py-2.5 text-gray-600 hover:bg-stone-50 transition-colors text-sm">
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Bewerken ───────────────────────────────────────────────────── */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget && !editBusy) setEditRow(null); }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="sticky top-0 bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Reservering bewerken</h2>
                <p className="text-xs text-gray-400">{editRow.full_name} · {fmtDateShort(editRow.reservation_date)} {String(editRow.reservation_time).slice(0,5)}</p>
              </div>
              <button onClick={() => setEditRow(null)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Persoonsgegevens */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Persoonsgegevens</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"Naam *",    key:"full_name",   type:"text"  },
                  { label:"E-mail *",  key:"email",       type:"email" },
                  { label:"Telefoon",  key:"phone",       type:"tel"   },
                ].map(f => (
                  <div key={f.key} className={f.key === "full_name" ? "col-span-2" : ""}>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                    <input
                      type={f.type}
                      value={(editForm as Record<string,string>)[f.key]}
                      onChange={e => setEditForm(p => ({...p, [f.key]: e.target.value}))}
                      className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                    />
                  </div>
                ))}
              </div>

              {/* Reserveringsdetails */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Reserveringsdetails</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pakket</label>
                  <select value={editForm.package_type}
                    onChange={e => setEditForm(p => ({...p, package_type: e.target.value}))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600">
                    <option value="buiten_wassen">Buiten wassen</option>
                    <option value="compleet">Compleet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Datum</label>
                  <input type="date" value={editForm.reservation_date}
                    onChange={e => setEditForm(p => ({...p, reservation_date: e.target.value}))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select value={editForm.status}
                    onChange={e => setEditForm(p => ({...p, status: e.target.value}))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600">
                    <option value="pending">In behandeling</option>
                    <option value="confirmed">Bevestigd</option>
                    <option value="completed">Afgerond</option>
                    <option value="cancelled">Geannuleerd</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Betaalstatus</label>
                  <select value={editForm.payment_status}
                    onChange={e => setEditForm(p => ({...p, payment_status: e.target.value}))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600">
                    <option value="unpaid">Nog te betalen</option>
                    <option value="paid_cash">Betaald contant</option>
                    <option value="paid_qr">Betaald via QR</option>
                    <option value="donated_extra">Extra donatie</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Opmerkingen</label>
                  <textarea rows={2} value={editForm.notes}
                    onChange={e => setEditForm(p => ({...p, notes: e.target.value}))}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600 resize-none" />
                </div>
              </div>
              <p className="text-xs text-gray-400">Tijdslot wijzigen? Gebruik de knop &ldquo;Verplaatsen&rdquo; in de tabel.</p>

              {editErr && <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{editErr}</p>}

              <div className="flex gap-3 pt-1">
                <button onClick={saveEdit} disabled={editBusy}
                  className="flex-1 bg-green-800 text-white font-semibold rounded-full py-2.5 hover:bg-green-900 transition-colors disabled:opacity-50">
                  {editBusy ? "Opslaan…" : "Wijzigingen opslaan"}
                </button>
                <button onClick={() => setEditRow(null)} disabled={editBusy}
                  className="px-5 border border-stone-200 rounded-full text-gray-600 hover:bg-stone-50 text-sm">
                  Annuleren
                </button>
              </div>

              {/* Bevestigingsmail */}
              <div className="border-t border-stone-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Bevestigingsmail</p>
                {editMailSent
                  ? <p className="text-green-600 text-sm font-medium">✓ Bevestigingsmail verstuurd naar {editRow.email}</p>
                  : <button onClick={sendEditMail} disabled={editMailBusy}
                      className="w-full border border-green-300 text-green-700 text-sm font-medium rounded-xl py-2.5 hover:bg-green-50 transition-colors disabled:opacity-50">
                      {editMailBusy ? "Versturen…" : "✉ Bevestigingsmail opnieuw versturen"}
                    </button>
                }
              </div>

              {/* Wijzigingslog */}
              {editRow.admin_notes && !editRow.admin_notes.startsWith("__verwijderd__") && (
                <div className="border-t border-stone-100 pt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Wijzigingslog</p>
                  <div className="bg-stone-50 rounded-xl p-3 space-y-1 max-h-40 overflow-y-auto">
                    {editRow.admin_notes.split("\n").filter(Boolean).map((line, i) => (
                      <p key={i} className="text-xs text-gray-500 font-mono leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Verplaatsen ─────────────────────────────────────────────────── */}
      {moveRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget && !moveBusy) { setMoveRow(null); } }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">

            {!movedRow ? (
              <>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Reservering verplaatsen</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    <strong>{moveRow.full_name}</strong> · {PACKAGE_LABELS[moveRow.package_type] ?? moveRow.package_type} · {fmtDateShort(moveRow.reservation_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Huidig tijdslot: <strong>{String(moveRow.reservation_time).slice(0,5)}</strong>
                    {moveRow.package_duration ? ` (${moveRow.package_duration} min)` : ""}
                  </p>
                </div>

                {moveSlots.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Geen beschikbare tijdsloten gevonden.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kies een nieuw tijdslot</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {moveSlots.map(slot => {
                        const isCurrent = String(moveRow.reservation_time).slice(0,5) === slot.time;
                        const almostFull = slot.availableBays === 1 && washBays > 1;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setMoveTarget(slot.time)}
                            disabled={isCurrent}
                            className={`relative rounded-xl border-2 py-2.5 px-2 text-center text-sm font-medium transition-colors
                              ${isCurrent
                                ? "border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed"
                                : moveTarget === slot.time
                                  ? "border-blue-600 bg-blue-50 text-blue-800"
                                  : almostFull
                                    ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500"
                                    : "border-stone-200 text-gray-700 hover:border-blue-400"
                              }`}
                          >
                            {slot.time}
                            {isCurrent && <span className="block text-xs text-stone-400 font-normal">huidig</span>}
                            {!isCurrent && almostFull && <span className="block text-xs text-amber-600 font-normal">bijna vol</span>}
                            {!isCurrent && !almostFull && <span className="block text-xs text-gray-400 font-normal">{slot.availableBays} vrij</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {moveErr && (
                  <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{moveErr}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={confirmMove}
                    disabled={!moveTarget || moveBusy}
                    className="flex-1 bg-blue-700 text-white font-semibold rounded-full py-2.5 hover:bg-blue-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {moveBusy ? "Bezig…" : "Bevestig verplaatsing"}
                  </button>
                  <button
                    onClick={() => setMoveRow(null)}
                    disabled={moveBusy}
                    className="px-5 border border-stone-200 rounded-full text-gray-600 hover:bg-stone-50 text-sm"
                  >
                    Annuleren
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-2 py-2">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="font-bold text-gray-900 text-lg">Verplaatst!</h2>
                  <p className="text-sm text-gray-600">
                    {movedRow.full_name} is verplaatst naar <strong>{String(movedRow.reservation_time).slice(0,5)}</strong> uur.
                  </p>
                </div>

                <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 space-y-1 text-sm">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bijgewerkte reservering</p>
                  <p><span className="text-gray-500 w-24 inline-block">Naam</span> {movedRow.full_name}</p>
                  <p><span className="text-gray-500 w-24 inline-block">Pakket</span> {PACKAGE_LABELS[movedRow.package_type] ?? movedRow.package_type}</p>
                  <p><span className="text-gray-500 w-24 inline-block">Datum</span> {fmtDateShort(movedRow.reservation_date)}</p>
                  <p><span className="text-gray-500 w-24 inline-block">Nieuw slot</span> <strong>{String(movedRow.reservation_time).slice(0,5)}</strong> uur</p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                  Er is <strong>geen automatische e-mail</strong> verstuurd. Klik hieronder om de klant een bijgewerkte bevestiging te sturen.
                </div>

                {moveErr && (
                  <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">{moveErr}</p>
                )}

                {mailSent ? (
                  <p className="text-green-600 text-sm font-medium text-center">✓ Bevestigingsmail verstuurd naar {movedRow.email}</p>
                ) : (
                  <button
                    onClick={sendConfirmation}
                    disabled={mailBusy}
                    className="w-full bg-green-700 text-white font-semibold rounded-full py-3 hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    {mailBusy ? "Versturen…" : "✉ Nieuwe bevestiging versturen"}
                  </button>
                )}

                <button
                  onClick={() => setMoveRow(null)}
                  className="w-full border border-stone-200 rounded-full py-2.5 text-gray-600 hover:bg-stone-50 text-sm"
                >
                  Sluiten
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
