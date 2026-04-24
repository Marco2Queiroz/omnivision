"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Erro de segmento (RSC/rotas) — mostra feedback em vez de tela vazia.
 */
export default function AppError({ error, reset }: Props) {
  useEffect(() => {
    console.error("[OmniVision]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-on-background">
      <h1 className="font-headline text-xl font-bold text-primary">
        Algo correu mal
      </h1>
      <p className="max-w-md text-center text-sm text-on-surface-variant">
        {error.message || "Erro inesperado ao carregar esta área."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg border border-line-field bg-surface-container-high px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-highest"
      >
        Tentar outra vez
      </button>
    </div>
  );
}
