import { type NextRequest, NextResponse } from "next/server";

const projectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69c9ddd90025ff57dc52";

/** Cookie de sessão do SDK Appwrite Web */
const SESSION_COOKIE = `a_session_${projectId}`;

function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

/**
 * Sem login obrigatório em: `npm run dev`, acesso via localhost, ou
 * `OMNI_SKIP_LOGIN=true` (nunca em produção, exceto o par perigoso explícito abaixo).
 * `FORCE_LOGIN=true` / `REQUIRE_AUTH*`: força login em qualquer ambiente.
 *
 * Em `NODE_ENV=production` o login **não** é contornado, exceto se
 * `OMNI_SKIP_LOGIN=true` **e** `OMNI_ALLOW_BYPASS_IN_PROD=true` (não use em produção real).
 */
function shouldSkipAuth(request: NextRequest): boolean {
  if (process.env.FORCE_LOGIN === "true") return false;
  if (
    process.env.REQUIRE_AUTH_IN_DEV === "true" ||
    process.env.REQUIRE_AUTH === "true"
  ) {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    if (
      process.env.OMNI_ALLOW_BYPASS_IN_PROD === "true" &&
      process.env.OMNI_SKIP_LOGIN === "true"
    ) {
      return true;
    }
    return false;
  }
  if (process.env.OMNI_SKIP_LOGIN === "true") return true;
  if (process.env.NODE_ENV === "development") return true;
  if (isLocalHost(request.headers.get("host"))) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /**
   * Nunca interceptar ficheiros internos do Next (/_next/…) nem funções de deploy.
   * Se o matcher falhar, pedidos a chunks/HMR ainda corriam aqui e originavam 500 no browser
   * (F12: webpack.js, main.js, react-refresh.js com 500).
   */
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const skipAuth = shouldSkipAuth(request);

  if (skipAuth) {
    if (
      pathname === "/login" ||
      pathname === "/forgot-password" ||
      pathname === "/recovery"
    ) {
      return NextResponse.redirect(new URL("/dashboard/todos", request.url));
    }
    return response;
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (
    (pathname.startsWith("/dashboard") || pathname === "/settings") &&
    !session
  ) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if ((pathname === "/login" || pathname === "/forgot-password") && session) {
    return NextResponse.redirect(new URL("/dashboard/todos", request.url));
  }

  return response;
}

/**
 * Lista explícita de rotas (evita depender de regex com _next, que muda em dev HMR).
 * APIs tratam autenticação em cada route handler.
 */
export const config = {
  matcher: [
    "/",
    "/login",
    "/forgot-password",
    "/recovery",
    "/settings",
    "/settings/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
