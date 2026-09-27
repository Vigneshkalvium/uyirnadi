"use client";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  Phone,
  Search,
  ArrowUpRight,
  LifeBuoy,
  Upload,
} from "lucide-react";
import { useProfile, useRecords } from "@/hooks/use-records";
import { saveProfile, saveRecord, api } from "@/lib/firestore/client";
import { firebaseConfigured } from "@/lib/firebase/client";
import {
  Button,
  Card,
  PageHeader,
  Badge,
  Input,
  Modal,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { RecordForm, type FormField } from "@/components/forms/record-form";
import { initials } from "@/lib/utils";
import type { Profile, RecordData } from "@/types";
const profileFields: FormField[] = [
  { name: "name", label: "Full name", required: true },
  { name: "phone", label: "Phone number" },
  { name: "dateOfBirth", label: "Date of birth", type: "date" },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: ["Woman", "Man", "Non-binary", "Prefer not to say"],
  },
  { name: "height", label: "Height (cm)", type: "number", min: 30, max: 260 },
  { name: "weight", label: "Weight (kg)", type: "number", min: 2, max: 500 },
  {
    name: "dietaryPreference",
    label: "Dietary preference",
    type: "select",
    options: ["No preference", "Vegetarian", "Vegan", "Pescatarian"],
  },
  { name: "emergencyContact", label: "Emergency contact name and phone" },
];
export function ProfilePage() {
  const profile = useProfile();
  const [uploading, setUploading] = useState(false);
  return (
    <>
      <PageHeader
        eyebrow="YOUR OWN KIND OF WELL"
        title="A little about you"
        description="Keep your details up to date for a more personal care experience."
      />
      <div className="grid items-start gap-5 lg:grid-cols-[280px_1fr]">
        <Card className="p-6 text-center">
          {profile.photoPath ? (
            <Image
              src={`/api/upload?path=${encodeURIComponent(profile.photoPath)}`}
              alt="Your profile"
              width={80}
              height={80}
              unoptimized
              className="mx-auto size-20 rounded-full object-cover"
            />
          ) : (
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-[#e9e2d7] text-xl text-[#937958]">
              {initials(profile.name)}
            </span>
          )}
          <h2 className="mt-4">{profile.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{profile.email}</p>
          <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs">
            <Upload className="size-3.5" />
            {uploading ? "Uploading..." : "Change photo"}
            <input
              className="sr-only"
              type="file"
              accept="image/png,image/jpeg"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!firebaseConfigured) {
                  toast.info(
                    "Profile photo uploads require Firebase configuration.",
                  );
                  return;
                }
                setUploading(true);
                try {
                  const body = new FormData();
                  body.append("file", f);
                  body.append("folder", "profile");
                  const result = await api<{ storagePath: string }>(
                    "/api/upload",
                    { method: "POST", body },
                  );
                  await saveProfile({
                    ...profile,
                    photoPath: result.storagePath,
                  });
                  toast.success("Profile photo updated.");
                } catch (e) {
                  toast.error(
                    e instanceof Error ? e.message : "Upload failed.",
                  );
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
          <div className="mt-6 border-t border-border pt-5 text-left">
            <p className="flex items-center gap-2 text-xs font-medium text-primary">
              <ShieldCheck className="size-4" />
              Your information, your choice
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Only share what you’re comfortable with. Your personal health
              information is private by default.
            </p>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="mb-6">Personal details</h2>
          {profile.name !== "there" && (
            <RecordForm
              key={JSON.stringify(profile)}
              fields={profileFields}
              initial={profile as unknown as Record<string, unknown>}
              onSubmit={async (data) => {
                await saveProfile({ ...profile, ...data } as Profile);
                toast.success("Your profile has been updated.");
              }}
            />
          )}
          <p className="mt-6 text-xs text-muted-foreground">
            Email is managed by your sign-in provider and cannot be changed
            here.
          </p>
        </Card>
      </div>
    </>
  );
}
export function FeedbackPage() {
  const records = useRecords("feedback");
  return (
    <>
      <PageHeader
        eyebrow="WE’RE LISTENING"
        title="Better care starts with your voice"
        description="Share a thought, ask for help, or tell us what could be better."
      />
      <div className="grid items-start gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <h2 className="mb-6">Leave us a message</h2>
          <RecordForm
            fields={[
              {
                name: "category",
                label: "How can we help?",
                type: "select",
                options: ["Feedback", "Support", "Suggestion", "Contact"],
                required: true,
              },
              {
                name: "rating",
                label: "Your experience (1–5)",
                type: "number",
                min: 1,
                max: 5,
              },
              {
                name: "message",
                label: "Your message",
                type: "textarea",
                required: true,
                placeholder:
                  "Please avoid including sensitive medical information.",
              },
            ]}
            initial={{ category: "Feedback", rating: 5 }}
            onSubmit={async (data) => {
              if (String(data.message).length < 10)
                throw new Error("Please write at least 10 characters.");
              await saveRecord("feedback", data);
              toast.success("Thank you. Your message has been received.");
            }}
            submitLabel="Send message"
          />
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <LifeBuoy className="mb-4 size-6 text-primary" />
            <h2>A helping hand</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              This form reaches the platform team. For medical questions, please
              contact your healthcare professional. For an emergency, contact
              local emergency services.
            </p>
          </Card>
          <Card className="p-6">
            <h2>Your submissions</h2>
            {records.records.length ? (
              records.records.map((r) => (
                <div key={r.id} className="mt-4 border-t border-border pt-4">
                  <Badge tone="gray">{String(r.category)}</Badge>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {String(r.message)}
                  </p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {r.status ? String(r.status) : "Received"}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="Nothing sent yet"
                description="We’re here when you need us."
              />
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
export function HealthTips() {
  const tips = useRecords("healthTips");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<RecordData | null>(null);
  const categories = [
    "All",
    "Nutrition",
    "Fitness",
    "Preventive Care",
    "Mental Wellness",
    "General Health",
    "Medicine Safety",
  ];
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE EVERYDAY INSPIRATION"
        title="Good to know. Good for you."
        description="Simple ideas to make a little more room for your wellbeing."
      />
      <div className="mb-5 relative max-w-md">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          className="pl-10"
          aria-label="Search health tips"
          placeholder="Find a little inspiration..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button
            size="sm"
            key={c}
            variant={category === c ? "secondary" : "ghost"}
            onClick={() => setCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>
      {tips.error && <ErrorState message={tips.error} retry={tips.refresh} />}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tips.records
          .filter(
            (t) =>
              t.published &&
              (category === "All" || t.category === category) &&
              `${t.title} ${t.description}`
                .toLowerCase()
                .includes(query.toLowerCase()),
          )
          .map((t) => (
            <Card key={t.id} className="overflow-hidden">
              <div className="relative h-48 bg-[#edf1e4]">
                <Image
                  src={String(t.image || "/walking.svg")}
                  alt={String(t.title)}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <Badge>{String(t.category)}</Badge>
                <h2 className="mt-3 text-lg">{String(t.title)}</h2>
                <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {String(t.description)}
                </p>
                <Button
                  className="mt-5 !px-0"
                  variant="ghost"
                  onClick={() => setSelected(t)}
                >
                  Read a little more
                  <ArrowUpRight />
                </Button>
              </div>
            </Card>
          ))}
      </div>
      {tips.records.length === 0 && (
        <Card>
          <EmptyState
            title="A little inspiration is on its way"
            description="Published health education from your care team will appear here."
          />
        </Card>
      )}
      <Modal
        open={!!selected}
        onOpenChange={() => setSelected(null)}
        title={String(selected?.title || "Health tip")}
        description={String(selected?.category || "General wellness")}
      >
        <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {String(selected?.description || "")}
        </p>
        <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
          General education only. Discuss individual health needs with your care
          team.
        </p>
      </Modal>
    </>
  );
}
export function EmergencyPage() {
  const contacts = useRecords("emergencyContacts");
  return (
    <>
      <PageHeader
        eyebrow="WHEN EVERY MOMENT MATTERS"
        title="Help, within reach"
        description="Find configured emergency services and your personal emergency contact."
      />
      <Card className="mb-6 !border-[#efd8d0] !bg-[#fff6f1] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="rounded-xl bg-white p-3">
            <Phone className="size-6 text-[#b97560]" />
          </span>
          <div>
            <h2 className="text-xl text-[#955e4c]">
              Experiencing a medical emergency?
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a98272]">
              Call your local emergency number or go to the nearest emergency
              department. Do not wait for an AI response or an online
              appointment.
            </p>
            {contacts.records.find((c) => c.category === "Emergency") && (
              <Button asChild className="mt-5 bg-[#a86851]">
                <a
                  href={`tel:${String(contacts.records.find((c) => c.category === "Emergency")!.phone).replace(/[^+\d]/g, "")}`}
                >
                  <Phone />
                  Call{" "}
                  {String(
                    contacts.records.find((c) => c.category === "Emergency")!
                      .phone,
                  )}
                </a>
              </Button>
            )}
            <p className="mt-4 text-[10px] text-[#a98272]">
              Tapping a call button opens your device’s dialer. UyirNadi does
              not contact emergency services automatically.
            </p>
          </div>
        </div>
      </Card>
      {contacts.error && (
        <ErrorState message={contacts.error} retry={contacts.refresh} />
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {contacts.records.map((c) => (
          <Card key={c.id} className="p-6">
            <Badge tone={c.category === "Emergency" ? "red" : "gray"}>
              {String(c.category)}
            </Badge>
            <h2 className="mt-4">{String(c.name)}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {String(c.region)}
            </p>
            <a
              href={`tel:${String(c.phone).replace(/[^+\d]/g, "")}`}
              className="mt-5 flex items-center gap-3 text-xl font-semibold text-primary"
            >
              <Phone className="size-5" />
              {String(c.phone)}
            </a>
          </Card>
        ))}
      </div>
      {!contacts.records.length && (
        <Card>
          <EmptyState
            icon={Phone}
            title="Local contacts haven’t been configured"
            description="Use your device’s emergency calling feature or contact your known local emergency number. An administrator can add verified services for your region."
          />
        </Card>
      )}
      <PersonalContact />
    </>
  );
}
function PersonalContact() {
  const profile = useProfile();
  return (
    <Card className="mt-5 p-6">
      <h2>My emergency contact</h2>
      {profile.emergencyContact ? (
        <p className="mt-4 text-sm">{profile.emergencyContact}</p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Add a trusted person’s details to your profile so they’re easy to
          find.
        </p>
      )}
      <Button asChild variant="outline" className="mt-4">
        <a href="/profile">Update my emergency contact</a>
      </Button>
    </Card>
  );
}
