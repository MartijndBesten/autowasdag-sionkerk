"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContributionSignup } from "@/lib/supabase/types";

// ─── Labels ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  bakken:        "🎂 Bakken",
  sponsoring:    "🤝 Sponsoring",
  spullen:       "📦 Spullen",
  eten_verkopen: "🍟 Eten verkopen",
  donatie:       "💜 Losse bijdrage",
  overig:        "✋ Overig",
};

const STATUS_OPTIONS = [
  { value: "pending",   label: "Nog te betalen",   cls: "bg-orange-100 text-orange-700" },
  { value: "paid_cash", label: "Betaald contant",  cls: "bg-green-100 text-green-700"  },
  { value: "paid_qr",   label: "Betaald via QR",   cls: "bg-green-100 text-green-700"  },
  { value: "confirmed", label: "Betaald",           cls: "bg-green-100 text-green-700"  },
  { value: "cancelled", label: "Geannuleerd",       cls: "bg-red-100 text-red-700"      },
];

function statusCls(s: string): string {
  return STATUS_OPTIONS.find(o => o.value === s)?.cls ?? "bg-gray-100 text-gray-600";
}
function statusLabel(s: string): string {
  return STATUS_OPTIONS.find(o => o.value === s)?.label ?? s;
}

function fmtDate(d: string): string {
  const [y,m,day] = d.split("-");
  return y ? `${day}-${m}-${y}` : d;
}

function csvCell(v: string | null | undefined): string {
  return `"${(v ?? "").replace(/"/g, '""')}"`;
}

function exportCSV(rows: ContributionSignup[]) {
  const SEP = ";";
  const headers = ["Naam","E-mail","Telefoon","Type","Bedrag","Betaalstatus","Bericht","Ingediend"];
  const lines = rows.map(r => [
    r.full_name,
    r.email,
    r.phone ?? "",
    TYPE_LABELS[r.contribution_type]?.replace(/^[^ ]+ /, "") ?? r.contribution_type,
    r.description ?? "",
    statusLabel(r.status),
    r.notes ?? "",
    fmtDate(r.created_at.slice(0, 10)),
  ].map(csvCell).join(SEP));
  const csv  = "﻿" + [headers.map(csvCell).join(SEP), ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "bijdragen.csv"; a.click();
  URL.revokeObjectURL(url);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BijdragenPage({ initialData }: { initialData: ContributionSignup[] }) {
  const [data,     setData]    = useState<ContributionSignup[]>(initialData);
  const [tabDonatie, setTabDonatie] = useState(false);
  const supabase = createClient();

  async function updateStatus(id: string, status: string) {
    await (supabase as any).from("contribution_signups").update({ status }).eq("id", id);
    setData(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  const isLosse = (r: ContributionSignup) => r.sponsorship_type === "losse_bijdrage";

  const shown = useMemo(
    () => tabDonatie ? data.filter(isLosse) : data,
    [data, tabDonatie]
  );

  const totalDonaties = useMemo(() => {
    return data
      .filter(r => isLosse(r) && ["paid_cash","paid_qr"].includes(r.status))
      .reduce((sum, r) => {
        const m = r.description?.match(/€(\d+[,.]?\d*)/);
        return sum + (m ? parseFloat(m[1].replace(",", ".")) : 0);
      }, 0);
  }, [data]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bijdragen</h1>
          <p className="text-gray-400 text-sm">{data.length} totaal</p>
        </div>
        <button onClick={() => exportCSV(shown)}
          className="flex items-center gap-2 bg-green-800 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-900 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          CSV exporteren
        </button>
      </div>

      {/* Totaal betaalde donaties */}
      {totalDonaties > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">💜</span>
          <div>
            <p className="font-semibold text-purple-800 text-sm">Betaalde losse bijdragen</p>
            <p className="text-purple-700 text-xs">€{totalDonaties.toFixed(2).replace(".",",")} ontvangen</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {[
          { label: `Alle bijdragen (${data.length})`,        active: !tabDonatie, onClick: () => setTabDonatie(false) },
          { label: `Losse bijdragen (${data.filter(r=>r.sponsorship_type==="losse_bijdrage").length})`, active: tabDonatie, onClick: () => setTabDonatie(true) },
        ].map(t => (
          <button key={t.label} onClick={t.onClick}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${t.active ? "bg-white border border-b-white border-stone-200 text-green-800 -mb-px" : "text-gray-500 hover:text-gray-700"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-stone-100">
              <tr>
                {["Naam","Type","Bedrag/omschrijving","Telefoon","Bericht","Betaalstatus","Ingediend"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {shown.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.full_name}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-stone-50 border border-stone-200 text-gray-600 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {TYPE_LABELS[r.contribution_type]?.replace(/^[^ ]+ /, "") ?? r.contribution_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.sponsorship_type === "losse_bijdrage" ? (
                      <span className="font-semibold text-purple-700">{r.description ?? "—"}</span>
                    ) : (
                      <span className="text-gray-500 text-xs max-w-xs block truncate">{r.description ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate italic">{r.notes ?? "—"}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={e => updateStatus(r.id, e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${statusCls(r.status)}`}>
                      {STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {fmtDate(r.created_at.slice(0, 10))}
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nog geen bijdragen</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
