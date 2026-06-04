import { createClient } from "@/lib/supabase/server";
import type { ContributionSignup } from "@/lib/supabase/types";

const TYPE_LABELS: Record<string,string> = {
  bakken:"🎂 Iets bakken", sponsoring:"🤝 Sponsoring", spullen:"📦 Spullen",
  eten_verkopen:"🍟 Eten verkopen", overig:"✋ Overig",
};

export default async function BijdragenPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("contribution_signups").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as ContributionSignup[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bijdragen & sponsoring</h1>
        <p className="text-gray-400 text-sm">{rows.length} bijdragen</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-stone-100">
              <tr>
                {["Naam","Type","Omschrijving","Telefoon","Opmerkingen","Status","Ingediend"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.full_name}</p>
                    <p className="text-xs text-gray-400">{r.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="bg-green-50 text-green-700 border border-green-100 px-2 py-1 rounded-full">
                      {TYPE_LABELS[r.contribution_type] ?? r.contribution_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">{r.description ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{r.notes ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${r.status === "confirmed" ? "bg-green-100 text-green-700" : r.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Nog geen bijdragen</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
