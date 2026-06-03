"use client";

import { useState } from "react";
import { useModal } from "@/context/ModalContext";

export default function BakingForm() {
  const { closeModal } = useModal();
  const [form, setForm] = useState({ name: "", email: "", phone: "", item_description: "", quantity: "1", dietary_info: "", notes: "" });
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
          type: "baking",
          name: form.name, email: form.email, phone: form.phone || null,
          item_description: form.item_description,
          quantity: Number(form.quantity) || 1,
          dietary_info: form.dietary_info || null,
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
      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="font-bold text-green-950 text-lg mb-2">Dankjewel, {form.name}!</h3>
      <p className="text-gray-500 text-sm">We zijn blij met je bijdrage. We nemen contact op.</p>
      <button onClick={closeModal} className="btn-primary mt-6">Sluiten</button>
    </div>
  );

  const fc = "w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-green-950 placeholder-gray-300 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 transition-colors";
  const lc = "block text-xs font-semibold text-green-700 uppercase tracking-wider mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-gray-400 text-sm">Wat ga je meebrengen? We zorgen voor een mooi plaatsje op de tafel.</p>
      <div><label className={lc}>Naam <span className="text-red-400">*</span></label><input required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Je naam" className={fc} /></div>
      <div><label className={lc}>E-mail <span className="text-red-400">*</span></label><input type="email" required value={form.email} onChange={e => set("email", e.target.value)} placeholder="jouw@email.nl" className={fc} /></div>
      <div><label className={lc}>Wat ga je meebrengen? <span className="text-red-400">*</span></label><input required value={form.item_description} onChange={e => set("item_description", e.target.value)} placeholder="bijv. appeltaart, koekjes…" className={fc} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lc}>Aantal stuks</label><input type="number" min="1" value={form.quantity} onChange={e => set("quantity", e.target.value)} className={fc} /></div>
        <div><label className={lc}>Dieetwensen</label><input value={form.dietary_info} onChange={e => set("dietary_info", e.target.value)} placeholder="bijv. glutenvrij" className={fc} /></div>
      </div>
      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Bezig…" : "Aanmelden"}
      </button>
    </form>
  );
}
