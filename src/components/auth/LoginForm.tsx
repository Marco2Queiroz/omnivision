"use client";

import { account } from "@/lib/appwrite";
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
  const next = searchParams.get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!hasAppwrite) {
      setMessage(
        "Configure NEXT_PUBLIC_APPWRITE_ENDPOINT e NEXT_PUBLIC_APPWRITE_PROJECT_ID no .env.local — ou use OMNI_DEV_SKIP_AUTH=true em desenvolvimento.",
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
          <h1 className="font-headline text-4xl font-extrabold tracking-[0.2em] text-primary-container">
            OMNIVISION
          </h1>
          <p className="font-headline text-xs uppercase tracking-[0.5em] text-outline">
            Authority Intelligence Systems
          </p>
        </div>

        <div className="glass-panel relative overflow-hidden p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <header className="mb-10">
            <h2 className="font-headline text-2xl font-bold text-primary">
              COMMAND CENTER
            </h2>
            <div className="mt-2 h-1 w-12 bg-primary-container" />
          </header>

          <form className="space-y-8" onSubmit={onSubmit}>
            <div className="group space-y-2">
              <label className="block font-headline text-[10px] font-bold uppercase tracking-widest text-outline-variant group-focus-within:text-primary-container">
                Corporate Identifier (e-mail)
              </label>
              <input
                className="w-full border-b border-outline-variant bg-surface-container-lowest py-4 text-primary placeholder:text-surface-container-highest focus:border-primary-container focus:outline-none focus:ring-0"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="official@empresa.com"
                required
              />
            </div>
            <div className="group space-y-2">
              <label className="block font-headline text-[10px] font-bold uppercase tracking-widest text-outline-variant group-focus-within:text-primary-container">
                Access Key
              </label>
              <input
                className="w-full border-b border-outline-variant bg-surface-container-lowest py-4 text-primary placeholder:text-surface-container-highest focus:border-primary-container focus:outline-none focus:ring-0"
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
              className="scanner-hover relative flex w-full items-center justify-center gap-3 bg-gradient-to-r from-primary-container to-[#00a8b1] py-5 font-headline text-sm font-extrabold uppercase tracking-[0.15em] text-on-primary-container shadow-[0_0_20px_rgba(0,242,255,0.2)] transition active:scale-[0.98] disabled:opacity-60"
            >
              <Bolt className="h-5 w-5" />
              {loading ? "Autenticando…" : "Initialize Access"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-outline">
            <Link
              href="/forgot-password"
              className="text-primary-container hover:underline"
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
