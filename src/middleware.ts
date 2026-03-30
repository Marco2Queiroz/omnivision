import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const devSkipAuth =
  process.env.NODE_ENV === "development" &&
  process.env.OMNI_DEV_SKIP_AUTH === "true";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (devSkipAuth) {
    return response;
  }

  if (!url || !key) {
    if (pathnameIsDashboard(request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (pathnameIsDashboard(pathname) && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/forgot-password") && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

function pathnameIsDashboard(pathname: string) {
  return pathname.startsWith("/dashboard");
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
