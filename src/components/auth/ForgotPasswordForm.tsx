"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useState } from "react";

type Props = { hasSupabase: boolean };

export function ForgotPasswordForm({ hasSupabase }: Props) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!hasSupabase) {
      setMessage("Supabase não configurado no ambiente.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/login`,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setSent(true);
    } catch {
      setMessage("Não foi possível enviar o e-mail.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 flex min-h-dvh items-center justify-center px-6">
      <div className="w-full max-w-md glass-panel p-10">
        <h1 className="font-headline text-xl font-bold text-primary">
          Recuperação de acesso
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Enviaremos um link seguro para o e-mail corporativo cadastrado.
        </p>
        {sent ? (
          <p className="mt-6 text-sm text-primary-container">
            Verifique sua caixa de entrada e siga as instruções.
          </p>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-mail"
              className="w-full border-b border-outline-variant bg-surface-container-lowest py-3 text-primary focus:border-primary-container focus:outline-none"
            />
            {message ? (
              <p className="text-sm text-error">{message}</p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary-container py-3 font-headline text-sm font-bold uppercase tracking-wider text-on-secondary-container transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Enviando…" : "Enviar link"}
            </button>
          </form>
        )}
        <p className="mt-8 text-center text-sm">
          <Link href="/login" className="text-primary-container hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </main>
  );
}
