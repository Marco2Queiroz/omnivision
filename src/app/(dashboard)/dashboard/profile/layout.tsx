import { ProfileShell } from "@/components/profile/ProfileShell";

export default function ProfileSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProfileShell>{children}</ProfileShell>;
}
