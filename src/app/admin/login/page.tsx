"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const error        = searchParams.get("error");

  const [email, setEmail]       = useState("m.denbesten@live.nl");
  const [password, setPassword] = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "error">("idle");
  const [msg, setMsg]           = useState(error === "no_access" ? "Geen toegang tot het admin-paneel." : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMsg("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setStatus("error");
      setMsg("Ongeldige inloggegevens.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const f = "w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors";

  return (
    <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-green-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 2 5 5.5 5 9.5c0 5 7 12.5 7 12.5s7-7.5 7-12.5C19 5.5 16 2 12 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-green-950">Admin — Autowasdag</h1>
          <p className="text-gray-400 text-sm mt-1">Sionkerk Houten</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8">
          <h2 className="font-semibold text-green-950 mb-6">Inloggen</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5">E-mailadres</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={f} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5">Wachtwoord</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className={f} />
            </div>

            {msg && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2">{msg}</p>
            )}

            <button type="submit" disabled={status === "loading"}
              className="w-full bg-green-800 text-white font-semibold rounded-full py-3 hover:bg-green-900 transition-colors disabled:opacity-50 mt-2">
              {status === "loading" ? "Bezig…" : "Inloggen"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
