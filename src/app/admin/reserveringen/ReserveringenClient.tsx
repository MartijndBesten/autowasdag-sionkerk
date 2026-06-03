"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CarReservation, ReservationStatus, PaymentStatus } from "@/lib/supabase/types";

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  unpaid:        "bg-orange-100 text-orange-700",
  paid_cash:     "bg-green-100 text-green-700",
  paid_qr:       "bg-green-100 text-green-700",
  donated_extra: "bg-purple-100 text-purple-700",
};

function exportCSV(rows: CarReservation[]) {
  const header = ["Naam","E-mail","Telefoon","Kenteken","Pakket","Datum","Tijd","Status","Betaling","Opmerkingen"];
  const lines = rows.map(r => [
    r.full_name, r.email, r.phone ?? "", r.license_plate ?? "",
    r.package_type.replace(/_/g," "), r.reservation_date,
    String(r.reservation_time).slice(0,5),
    r.status, r.payment_status, (r.notes ?? "").replace(/,/g," "),
  ].map(v => `"${v}"`).join(","));
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = "reserveringen.csv"; a.click();
}

export default function ReserveringenClient({ initialData }: { initialData: CarReservation[] }) {
  const [data, setData]       = useState<CarReservation[]>(initialData);
  const [search, setSearch]   = useState("");
  const [filterStatus, setFS] = useState<string>("all");
  const supabase = createClient();

  const filtered = useMemo(() => data.filter(r => {
    const q = search.toLowerCase();
    const matchQ = !q || r.full_name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || (r.license_plate ?? "").toLowerCase().includes(q);
    const matchS = filterStatus === "all" || r.status === filterStatus;
    return matchQ && matchS;
  }), [data, search, filterStatus]);

  async function updateStatus(id: string, status: ReservationStatus) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("car_reservations").update({ status }).eq("id", id);
    setData(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  async function updatePayment(id: string, payment_status: PaymentStatus) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("car_reservations").update({ payment_status }).eq("id", id);
    setData(prev => prev.map(r => r.id === id ? { ...r, payment_status } : r));
  }

  async function deleteRow(id: string) {
    if (!confirm("Verwijder deze reservering?")) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("car_reservations").delete().eq("id", id);
    setData(prev => prev.filter(r => r.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reserveringen</h1>
          <p className="text-gray-400 text-sm">{filtered.length} van {data.length}</p>
        </div>
        <button onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-900 transition-colors">
          Export CSV
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
          <option value="pending">Pending</option>
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
                {["Naam","Pakket","Datum","Tijd","Telefoon","Kenteken","Status","Betaling","Acties"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.full_name}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.package_type.replace(/_/g," ")}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.reservation_date}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{String(r.reservation_time).slice(0,5)}</td>
                  <td className="px-4 py-3 text-gray-500">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{r.license_plate ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value as ReservationStatus)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_COLORS[r.status]}`}>
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="completed">completed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={r.payment_status}
                      onChange={e => updatePayment(r.id, e.target.value as PaymentStatus)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${PAYMENT_COLORS[r.payment_status]}`}>
                      <option value="unpaid">unpaid</option>
                      <option value="paid_cash">cash</option>
                      <option value="paid_qr">QR</option>
                      <option value="donated_extra">donatie</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRow(r.id)}
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
    </div>
  );
}
