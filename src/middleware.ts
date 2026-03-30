import { type NextRequest, NextResponse } from "next/server";

const devSkipAuth =
  process.env.NODE_ENV === "development" &&
  process.env.OMNI_DEV_SKIP_AUTH === "true";

const projectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69c9ddd90025ff57dc52";

/** Cookie de sessão do SDK Appwrite Web */
const SESSION_COOKIE = `a_session_${projectId}`;

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (devSkipAuth) {
    return response;
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/dashboard") && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/forgot-password") && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|workbox.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
