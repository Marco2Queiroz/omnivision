"use client";

import { account } from "@/lib/appwrite";
import { getSafeNextPath } from "@/lib/safe-redirect";
import { Bolt, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  hasAppwrite: boolean;
};

export function LoginForm({ hasAppwrite }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeNextPath(searchParams.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!hasAppwrite) {
      setMessage(
        "Configure NEXT_PUBLIC_APPWRITE_ENDPOINT e NEXT_PUBLIC_APPWRITE_PROJECT_ID no .env.local para entrar por e-mail e senha.",
      );
      return;
    }
    setLoading(true);
    try {
      await account.createEmailPasswordSession({ email, password });
      router.replace(next);
      router.refresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Falha ao iniciar sessão.";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-xl">
        <div className="mb-12 text-center">
          <h1 className="font-headline text-4xl font-extrabold tracking-[0.2em] text-primary drop-shadow-[0_0_32px_rgba(145,171,255,0.25)]">
            OMNIVISION
          </h1>
          <p className="font-headline text-xs uppercase tracking-[0.5em] text-outline">
            Authority Intelligence Systems
          </p>
        </div>

        <div className="glass-panel relative overflow-hidden p-10 ring-1 ring-inset ring-primary/10 shadow-[0_24px_64px_rgba(0,0,0,0.45),0_0_0_1px_rgba(145,171,255,0.06)]">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-tertiary/5 blur-3xl"
            aria-hidden
          />
          <header className="relative mb-10">
            <h2 className="font-headline text-2xl font-bold text-primary">
              COMMAND CENTER
            </h2>
            <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-primary-dim to-primary shadow-[0_0_12px_rgba(145,171,255,0.35)]" />
          </header>

          <form className="relative space-y-8" onSubmit={onSubmit}>
            <div className="group space-y-2">
              <label className="block font-headline text-[10px] font-bold uppercase tracking-widest text-outline-variant transition-colors group-focus-within:text-primary">
                Corporate Identifier (e-mail)
              </label>
              <input
                className="w-full rounded-t border-b-2 border-outline-variant/80 bg-surface-container-lowest/90 py-4 text-on-background placeholder:text-on-surface-variant transition-colors focus:border-primary focus:outline-none focus:ring-0"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="official@empresa.com"
                required
              />
            </div>
            <div className="group space-y-2">
              <label className="block font-headline text-[10px] font-bold uppercase tracking-widest text-outline-variant transition-colors group-focus-within:text-primary">
                Access Key
              </label>
              <input
                className="w-full rounded-t border-b-2 border-outline-variant/80 bg-surface-container-lowest/90 py-4 text-on-background placeholder:text-on-surface-variant transition-colors focus:border-primary focus:outline-none focus:ring-0"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {message ? (
              <p className="text-sm text-error" role="alert">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="scanner-hover relative flex w-full items-center justify-center gap-3 bg-gradient-to-r from-primary-dim to-primary py-5 font-headline text-sm font-extrabold uppercase tracking-[0.15em] text-on-primary-container shadow-glow-primary transition active:scale-[0.98] disabled:opacity-60"
            >
              <Bolt className="h-5 w-5" />
              {loading ? "Autenticando…" : "Initialize Access"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-outline">
            <Link
              href="/forgot-password"
              className="text-primary hover:underline"
            >
              Recuperação de credenciais
            </Link>
          </p>

          <footer className="mt-12 flex items-center justify-between border-t border-outline-variant/20 pt-8 text-[10px] font-medium uppercase tracking-widest text-outline">
            <span className="flex items-center gap-2">
              <Shield className="h-3 w-3" />
              Institutional Grade
            </span>
            <span>TLS 1.3</span>
          </footer>
        </div>
      </div>
    </main>
  );
}
