import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-on-surface-variant">
          Carregando…
        </div>
      }
    >
      <LoginForm hasSupabase={hasSupabase} />
    </Suspense>
  );
}
