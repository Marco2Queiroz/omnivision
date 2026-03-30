"use client";

import { account } from "@/lib/appwrite";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function RecoveryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const secret = searchParams.get("secret") ?? "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!userId || !secret) {
      setMessage("Link inválido ou expirado. Solicite nova recuperação.");
      return;
    }
    setLoading(true);
    try {
      await account.updateRecovery({ userId, secret, password });
      router.replace("/login");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Não foi possível redefinir a senha.";
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!userId || !secret) {
    return (
      <div className="glass-panel mx-auto mt-24 max-w-md p-8 text-center">
        <p className="text-on-surface-variant">
          Abra o link enviado por e-mail ou solicite nova recuperação.
        </p>
        <Link href="/forgot-password" className="mt-4 inline-block text-primary-container">
          Recuperar senha
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel mx-auto mt-24 max-w-md p-8">
      <h1 className="font-headline text-xl font-bold text-primary">
        Nova senha
      </h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nova senha (mín. 8 caracteres)"
          className="w-full border-b border-outline-variant bg-surface-container-lowest py-3 text-primary focus:border-primary-container focus:outline-none"
        />
        {message ? <p className="text-sm text-error">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-secondary-container py-3 font-headline text-sm font-bold text-on-secondary-container disabled:opacity-50"
        >
          {loading ? "Salvando…" : "Definir senha"}
        </button>
      </form>
    </div>
  );
}

export default function RecoveryPage() {
  return (
    <div className="min-h-dvh bg-surface-dim px-4 py-8 text-on-surface">
      <Suspense fallback={<p className="text-center">Carregando…</p>}>
        <RecoveryForm />
      </Suspense>
    </div>
  );
}
