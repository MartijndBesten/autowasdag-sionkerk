"use client";

import { useState } from "react";
import { useModal } from "@/context/ModalContext";

export default function MaterialsForm() {
  const { closeModal } = useModal();
  const [form, setForm] = useState({ name: "", email: "", phone: "", item_description: "", quantity: "", notes: "" });
  const [status, setStatus]   = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(k: keyof typeof form, v: string) { setForm(p => ({ ...p, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/bijdrage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "materials",
          name: form.name, email: form.email, phone: form.phone || null,
          item_description: form.item_description,
          quantity: form.quantity ? Number(form.quantity) : null,
          notes: form.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Fout");
      setStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Er is iets misgegaan.");
      setStatus("error");
    }
  }

  if (status === "success") return (
    <div className="py-8 text-center">
      <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-bold text-green-950 text-lg mb-2">Top, {form.name}!</h3>
      <p className="text-gray-500 text-sm">Heel fijn dat je spullen meebrengt. We nemen contact met je op.</p>
      <button onClick={closeModal} className="btn-primary mt-6">Sluiten</button>
    </div>
  );

  const fc = "w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors";
  const lc = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-gray-400 text-sm">Van alles komt van pas: emmers, sponzen, zeep, vaatdoeken, spelmateriaal…</p>
      <div><label className={lc}>Naam <span className="text-red-400">*</span></label><input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Je naam" className={fc} /></div>
      <div><label className={lc}>E-mail <span className="text-red-400">*</span></label><input type="email" required value={form.email} onChange={e => set("email", e.target.value)} placeholder="jouw@email.nl" className={fc} /></div>
      <div><label className={lc}>Wat kun je meenemen? <span className="text-red-400">*</span></label><input required value={form.item_description} onChange={e => set("item_description", e.target.value)} placeholder="bijv. emmer + spons, zeep…" className={fc} /></div>
      <div><label className={lc}>Hoeveelheid</label><input value={form.quantity} onChange={e => set("quantity", e.target.value)} placeholder="bijv. 2 stuks" className={fc} /></div>
      <div><label className={lc}>Opmerkingen</label><textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} className={`${fc} resize-none`} /></div>
      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Bezig…" : "Aanmelden"}
      </button>
    </form>
  );
}
