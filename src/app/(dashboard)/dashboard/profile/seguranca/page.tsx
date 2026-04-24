import { SecurityForm } from "@/components/profile/forms/SecurityForm";

function hasAppwriteEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim() &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim(),
  );
}

export default function ProfileSegurancaPage() {
  return <SecurityForm hasAppwrite={hasAppwriteEnv()} />;
}
