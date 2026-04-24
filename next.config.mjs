/** @type {import('next').NextConfig} */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss: ws: http:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  /**
   * Não usamos @ducanh2912/next-pwa (conflitava com PostCSS/Tailwind). Manifest em public/.
   * Não usar `webpack` aqui para alias `@/` — o Next aplica `paths` do `tsconfig`/`jsconfig`.
   * Um hook `webpack` que mexe em `resolve.alias` quebrou o pipeline CSS em alguns ambientes.
   */
  async headers() {
    const h = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "Content-Security-Policy", value: csp },
    ];
    if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
      h.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }
    return [{ source: "/:path*", headers: h }];
  },
  experimental: {
    serverComponentsExternalPackages: ["node-appwrite"],
  },
  async rewrites() {
    return [
      { source: "/favicon.ico", destination: "/icon-omni.png" },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard/settings",
        destination: "/settings",
        permanent: false,
      },
      {
        source: "/dashboard/geo",
        destination: "/dashboard/todos",
        permanent: false,
      },
      {
        source: "/dashboard/strategy",
        destination: "/dashboard/todos",
        permanent: false,
      },
      {
        source: "/dashboard/tactical",
        destination: "/dashboard/projetos",
        permanent: false,
      },
      {
        source: "/dashboard/operational",
        destination: "/dashboard/todos",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
