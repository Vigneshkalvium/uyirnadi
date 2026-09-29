"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Plus,
  Scale,
  Droplets,
  Footprints,
  MessageCircle,
  Tablets,
  Stethoscope,
  FileUp,
  Clock,
  FileText,
  Download,
  Sparkles,
  Leaf,
  ShieldCheck,
  Sun,
  Video,
} from "lucide-react";
import { useRecords, useProfile } from "@/hooks/use-records";
import { saveRecord } from "@/lib/firestore/client";
import { today, bmi, bmiCategory, dateLabel } from "@/lib/utils";
import {
  Button,
  Card,
  Badge,
  PageHeader,
  LoadingCards,
  ErrorState,
  EmptyState,
} from "@/components/ui";
import { Botanical } from "./botanical";
import { ActivityChart } from "./activity-chart";
import { toast } from "sonner";
export function Dashboard() {
  const profile = useProfile();
  const water = useRecords("waterLogs");
  const fitness = useRecords("fitnessLogs");
  const appointments = useRecords("appointments");
  const reports = useRecords("healthReports");
  const tips = useRecords("healthTips");
  const [chart, setChart] = useState<"water" | "activity">("water");
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const todayWater = water.records.filter((r) => r.date === today());
  const amount = todayWater.reduce((s, r) => s + Number(r.amount), 0);
  const goal = profile.waterGoal || 2500;
  const progress = Math.min(100, Math.round((amount / goal) * 100));
  const minutes = fitness.records
    .filter((r) => r.date === today())
    .reduce((s, r) => s + Number(r.duration), 0);
  const score =
    profile.height && profile.weight
      ? bmi(profile.height, profile.weight)
      : null;
  const upcoming = appointments.records
    .filter(
      (a) =>
        String(a.date) >= today() &&
        ["pending", "confirmed"].includes(String(a.status)),
    )
    .sort((a, b) =>
      `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`),
    )[0];
  const tip = tips.records[0];
  async function addWater() {
    setBusy(true);
    try {
      await saveRecord("waterLogs", { date: today(), amount: 250 });
      toast.success("250 ml added. A little sip, a good habit.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add water.");
    } finally {
      setBusy(false);
    }
  }
  const actions = [
    {
      label: "AI assistant",
      href: "/chatbot",
      icon: MessageCircle,
      color: "#ebf0e3",
    },
    {
      label: "Tablet guide",
      href: "/medicines",
      icon: Tablets,
      color: "#f0ebf4",
    },
    {
      label: "Check symptoms",
      href: "/symptom-checker",
      icon: Stethoscope,
      color: "#f9eee4",
    },
    {
      label: "Upload report",
      href: "/reports",
      icon: FileUp,
      color: "#eaf1f5",
    },
    {
      label: "Book appointment",
      href: "/appointments",
      icon: CalendarDays,
      color: "#f7eced",
    },
    { label: "Nutrition plan", href: "/nutrition", icon: Leaf, color: "#f6f2df" },
  ];
  return (
    <>
      <PageHeader
        title={`Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, ${profile.name.split(" ")[0]}`}
        description="A little care today. A healthier tomorrow."
        action={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-[10px] text-[#88917e]">
            <CalendarDays className="size-3.5" />
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString("en-IN", { weekday: "short" })}
              ,{" "}
            </span>
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        }
      />
      <section className="hero mb-6">
        <div className="relative z-10">
          <div className="mb-3 flex items-center gap-1.5 text-[9px] font-medium tracking-[1.4px] text-[#81926b]">
            <span className="size-1.5 rounded-full bg-[#8ca570]" /> YOUR HEALTH,
            AT THE HEART OF IT ALL
          </div>
          <h2>
            Your wellness journey,
            <br />a little more connected.
          </h2>
          <p className="mt-3 max-w-[300px] text-[11px] leading-[1.8] text-[#8b957c]">
            From everyday habits to expert care, we’re here
            <br className="hidden sm:block" /> to help you feel your best.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-4 h-8 bg-[#466b45] text-[10px]"
          >
            <Link href="/chatbot">
              <Sparkles className="!size-3" />
              Let’s talk about your health
              <ArrowUpRight className="!size-3" />
            </Link>
          </Button>
        </div>
        <Botanical />
      </section>
      {water.error ? (
        <ErrorState message={water.error} retry={water.refresh} />
      ) : water.loading ? (
        <LoadingCards />
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-3 xl:gap-4 lg:grid-cols-4">
          <Card className="metric-card">
            <div className="metric-label">
              <Scale className="text-[#8b9e72]" />
              Body mass index
              <Link href="/bmi" aria-label="View BMI" className="ml-auto">
                <ArrowUpRight className="!size-3 text-[#adb49e]" />
              </Link>
            </div>
            <div className="mt-5 flex items-end justify-between gap-1">
              <div className="metric-number">
                {score ?? "—"}
                <span className="metric-unit">kg/m²</span>
              </div>
              {score && <Badge>{bmiCategory(score)}</Badge>}
            </div>
            <div className="mt-5 flex h-1 gap-1">
              <div className="flex-1 rounded bg-[#dce6d0]" />
              <div className="relative flex-1 rounded bg-[#aabd87]">
                <span className="absolute -top-1 left-1/2 h-3 w-1 rounded bg-[#6d8451]" />
              </div>
              <div className="flex-1 rounded bg-[#e9dfb8]" />
              <div className="flex-1 rounded bg-[#eccfc1]" />
            </div>
            <p className="mt-2 text-[9px] text-[#a0a78f]">
              {score
                ? "A general health screening metric"
                : "Add your height and weight"}
            </p>
          </Card>
          <Card className="metric-card">
            <div className="metric-label">
              <Droplets className="text-[#80a4b6]" />
              Water intake
              <button
                className="ml-auto"
                onClick={addWater}
                disabled={busy}
                aria-label="Add 250 ml of water"
              >
                <Plus className="!size-3 text-[#95a9b1]" />
              </button>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div className="metric-number">
                {(amount / 1000).toFixed(2).replace(/0$/, "")}
                <span className="metric-unit">/ {goal / 1000} L</span>
              </div>
              <span className="text-[10px] text-[#91a3a9]">{progress}%</span>
            </div>
            <div className="progress-track mt-5">
              <div
                className="progress-fill !bg-[#a7c3cd]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[9px] text-[#a0a78f]">
              Every sip is a little self-care
            </p>
          </Card>
          <Card className="metric-card">
            <div className="metric-label">
              <Footprints className="text-[#bfa17e]" />
              Active minutes
              <Link
                href="/fitness"
                aria-label="View activity"
                className="ml-auto"
              >
                <ArrowUpRight className="!size-3 text-[#adb49e]" />
              </Link>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div className="metric-number">
                {minutes}
                <span className="metric-unit">mins today</span>
              </div>
              <span className="text-[9px] text-[#9a977d]">Keep moving</span>
            </div>
            <div className="mt-3 flex h-[13px] items-end gap-1.5">
              {[
                3, 5, 4, 8, 6, 10, 7, 11, 8, 13, 9, 12, 7, 10, 13, 9, 12, 8, 10,
                13,
              ].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-sm bg-[#d9c6a8]"
                  style={{ height: `${minutes ? h : 2}px` }}
                />
              ))}
            </div>
            <p className="mt-2 text-[9px] text-[#a0a78f]">
              {fitness.records.filter((r) => r.date === today()).length}{" "}
              activities recorded today
            </p>
          </Card>
          <Card className="metric-card"><div className="metric-label"><FileText/>Health documents<Link href="/reports" className="ml-auto" aria-label="View reports"><ArrowUpRight/></Link></div><div className="mt-5 metric-number">{reports.records.length}<span className="metric-unit">reports saved</span></div><p className="mt-5 text-xs text-muted-foreground">Your records, securely in one place.</p></Card>
        </div>
      )}
      <section className="mb-6">
        <div className="section-heading">
          <h2>A little help, right here</h2>
          <span className="text-[9px] text-[#9ba38c]">
            Your everyday health essentials
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
          {actions.map((a) => (
            <Link key={a.href} href={a.href} className="quick-action">
              <span className="quick-icon" style={{ background: a.color }}>
                <a.icon />
              </span>
              {a.label}
            </Link>
          ))}
        </div>
      </section>
      <div className="dashboard-grid">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="section-heading">
              <div>
                <h2>Your week in wellness</h2>
                <p className="mt-1 text-[10px] text-[#9ca48e]">
                  Small, consistent steps make a difference.
                </p>
              </div>
              <select
                aria-label="Chart date range"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="rounded-md border border-border bg-white px-2 py-1.5 text-[9px] text-[#8c967d]"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
              </select>
            </div>
            <div className="mb-2 flex gap-5">
              <button
                onClick={() => setChart("water")}
                className={`flex items-center gap-1.5 border-b pb-2 text-[10px] ${chart === "water" ? "border-[#9caf7e] text-[#718958]" : "border-transparent text-[#abb19f]"}`}
              >
                <Droplets className="size-3" />
                Water intake
              </button>
              <button
                onClick={() => setChart("activity")}
                className={`flex items-center gap-1.5 border-b pb-2 text-[10px] ${chart === "activity" ? "border-[#9caf7e] text-[#718958]" : "border-transparent text-[#abb19f]"}`}
              >
                <Footprints className="size-3" />
                Activity
              </button>
              <span className="ml-auto flex items-center gap-1 text-[9px] text-[#9aa48a]">
                <span className="size-1.5 rounded-full bg-[#aabd87]" />{" "}
                {chart === "water" ? "Water intake" : "Active minutes"}
              </span>
            </div>
            <ActivityChart
              records={chart === "water" ? water.records : fitness.records}
              metric={chart}
              days={days}
            />
          </Card>

          <Card className="p-5">
            <div className="section-heading">
              <h2>Your health documents</h2>
              <Link href="/reports" className="section-link">
                View all
                <ChevronRight className="size-3" />
              </Link>
            </div>
            {reports.records.length ? (
              reports.records.slice(0, 2).map((r, i) => (
                <Link
                  key={r.id}
                  href="/reports"
                  className={`flex items-center gap-3 py-3 ${i ? "border-t border-[#f0f2e9]" : ""}`}
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#f7eee9] text-[#c3a087]">
                    <FileText className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium">{String(r.name)}</p>
                    <p className="mt-1 text-[9px] text-[#a0a78f]">
                      {dateLabel(r.createdAt || today())}{" "}
                      <span className="mx-1">·</span>{" "}
                      {r.demo ? "Demo document" : "Private document"}
                    </p>
                  </div>
                  <span className="mr-2 hidden sm:inline">
                    <Badge tone="gray">
                      {r.analysis ? "Analyzed" : "Uploaded"}
                    </Badge>
                  </span>
                  <Download className="size-3.5 text-[#9ba78d]" />
                </Link>
              ))
            ) : (
              <EmptyState
                title="No health reports yet"
                action={
                  <Button asChild size="sm">
                    <Link href="/reports">Upload a report</Link>
                  </Button>
                }
              />
            )}
          </Card>
        </div>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="section-heading">
              <h2>Your next appointment</h2>
              <Link href="/appointments" aria-label="View appointments">
                <ArrowUpRight className="size-3.5 text-[#a3ad95]" />
              </Link>
            </div>
            {upcoming ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <Image
                    src="/doctor.svg"
                    alt="Illustrated doctor avatar"
                    width={45}
                    height={45}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="text-xs font-medium">
                      {String(upcoming.doctorName)}
                    </h3>
                    <p className="mt-1 text-[10px] text-[#a0a68e]">
                      {String(upcoming.specialization)}
                    </p>
                    <span className="mt-1 inline-flex items-center gap-1 text-[9px] text-[#889776]">
                      <ShieldCheck className="size-2.5" />
                      {upcoming.id.startsWith("demo")
                        ? "Demo doctor profile"
                        : "Care provider"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-[#f6f8f1] px-3 py-3 text-[10px] text-[#859371]">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5" />
                    {dateLabel(String(upcoming.date))}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {String(upcoming.time)}
                  </span>
                </div>
                <div className="my-3.5 flex items-center gap-1.5 text-[9px] text-[#9aa389]">
                  <Video className="size-3" />
                  Consultation{" "}
                  <span className="ml-auto">
                    <Badge>{String(upcoming.status)}</Badge>
                  </span>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="h-8 w-full text-[10px]"
                >
                  <Link href="/appointments">
                    View appointment details
                    <ArrowRight className="!size-3" />
                  </Link>
                </Button>
              </>
            ) : (
              <EmptyState
                title="No upcoming appointments"
                action={
                  <Button asChild size="sm">
                    <Link href="/appointments">Find a doctor</Link>
                  </Button>
                }
              />
            )}
          </Card>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-1.5 px-5 pt-4 pb-3 text-[9px] font-medium tracking-wider text-[#8c9b78]">
              <Leaf className="size-3" />A MOMENT FOR YOUR WELLBEING
            </div>
            {tip ? (
              <>
                <div className="relative mx-4 h-[113px] overflow-hidden rounded-lg">
                  <Image
                    src={String(tip.image || "/walking.svg")}
                    alt="A peaceful outdoor walk"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
                <div className="p-5 pt-3">
                  <div className="mb-2 flex items-center gap-1 text-[8px] text-[#94a17e]">
                    <Sun className="size-3" />
                    {String(tip.category)} <span className="mx-1">·</span> 2 min
                    read
                  </div>
                  <h3 className="text-[14px] font-medium">
                    {String(tip.title)}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-[#9aa18b]">
                    {String(tip.description)}
                  </p>
                  <Link href="/health-tips" className="section-link mt-3">
                    A little inspiration
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </>
            ) : (
              <EmptyState
                title="Good things are on the way"
                description="Health education from your care team will appear here."
              />
            )}
          </Card>
          <div className="relative overflow-hidden rounded-xl border border-[#e2e8d6] bg-[#eef3e5] p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="rounded-lg bg-white/80 p-1.5">
                <Sparkles className="size-4 text-[#8b9f6b]" />
              </span>
              <span className="text-[12px] font-medium">
                A caring conversation away
              </span>
            </div>
            <p className="max-w-[245px] text-[10px] leading-[1.8] text-[#909c7e]">
              Health on your mind? Get simple, thoughtful guidance from your AI
              health companion.
            </p>
            <Link
              href="/chatbot"
              className="mt-4 flex items-center justify-between text-[10px] font-medium text-[#778d5d]"
            >
              Talk to your AI assistant
              <ArrowUpRight className="size-3.5" />
            </Link>
            <p className="mt-3 border-t border-[#dde5cf] pt-2.5 text-[8px] text-[#a3ad94]">
              Here to guide you. Never a substitute for your doctor.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
