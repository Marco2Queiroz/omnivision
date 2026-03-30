import { DashboardShell } from "@/components/layout/DashboardShell";

export const dynamic = "force-dynamic";

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appwriteConfigured = Boolean(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  );

  return (
    <DashboardShell appwriteConfigured={appwriteConfigured}>
      {children}
    </DashboardShell>
  );
}
