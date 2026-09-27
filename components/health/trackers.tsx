"use client";
import { useState } from "react";
import {
  Plus,
  Minus,
  Droplets,
  Footprints,
  Scale,
  Trash2,
  Activity,
  Target,
} from "lucide-react";
import { useRecords, useProfile } from "@/hooks/use-records";
import { saveRecord, deleteRecord, saveProfile } from "@/lib/firestore/client";
import {
  Button,
  Card,
  PageHeader,
  Badge,
  Input,
  Field,
  EmptyState,
  ErrorState,
  Modal,
} from "@/components/ui";
import { RecordForm } from "@/components/forms/record-form";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { bmi, bmiCategory, today, dateLabel } from "@/lib/utils";
import { toast } from "sonner";
export function WaterTracker() {
  const data = useRecords("waterLogs");
  const profile = useProfile();
  const [amount, setAmount] = useState(250);
  const [busy, setBusy] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(2500);
  const goal = profile.waterGoal || 2500;
  const total = data.records
    .filter((r) => r.date === today())
    .reduce((s, r) => s + Number(r.amount), 0);
  const progress = Math.min(100, Math.round((total / goal) * 100));
  async function add() {
    if (amount <= 0 || amount > 3000) {
      toast.error("Choose an amount between 1 and 3000 ml.");
      return;
    }
    setBusy(true);
    try {
      await saveRecord("waterLogs", { date: today(), amount });
      toast.success(`${amount} ml added to today’s water intake.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="EVERYDAY WELLNESS"
        title="A little sip. A good habit."
        description="Make space in your day to hydrate."
        action={
          <Button
            variant="outline"
            onClick={() => {
              setGoalInput(goal);
              setEditingGoal(true);
            }}
          >
            <Target />
            Set daily goal
          </Button>
        }
      />
      {data.error && <ErrorState message={data.error} retry={data.refresh} />}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col items-center p-8">
          <Badge>Today’s hydration</Badge>
          <div
            className="relative my-8 flex size-56 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(#91b4bd ${progress}%, #edf2f1 0)`,
            }}
          >
            <div className="flex size-[204px] flex-col items-center justify-center rounded-full bg-white">
              <Droplets className="mb-3 size-7 text-[#91b4bd]" />
              <span className="text-4xl font-semibold tracking-tight">
                {(total / 1000).toFixed(2)}
                <span className="text-lg text-muted-foreground"> L</span>
              </span>
              <span className="mt-2 text-xs text-muted-foreground">
                of {goal / 1000} L · {progress}%
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {[150, 250, 500].map((v) => (
              <Button
                key={v}
                variant={amount === v ? "secondary" : "outline"}
                onClick={() => setAmount(v)}
              >
                {v} ml
              </Button>
            ))}
          </div>
          <div className="mt-4 flex w-full max-w-xs gap-2">
            <Input
              aria-label="Water amount in ml"
              type="number"
              min={1}
              max={3000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <Button onClick={add} disabled={busy}>
              <Plus />
              Add water
            </Button>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Your goal is personal. Follow your care team’s fluid guidance.
          </p>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="mb-5">Your hydration this week</h2>
            <ActivityChart records={data.records} />
          </Card>
          <Card className="p-6">
            <h2 className="mb-3">Today’s sips</h2>
            {data.records
              .filter((r) => r.date === today())
              .map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 border-b border-border py-3 last:border-0"
                >
                  <Droplets className="size-4 text-[#91b4bd]" />
                  <span className="flex-1 text-sm">{Number(r.amount)} ml</span>
                  <span className="text-xs text-muted-foreground">
                    {r.createdAt
                      ? new Date(r.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Today"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${r.amount} ml`}
                    onClick={async () => {
                      try {
                        await deleteRecord("waterLogs", r.id);
                        toast.success("Water entry removed.");
                      } catch {
                        toast.error("Could not remove entry.");
                      }
                    }}
                  >
                    <Minus />
                  </Button>
                </div>
              ))}
            {!data.records.some((r) => r.date === today()) && (
              <EmptyState
                title="A fresh start"
                description="Add your first glass of the day."
              />
            )}
          </Card>
        </div>
      </div>
      <Modal
        open={editingGoal}
        onOpenChange={setEditingGoal}
        title="Your daily water goal"
      >
        <Field label="Daily goal (ml)" htmlFor="goal">
          <Input
            id="goal"
            type="number"
            value={goalInput}
            min={250}
            max={10000}
            onChange={(e) => setGoalInput(Number(e.target.value))}
          />
        </Field>
        <Button
          className="mt-5"
          onClick={async () => {
            if (goalInput < 250 || goalInput > 10000) {
              toast.error("Enter a goal between 250 and 10,000 ml.");
              return;
            }
            try {
              await saveProfile({ ...profile, waterGoal: goalInput });
              setEditingGoal(false);
              toast.success("Daily goal updated.");
            } catch {
              toast.error("Could not save your goal.");
            }
          }}
        >
          Save goal
        </Button>
      </Modal>
    </>
  );
}
export function BMICalculator() {
  const profile = useProfile();
  const records = useRecords("bmiRecords");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  function calculate() {
    const h = Number(height || profile.height);
    const w = Number(weight || profile.weight);
    if (h < 30 || h > 260 || w < 2 || w > 500) {
      toast.error("Enter a valid height and weight.");
      return;
    }
    setResult(bmi(h, w));
  }
  return (
    <>
      <PageHeader
        eyebrow="KNOW YOUR NUMBERS"
        title="A clearer picture of your health"
        description="Calculate your BMI and follow changes over time."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-7">
          <div className="mb-6 flex items-center gap-2">
            <Scale className="size-5 text-primary" />
            <h2>BMI calculator</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Height (cm)" htmlFor="height">
              <Input
                id="height"
                type="number"
                placeholder={String(profile.height || "165")}
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  setResult(null);
                }}
              />
            </Field>
            <Field label="Weight (kg)" htmlFor="weight">
              <Input
                id="weight"
                type="number"
                placeholder={String(profile.weight || "60")}
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  setResult(null);
                }}
              />
            </Field>
          </div>
          <Button onClick={calculate} className="mt-5">
            Calculate BMI
          </Button>
          {result !== null && (
            <div className="mt-7 rounded-lg bg-[#eff4e9] p-6">
              <div className="flex items-end gap-3">
                <strong className="text-5xl font-semibold">{result}</strong>
                <Badge>{bmiCategory(result)}</Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                BMI relates weight to height. Age, body composition and health
                history also matter.
              </p>
              <Button
                disabled={busy}
                variant="outline"
                className="mt-5"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await saveRecord("bmiRecords", {
                      height: Number(height || profile.height),
                      weight: Number(weight || profile.weight),
                      date: today(),
                    });
                    toast.success("BMI saved to your history.");
                  } catch {
                    toast.error("Could not save BMI.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Save to my history
              </Button>
            </div>
          )}
          <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
            BMI is a general screening metric, not a complete assessment of
            health. Adult categories are not appropriate for children or
            pregnancy. Discuss your individual results with a healthcare
            professional.
          </p>
        </Card>
        <Card className="p-7">
          <h2 className="mb-5">Your BMI history</h2>
          {records.records.length ? (
            records.records.map((r) => (
              <div
                key={r.id}
                className="flex justify-between border-b border-border py-4 last:border-0"
              >
                <span className="text-sm">{dateLabel(String(r.date))}</span>
                <span className="text-sm font-medium">
                  {bmi(Number(r.height), Number(r.weight))}{" "}
                  <span className="ml-3 text-xs font-normal text-muted-foreground">
                    {String(r.weight)} kg
                  </span>
                </span>
              </div>
            ))
          ) : (
            <EmptyState
              title="Start your health story"
              description="Save a BMI calculation to see your history here."
            />
          )}
        </Card>
      </div>
    </>
  );
}
export function FitnessTracker() {
  const data = useRecords("fitnessLogs");
  const [open, setOpen] = useState(false);
  const [remove, setRemove] = useState<string | null>(null);
  const total = data.records
    .filter((r) => r.date === today())
    .reduce((s, r) => s + Number(r.duration), 0);
  return (
    <>
      <PageHeader
        eyebrow="MOVE IN YOUR OWN WAY"
        title="Every movement counts"
        description="A walk, a stretch, a new personal best. It all belongs here."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Log activity
          </Button>
        }
      />
      {data.error && <ErrorState message={data.error} retry={data.refresh} />}
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active today", value: `${total} min`, icon: Footprints },
          {
            label: "Recorded sessions",
            value: data.records.length,
            icon: Activity,
          },
          {
            label: "Total recorded time",
            value: `${data.records.reduce((s, r) => s + Number(r.duration), 0)} min`,
            icon: Target,
          },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <s.icon className="size-4" />
              {s.label}
            </div>
            <p className="mt-4 text-3xl font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>
      <Card className="mb-5 p-6">
        <h2 className="mb-5">Your week in motion</h2>
        <ActivityChart records={data.records} metric="activity" />
      </Card>
      <Card>
        <div className="p-5">
          <h2>Activity journal</h2>
        </div>
        {data.records.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Calories (self-reported)</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{String(r.activity)}</td>
                    <td>{dateLabel(String(r.date))}</td>
                    <td>{String(r.duration)} min</td>
                    <td>{r.calories ? String(r.calories) : "Not recorded"}</td>
                    <td>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete activity"
                        onClick={() => setRemove(r.id)}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No fitness activities recorded"
            action={
              <Button onClick={() => setOpen(true)}>
                Record your first activity
              </Button>
            }
          />
        )}
      </Card>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="A little movement, recorded"
        description="Calories are optional and are not medically verified."
      >
        <RecordForm
          fields={[
            {
              name: "activity",
              label: "Activity",
              type: "select",
              options: [
                "Walking",
                "Running",
                "Cycling",
                "Gym",
                "Yoga",
                "Other",
              ],
              required: true,
            },
            {
              name: "duration",
              label: "Duration (minutes)",
              type: "number",
              min: 1,
              max: 1440,
            },
            { name: "date", label: "Date", type: "date", required: true },
            {
              name: "calories",
              label: "Calories (optional)",
              type: "number",
              min: 0,
              max: 10000,
            },
          ]}
          initial={{ date: today(), activity: "Walking", duration: 30 }}
          onSubmit={async (values) => {
            await saveRecord("fitnessLogs", values);
            setOpen(false);
            toast.success("Activity recorded. Keep showing up for yourself.");
          }}
          submitLabel="Save activity"
        />
      </Modal>
      <Modal
        open={!!remove}
        onOpenChange={() => setRemove(null)}
        title="Delete this activity?"
        description="This will remove it from your activity history."
      >
        <Button
          variant="destructive"
          onClick={async () => {
            try {
              await deleteRecord("fitnessLogs", remove!);
              setRemove(null);
              toast.success("Activity deleted.");
            } catch {
              toast.error("Could not delete activity.");
            }
          }}
        >
          Delete activity
        </Button>
      </Modal>
    </>
  );
}
export function HealthAnalytics() {
  const water = useRecords("waterLogs");
  const fitness = useRecords("fitnessLogs");
  const weight = useRecords("bmiRecords");
  const reports = useRecords("healthReports");
  const appointments = useRecords("appointments");
  return (
    <>
      <PageHeader
        eyebrow="THE BIGGER PICTURE"
        title="Your health, over time"
        description="Get to know the habits that make you feel like you."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        {[
          { title: "Water intake", data: water, metric: "water" as const },
          {
            title: "Activity minutes",
            data: fitness,
            metric: "activity" as const,
          },
          { title: "Weight trend", data: weight, metric: "weight" as const },
        ].map((c) => (
          <Card key={c.title} className="p-6">
            <h2 className="mb-6">{c.title}</h2>
            {c.data.error ? (
              <ErrorState message={c.data.error} retry={c.data.refresh} />
            ) : (
              <ActivityChart records={c.data.records} metric={c.metric} />
            )}
          </Card>
        ))}
        <Card className="p-6">
          <h2>Care at a glance</h2>
          <div className="mt-6 space-y-6">
            <div><p className="text-xs text-muted-foreground">Your health documents</p><p className="mt-2 text-3xl font-semibold">{reports.records.length}</p><p className="mt-1 text-xs text-muted-foreground">Private reports saved to your account.</p></div>
            <div className="flex justify-between border-t border-border pt-5">
              <span className="text-sm">Completed appointments</span>
              <Badge>
                {
                  appointments.records.filter((a) => a.status === "completed")
                    .length
                }
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Upcoming care</span>
              <Badge>
                {
                  appointments.records.filter(
                    (a) =>
                      String(a.date) >= today() &&
                      ["pending", "confirmed"].includes(String(a.status)),
                  ).length
                }
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
