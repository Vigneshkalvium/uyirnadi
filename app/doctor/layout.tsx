import { AppShell } from "@/components/layout/app-shell";
import { protectPage } from "@/lib/auth/server";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await protectPage("doctor");
  return <AppShell>{children}</AppShell>;
}
