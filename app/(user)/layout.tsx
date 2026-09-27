import { AppShell } from "@/components/layout/app-shell";
import { protectPage } from "@/lib/auth/server";
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await protectPage();
  return <AppShell>{children}</AppShell>;
}
