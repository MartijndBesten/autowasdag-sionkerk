import { createClient } from "@/lib/supabase/server";
import type { VolunteerSignup } from "@/lib/supabase/types";

const TASK_LABELS: Record<string,string> = {
  wassen:"🚿 Wassen", koffie:"☕ Koffie", friet:"🍟 Friet",
  kinderhoek:"🎈 Kinderhoek", opbouwen:"🔧 Op/afbouwen",
  bakken:"🎂 Bakken", spullen:"📦 Spullen", sponsoring:"🤝 Sponsoring", anders:"✋ Anders",
};
const AVAIL: Record<string,string> = { full_day:"Hele dag", morning:"Ochtend", afternoon:"Middag" };
const STATUS_C: Record<string,string> = { pending:"bg-yellow-100 text-yellow-800", confirmed:"bg-green-100 text-green-700", cancelled:"bg-red-100 text-red-700" };

export default async function VrijwilligersPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("volunteer_signups").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as VolunteerSignup[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vrijwilligers</h1>
        <p className="text-gray-400 text-sm">{rows.length} aanmeldingen</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-stone-100">
              <tr>
                {["Naam","Beschikbaarheid","Taken","Bijdrage details","Telefoon","Opmerkingen","Status","Ingediend"].map(h => (
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
                  <td className="px-4 py-3 text-gray-500 text-xs">{AVAIL[r.availability] ?? r.availability}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(r.selected_tasks ?? []).map((t: string) => (
                        <span key={t} className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
                          {TASK_LABELS[t] ?? t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">
                    {r.contribution_details
                      ? r.contribution_details.split("\n").map((line: string, i: number) => <p key={i}>{line}</p>)
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{r.phone ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">{r.notes ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs font-semibold px-2 py-1 rounded-full ${STATUS_C[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("nl-NL")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Nog geen aanmeldingen</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
