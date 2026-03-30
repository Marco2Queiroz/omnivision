import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  const hasAppwrite = Boolean(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  );

  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-on-surface-variant">
          Carregando…
        </div>
      }
    >
      <LoginForm hasAppwrite={hasAppwrite} />
    </Suspense>
  );
}
