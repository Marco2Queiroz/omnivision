import { ActivitySection } from "@/components/profile/ActivitySection";

function hasAppwriteEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim() &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim(),
  );
}

export default function ProfileAtividadePage() {
  return <ActivitySection hasAppwrite={hasAppwriteEnv()} />;
}
