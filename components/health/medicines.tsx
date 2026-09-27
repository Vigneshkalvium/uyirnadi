"use client";
import { useState } from "react";
import { Pill, Plus, Check, Clock, Pencil, Trash2, Bell } from "lucide-react";
import { toast } from "sonner";
import { useRecords } from "@/hooks/use-records";
import { saveRecord, deleteRecord } from "@/lib/firestore/client";
import { today } from "@/lib/utils";
import {
  Button,
  Card,
  Badge,
  PageHeader,
  Modal,
  EmptyState,
  ErrorState,
} from "@/components/ui";
import { RecordForm, type FormField } from "@/components/forms/record-form";
import type { RecordData } from "@/types";
import { enableNotifications } from "@/lib/notifications/client";
const fields: FormField[] = [
  { name: "name", label: "Medicine name", required: true },
  { name: "dosage", label: "Dosage from your prescription", required: true },
  {
    name: "frequency",
    label: "Frequency",
    type: "select",
    options: ["Daily", "Twice daily", "As needed"],
    required: true,
  },
  { name: "time", label: "Reminder time", type: "time", required: true },
  { name: "startDate", label: "Start date", type: "date", required: true },
  { name: "endDate", label: "End date", type: "date", required: true },
  { name: "instructions", label: "Instructions", type: "textarea" },
];
export function Medicines() {
  const medicines = useRecords("medicines");
  const logs = useRecords("medicineLogs");
  const [form, setForm] = useState<RecordData | true | null>(null);
  const [remove, setRemove] = useState<string | null>(null);
  const [history, setHistory] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  async function log(med: RecordData, status: string) {
    setBusy(med.id);
    try {
      const existing = logs.records.find(
        (l) =>
          l.medicineId === med.id && l.date === today() && l.time === med.time,
      );
      await saveRecord(
        "medicineLogs",
        { medicineId: med.id, date: today(), time: med.time, status },
        existing?.id,
      );
      toast.success(
        status === "taken" ? "Marked as taken." : "Marked as skipped.",
      );
    } catch {
      toast.error("Could not update your medicine.");
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE CONSISTENCY"
        title="Your medicines, in good time"
        description="Stay connected to the care plan you’ve agreed with your doctor."
        action={
          <Button onClick={() => setForm(true)}>
            <Plus />
            Add medicine
          </Button>
        }
      />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Button
            variant={!history ? "secondary" : "ghost"}
            onClick={() => setHistory(false)}
          >
            My medicines
          </Button>
          <Button
            variant={history ? "secondary" : "ghost"}
            onClick={() => setHistory(true)}
          >
            Check-in history
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            try {
              await enableNotifications();
              toast.success("Browser notifications enabled.");
            } catch (e) {
              toast.error(
                e instanceof Error
                  ? e.message
                  : "Could not enable notifications.",
              );
            }
          }}
        >
          <Bell />
          Enable reminders
        </Button>
      </div>
      {medicines.error && (
        <ErrorState message={medicines.error} retry={medicines.refresh} />
      )}
      <Card>
        {history ? (
          <>
            <div className="p-5">
              <h2>Medicine check-in history</h2>
            </div>
            {logs.records.length ? (
              logs.records.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between border-t border-border p-5"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {String(
                        medicines.records.find((m) => m.id === l.medicineId)
                          ?.name || "Medicine",
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(l.date)} · {String(l.time)}
                    </p>
                  </div>
                  <Badge tone={l.status === "taken" ? "green" : "amber"}>
                    {String(l.status)}
                  </Badge>
                </div>
              ))
            ) : (
              <EmptyState
                title="No check-ins yet"
                description="Mark a medicine as taken or skipped to start your history."
              />
            )}
          </>
        ) : medicines.records.length ? (
          medicines.records
            .sort((a, b) => String(a.time).localeCompare(String(b.time)))
            .map((m) => {
              const status = logs.records.find(
                (l) =>
                  l.medicineId === m.id &&
                  l.date === today() &&
                  l.time === m.time,
              )?.status;
              const active =
                String(m.startDate) <= today() && String(m.endDate) >= today();
              return (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center gap-4 border-b border-border p-5 last:border-0 sm:p-6"
                >
                  <div className="rounded-xl bg-[#f1edf4] p-3 text-[#a190ad]">
                    <Pill className="size-5" />
                  </div>
                  <div className="min-w-40 flex-1">
                    <h2>{String(m.name)}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(m.dosage)} · {String(m.frequency)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {String(m.instructions || "Follow your prescription")}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {String(m.startDate)} → {String(m.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    {String(m.time)} IST
                  </div>
                  <div className="flex gap-2">
                    {status ? (
                      <Badge tone={status === "taken" ? "green" : "amber"}>
                        {String(status) === "taken" && (
                          <Check className="size-3" />
                        )}
                        {String(status)}
                      </Badge>
                    ) : active ? (
                      <>
                        <Button
                          size="sm"
                          disabled={busy === m.id}
                          onClick={() => log(m, "taken")}
                        >
                          Mark taken
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy === m.id}
                          onClick={() => log(m, "skipped")}
                        >
                          Skip
                        </Button>
                      </>
                    ) : (
                      <Badge tone="gray">Outside date range</Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Edit ${m.name}`}
                      onClick={() => setForm(m)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Delete ${m.name}`}
                      onClick={() => setRemove(m.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            })
        ) : (
          <EmptyState
            title="No medicines added"
            description="Add a reminder using the instructions on your prescription."
            action={
              <Button onClick={() => setForm(true)}>
                <Plus />
                Add your first medicine
              </Button>
            }
          />
        )}
      </Card>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Reminders support your existing care plan. Never change a medicine or
        dose without speaking with your clinician. For twice-daily medicines,
        create one reminder for each prescribed time. Push delivery depends on
        browser support and notification permission.
      </p>
      <Modal
        open={!!form}
        onOpenChange={() => setForm(null)}
        title={
          typeof form === "object" && form ? "Edit medicine" : "Add a medicine"
        }
        description="Enter the exact details from your prescription. Reminder times use India Standard Time."
      >
        <RecordForm
          fields={fields}
          initial={
            typeof form === "object" && form
              ? form
              : {
                  startDate: today(),
                  endDate: today(),
                  time: "08:00",
                  frequency: "Daily",
                }
          }
          onSubmit={async (data) => {
            if (String(data.endDate) < String(data.startDate))
              throw new Error("End date must be on or after the start date.");
            await saveRecord(
              "medicines",
              data,
              typeof form === "object" && form ? form.id : undefined,
            );
            setForm(null);
            toast.success("Medicine reminder saved.");
          }}
          submitLabel="Save reminder"
        />
      </Modal>
      <Modal
        open={!!remove}
        onOpenChange={() => setRemove(null)}
        title="Delete this medicine reminder?"
        description="The reminder will be removed. Existing check-in history is retained."
      >
        <Button
          variant="destructive"
          onClick={async () => {
            try {
              await deleteRecord("medicines", remove!);
              setRemove(null);
              toast.success("Reminder deleted.");
            } catch {
              toast.error("Could not delete reminder.");
            }
          }}
        >
          Delete reminder
        </Button>
      </Modal>
    </>
  );
}
