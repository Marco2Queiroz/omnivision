import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const hasAppwrite = Boolean(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  );
  return <ForgotPasswordForm hasAppwrite={hasAppwrite} />;
}
