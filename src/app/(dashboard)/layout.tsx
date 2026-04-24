import { DashboardShell } from "@/components/layout/DashboardShell";
import { getDashboardAccessState } from "@/lib/dashboard-access";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appwriteConfigured = Boolean(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
      process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  );
  const access = await getDashboardAccessState();

  return (
    <DashboardShell
      appwriteConfigured={appwriteConfigured}
      access={access}
    >
      {children}
    </DashboardShell>
  );
}
