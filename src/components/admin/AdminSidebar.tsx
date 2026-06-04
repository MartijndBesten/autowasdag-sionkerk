"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/admin",              label: "Overzicht",    icon: "📊" },
  { href: "/admin/reserveringen",label: "Reserveringen",icon: "🚗" },
  { href: "/admin/vrijwilligers",label: "Vrijwilligers",icon: "🙌" },
  { href: "/admin/bijdragen",    label: "Bijdragen",    icon: "🎂" },
  { href: "/admin/acties",       label: "Acties",        icon: "📅" },
  { href: "/admin/instellingen", label: "Instellingen", icon: "⚙️" },
];

export default function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <aside className="w-60 bg-green-950 flex flex-col min-h-screen flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-green-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">AW</div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Admin</p>
            <p className="text-green-400 text-xs">Autowasdag Sionkerk</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(item => {
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-green-700 text-white"
                  : "text-green-300 hover:bg-green-900 hover:text-white"
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + uitloggen */}
      <div className="p-4 border-t border-green-900">
        <p className="text-green-400 text-xs truncate mb-2">{email}</p>
        <button onClick={handleLogout}
          className="w-full text-left text-xs text-green-500 hover:text-white transition-colors py-1">
          Uitloggen →
        </button>
      </div>
    </aside>
  );
}
