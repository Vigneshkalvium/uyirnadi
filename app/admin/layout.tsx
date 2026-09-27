import { AppShell } from "@/components/layout/app-shell";
import { protectPage } from "@/lib/auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await protectPage("admin");
  return <AppShell>{children}</AppShell>;
}
