import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/dashboard", "/orders", "/products", "/analytics", "/import", "/settings"];
const AUTH_PAGES = ["/login", "/signup"];

const matches = (path: string, list: string[]) => list.some((p) => path === p || path.startsWith(`${p}/`));

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Demo mode: no Supabase configured, nothing to protect.
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  let signedIn = false;
  try {
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } catch (err) {
    console.error("[proxy] auth check failed", err instanceof Error ? err.message : err);
  }

  const path = request.nextUrl.pathname;
  if (!signedIn && matches(path, PROTECTED)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }
  if (signedIn && matches(path, AUTH_PAGES)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|csv)$).*)"],
};
