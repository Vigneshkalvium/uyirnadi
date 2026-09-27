"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  ArrowUpRight,
  ShieldCheck,
  LogOut,
  Heart,
  Command,
  Settings,
} from "lucide-react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import {
  navigation,
  doctorNavigation,
  adminNavigation,
  secondaryNavigation,
} from "@/config/navigation";
import { useProfile, useRecords } from "@/hooks/use-records";
import { firebaseConfigured, clientAuth } from "@/lib/firebase/client";
import { api, saveRecord } from "@/lib/firestore/client";
import { signOut } from "firebase/auth";
import { Modal, Badge, EmptyState } from "@/components/ui";
import { cn, initials } from "@/lib/utils";
import { toast } from "sonner";
import type { ReactNode } from "react";
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const profile = useProfile();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useRecords("notifications");
  const nav = path.startsWith("/admin")
    ? adminNavigation
    : path.startsWith("/doctor")
      ? doctorNavigation
      : navigation;
  const allLinks = [
    ...navigation.flatMap((g) => g.items),
    ...secondaryNavigation,
  ];
  const active =
    nav.flatMap((g) => g.items).find((i) => path === i.href)?.label ||
    allLinks.find((i) => path === i.href)?.label ||
    "Your health";
  const unread = notifications.records.filter((n) => !n.read).length;
  async function logout() {
    try {
      if (firebaseConfigured) {
        await api("/api/auth/session", { method: "DELETE" });
        await signOut(clientAuth());
      }
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Could not sign out. Please try again.");
    }
  }
  return (
    <div>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      {menu && (
        <div
          className="fixed inset-0 z-40 bg-black/25 lg:hidden"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={cn("sidebar", menu && "open")}>
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-7 pt-7 pb-5"
        >
          <Image
            src="/logo.jpeg"
            alt="UyirNadi"
            width={35}
            height={35}
            className="rounded-md object-cover object-top"
          />
          <div>
            <span className="text-[22px] font-semibold tracking-[-1px]">
              Uyir<span className="text-[#708b58]">Nadi</span>
            </span>
            <p className="text-[8px] tracking-[1.3px] text-[#939d87]">
              CARE. CONNECT. THRIVE.
            </p>
          </div>
        </Link>
        <button
          className="absolute right-3 top-3 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMenu(false)}
        >
          <X className="size-4" />
        </button>
        <div className="sidebar-scroll">
          {nav.map((group) => (
            <div key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              <nav aria-label={group.label}>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenu(false)}
                    className={cn("nav-link", path === item.href && "active")}
                    aria-current={path === item.href ? "page" : undefined}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    {"badge" in item && (
                      <span className="ml-auto rounded bg-[#e8edda] px-1.5 text-[8px] text-[#7c8d5d]">
                        {String(item.badge)}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
          <div className="mt-5 border-t border-border pt-4">
            {secondaryNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenu(false)}
                className={cn(
                  "nav-link",
                  path === item.href && "active",
                  item.href === "/emergency" && "text-[#ab7165]",
                )}
              >
                <item.icon />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mx-4 mb-4 rounded-lg border border-[#e6eadc] bg-[#f6f8f0] p-3.5">
          <div className="flex items-center gap-2 text-[10px] font-medium text-[#6d805b]">
            <ShieldCheck className="size-3.5" />
            {firebaseConfigured
              ? "Your health, kept private"
              : "Demo workspace"}
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-[#959e87]">
            {firebaseConfigured
              ? "A little care. A healthier every day."
              : "Sample data for exploring UyirNadi."}
          </p>
          {!firebaseConfigured && (
            <Link
              href="/login"
              className="mt-2 flex items-center gap-1 text-[9px] font-medium text-primary"
            >
              Connect your own care <ArrowUpRight className="size-3" />
            </Link>
          )}
        </div>
        <div className="border-t border-border px-6 py-3 text-[8px] text-[#a8afa0]">
          Your Lifeline to Better Health.
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu className="size-5" />
            </button>
            <span className="hidden text-xs text-[#9aa18f] sm:inline">
              My workspace
            </span>
            <span className="hidden text-[#cbd0c3] sm:inline">/</span>
            <span className="text-xs font-medium">{active}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-border bg-[#fafbf8] px-3 text-[10px] text-[#a0a795]"
              aria-label="Search features"
            >
              <Search className="size-3.5" />
              <span className="hidden md:inline">Search anything...</span>
              <span className="ml-8 hidden items-center gap-0.5 rounded border border-[#e6e9df] px-1 text-[9px] xl:flex">
                <Command className="size-2.5" /> K
              </span>
            </button>
            <button
              className="relative"
              aria-label={`Notifications, ${unread} unread`}
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell className="size-[18px] text-[#828a79]" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full border border-white bg-[#8d9f64]" />
              )}
            </button>
            <div className="h-7 w-px bg-border" />
            <Dropdown.Root>
              <Dropdown.Trigger asChild>
                <button
                  className="flex items-center gap-2.5"
                  aria-label="Account menu"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#e9e2d7] text-[10px] font-medium text-[#886a52]">
                    {initials(profile.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block text-[11px] font-medium">
                      {profile.name}
                    </span>
                    <span className="block text-[9px] text-[#a0a591]">
                      {firebaseConfigured ? "Personal account" : "Demo account"}
                    </span>
                  </span>
                  <ChevronDown className="size-3 text-[#9ba18f]" />
                </button>
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content
                  align="end"
                  sideOffset={12}
                  className="z-50 min-w-44 rounded-lg border border-border bg-white p-1.5 shadow-lg"
                >
                  <Dropdown.Item asChild>
                    <Link
                      className="flex items-center gap-2 rounded p-2 text-xs outline-none hover:bg-muted"
                      href="/profile"
                    >
                      <Settings className="size-4" />
                      Profile settings
                    </Link>
                  </Dropdown.Item>
                  {!firebaseConfigured && (
                    <>
                      <Dropdown.Item asChild>
                        <Link
                          className="block rounded p-2 text-xs hover:bg-muted"
                          href="/doctor/dashboard"
                        >
                          Doctor demo
                        </Link>
                      </Dropdown.Item>
                      <Dropdown.Item asChild>
                        <Link
                          className="block rounded p-2 text-xs hover:bg-muted"
                          href="/admin/dashboard"
                        >
                          Admin demo
                        </Link>
                      </Dropdown.Item>
                    </>
                  )}
                  <Dropdown.Separator className="my-1 h-px bg-border" />
                  <Dropdown.Item
                    onSelect={logout}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 text-xs outline-none hover:bg-muted"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </div>
        </header>
        <main id="main-content" className="page-content fade-in">
          {children}
          <footer className="dashboard-footer">
            <span>
              © {new Date().getFullYear()} UyirNadi. Thoughtfully built for your
              wellbeing.
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="size-2.5" /> Your health. Your journey. Our
              care.
            </span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          navigation[0].items[0],
          navigation[1].items[0],
          navigation[2].items[0],
          navigation[2].items[1],
          secondaryNavigation[0],
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={path === item.href ? "active" : ""}
          >
            <item.icon />
            <span>
              {item.label === "AI health assistant"
                ? "Assistant"
                : item.label === "Health reports"
                  ? "Reports"
                  : item.label}
            </span>
          </Link>
        ))}
      </nav>
      <Modal
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Find your way"
        description="Search tools, trackers and care services."
      >
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <input
            aria-label="Search UyirNadi"
            autoFocus
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Try water, appointments, reports..."
          />
        </div>
        <div className="mt-4 max-h-80 overflow-auto">
          {allLinks
            .filter((i) => i.label.toLowerCase().includes(search.toLowerCase()))
            .map((i) => (
              <Link
                href={i.href}
                key={i.href}
                onClick={() => setSearchOpen(false)}
                className="flex items-center gap-3 rounded-lg p-3 text-sm hover:bg-muted"
              >
                <i.icon className="size-4 text-primary" />
                {i.label}
                <ArrowUpRight className="ml-auto size-3" />
              </Link>
            ))}
        </div>
      </Modal>
      <Modal
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        title="Your notifications"
        description="Appointments, report updates, and other care updates."
      >
        {notifications.records.length ? (
          notifications.records.map((n) => (
            <button
              key={n.id}
              onClick={async () => {
                try {
                  await saveRecord("notifications", { read: true }, n.id);
                } catch {
                  toast.error("Unable to update notification.");
                }
              }}
              className="mb-2 block w-full rounded-lg border border-border p-4 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{String(n.title)}</span>
                {!n.read && <Badge>New</Badge>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {String(n.message)}
              </p>
            </button>
          ))
        ) : (
          <EmptyState
            title="You’re all caught up"
            description="Your care updates will appear here."
          />
        )}
      </Modal>
    </div>
  );
}
