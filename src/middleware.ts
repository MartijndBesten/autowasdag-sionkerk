import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // /admin/login: toon altijd — stuur ingelogde admins door naar /admin
  if (pathname.startsWith("/admin/login")) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", user.id)
        .eq("is_active", true)
        .single();
      if (adminUser) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
    return supabaseResponse;
  }

  // Overige /admin/* routes: vereisen ingelogde admin
  if (pathname.startsWith("/admin")) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .eq("is_active", true)
      .single();
    if (!adminUser) {
      return NextResponse.redirect(new URL("/admin/login?error=no_access", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
