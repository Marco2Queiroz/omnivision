import { assertSettingsAccess } from "@/lib/settings-access";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertSettingsAccess();
  return children;
}
