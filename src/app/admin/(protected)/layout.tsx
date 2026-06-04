import type { ReactNode } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin — Autowasdag Sionkerk" };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: adminUser } = await (supabase as any)
    .from("admin_users").select("email").eq("id", user.id).single();
  if (!adminUser) redirect("/admin/login?error=no_access");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar email={adminUser.email} />
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
