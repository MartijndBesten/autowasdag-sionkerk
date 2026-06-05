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
  buiten_wassen: 7.50,
  compleet:      12.50,
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
    "Datum", "Tijdstip",
    "Status", "Betaling",
    "Opmerkingen",
  ];
  const lines = rows.map(r => [
    fmt(r.full_name),
    fmt(r.email),
    fmt(r.phone),
    fmt(r.license_plate),
    fmt(PACKAGE_LABELS[r.package_type] ?? r.package_type),
    fmt((PACKAGE_PRICES[r.package_type] ?? 0).toFixed(2)),
    fmt((r.extra_donation ?? 0).toFixed(2)),
    fmt(fmtDate(r.reservation_date)),
    fmt(String(r.reservation_time).slice(0, 5)),
    fmt(STATUS_LABELS[r.status] ?? r.status),
    fmt(PAYMENT_LABELS[r.payment_status] ?? r.payment_status),
    fmt(r.notes),
  ].map(csvCell).join(SEP));

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
  const [deleteConfirm, setDC]  = useState<CarReservation | null>(null);
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
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{String(r.reservation_time).slice(0,5)}</td>
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
                    <button onClick={() => setDC(r)}
                      className="text-red-400 hover:text-red-600 text-xs transition-colors">
                      Verwijder
                    </button>
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
    </div>
  );
}
