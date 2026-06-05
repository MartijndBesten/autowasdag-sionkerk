import { createClient } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getStats(supabase: any) {
  const [res, vol, con] = await Promise.all([
    supabase.from("car_reservations").select("id, full_name, reservation_date, reservation_time, payment_status, package_type, extra_donation, status").order("created_at", { ascending: false }),
    supabase.from("volunteer_signups").select("id, status").eq("is_deleted", false),
    supabase.from("contribution_signups").select("id, status"),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reservations  = (res.data  ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volunteers    = (vol.data  ?? []) as any[];

  const prices: Record<string, number> = { buiten_wassen: 7.5, compleet: 12.5 };
  const expected = reservations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((r: any) => r.status !== "cancelled")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .reduce((sum: number, r: any) => sum + (prices[r.package_type] ?? 0) + (r.extra_donation ?? 0), 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const open = reservations.filter((r: any) => r.payment_status === "unpaid" && r.status !== "cancelled").length;

  return {
    totalReservations: reservations.filter(r => r.status !== "cancelled").length,
    expectedRevenue:   expected,
    totalVolunteers:   volunteers.length,
    openPayments:      open,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recentReservations: (res.data as any[])?.slice(0, 5) ?? [],
  };
}

const statusBadge: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function AdminDashboard() {
  const supabase = await createClient();
  const stats    = await getStats(supabase);

  const cards = [
    { label: "Reserveringen",      value: stats.totalReservations, sub: "bevestigd of in behandeling", icon: "🚗" },
    { label: "Verwachte opbrengst",value: `€${stats.expectedRevenue}`,     sub: "excl. annuleringen",         icon: "💶" },
    { label: "Vrijwilligers",       value: stats.totalVolunteers,   sub: "aangemeld",                   icon: "🙌" },
    { label: "Open betalingen",     value: stats.openPayments,      sub: "nog niet betaald",            icon: "⏳" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Overzicht</h1>
        <p className="text-gray-400 text-sm mt-1">Autowasdag Sionkerk Houten</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
            <p className="text-xs text-gray-300 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Recente reserveringen */}
      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recente reserveringen</h2>
          <a href="/admin/reserveringen" className="text-green-700 text-sm hover:text-green-900">Alles bekijken →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Naam","Pakket","Datum","Tijd","Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {(stats.recentReservations as Array<Record<string,string>>).map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.package_type?.replace(/_/g," ")}</td>
                  <td className="px-4 py-3 text-gray-500">{r.reservation_date}</td>
                  <td className="px-4 py-3 text-gray-500">{String(r.reservation_time).slice(0,5)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${statusBadge[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.recentReservations.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">Nog geen reserveringen</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
