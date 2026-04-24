import { PersonalDataForm } from "@/components/profile/forms/PersonalDataForm";

function hasAppwriteEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim() &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim(),
  );
}

export default function ProfileDadosPage() {
  return <PersonalDataForm hasAppwrite={hasAppwriteEnv()} />;
}
