"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Search,
  ShieldAlert,
  Stethoscope,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type Severity = "Mild" | "Moderate" | "Severe";
type Duration = "Today" | "1–3 days" | "4–7 days" | "More than a week";
type Urgency =
  | "Emergency"
  | "Urgent medical attention"
  | "Doctor consultation recommended"
  | "Self-care / monitoring";

type Symptom = {
  name: string;
  group: "Cold & flu" | "Digestive" | "Pain & energy" | "Other concerns";
};

type Result = {
  urgency: Urgency;
  summary: string;
  explanations: string[];
  observations: string[];
  nextSteps: string[];
  doctorQuestions: string[];
  emergencyWarning?: string;
};

const symptoms: Symptom[] = [
  { name: "Fever", group: "Cold & flu" },
  { name: "Cough", group: "Cold & flu" },
  { name: "Sore throat", group: "Cold & flu" },
  { name: "Runny or blocked nose", group: "Cold & flu" },
  { name: "Headache", group: "Pain & energy" },
  { name: "Body ache", group: "Pain & energy" },
  { name: "Fatigue", group: "Pain & energy" },
  { name: "Dizziness", group: "Pain & energy" },
  { name: "Nausea", group: "Digestive" },
  { name: "Vomiting", group: "Digestive" },
  { name: "Stomach pain", group: "Digestive" },
  { name: "Diarrhoea", group: "Digestive" },
  { name: "Constipation", group: "Digestive" },
  { name: "Chest pain", group: "Other concerns" },
  { name: "Shortness of breath", group: "Other concerns" },
  { name: "Palpitations", group: "Other concerns" },
  { name: "Back pain", group: "Pain & energy" },
  { name: "Joint pain", group: "Pain & energy" },
  { name: "Skin rash", group: "Other concerns" },
  { name: "Burning while urinating", group: "Other concerns" },
  { name: "Anxiety or stress", group: "Other concerns" },
  { name: "Trouble sleeping", group: "Other concerns" },
];

const groupOrder: Symptom["group"][] = [
  "Cold & flu",
  "Digestive",
  "Pain & energy",
  "Other concerns",
];

const toneForUrgency: Record<Urgency, "red" | "amber" | "blue" | "green"> = {
  Emergency: "red",
  "Urgent medical attention": "amber",
  "Doctor consultation recommended": "blue",
  "Self-care / monitoring": "green",
};

function evaluateSymptoms(
  selected: string[],
  severity: Severity,
  duration: Duration,
): Result {
  const has = (name: string) => selected.includes(name);
  const emergency =
    has("Chest pain") ||
    (has("Shortness of breath") && severity !== "Mild") ||
    (has("Palpitations") && severity === "Severe");
  const urgent =
    severity === "Severe" ||
    (has("Vomiting") && duration !== "Today") ||
    (has("Dizziness") && severity === "Moderate");
  const consultation =
    duration === "More than a week" ||
    has("Burning while urinating") ||
    has("Skin rash") ||
    has("Palpitations") ||
    (selected.length >= 4 && severity !== "Mild");

  if (emergency) {
    return {
      urgency: "Emergency",
      summary:
        "Some of the symptoms you selected can need urgent in-person assessment. Do not wait for an online result to decide what to do.",
      explanations: [
        "There are several possible causes, and this checker cannot tell which one applies.",
        "A clinician needs to assess urgent symptoms directly.",
      ],
      observations: [
        "Chest symptoms, significant breathing difficulty, or severe palpitations deserve immediate attention.",
        "This result is intentionally cautious and is not a diagnosis.",
      ],
      nextSteps: [
        "Seek emergency medical care now or call your local emergency number.",
        "If possible, ask someone to stay with you and avoid driving yourself if you feel unwell.",
      ],
      doctorQuestions: [],
      emergencyWarning:
        "If symptoms are sudden, severe, worsening, or include fainting, confusion, blue lips, or severe weakness, seek emergency care immediately.",
    };
  }

  if (urgent) {
    return {
      urgency: "Urgent medical attention",
      summary:
        "Your answers suggest that you should speak with a medical professional promptly, preferably today or as soon as local care is available.",
      explanations: [
        "More intense, persistent, or worsening symptoms can have many possible causes.",
        "An in-person assessment can help determine whether tests or treatment are needed.",
      ],
      observations: [
        "The severity or combination of symptoms is the reason for this recommendation.",
        "This checker cannot assess vital signs, hydration, or physical examination findings.",
      ],
      nextSteps: [
        "Contact a doctor, urgent-care centre, or local health service today.",
        "Drink small amounts of water if you can keep fluids down, and record when symptoms began.",
      ],
      doctorQuestions: [
        "Could these symptoms need an in-person examination or testing?",
        "What changes should make me seek emergency care?",
      ],
    };
  }

  if (consultation) {
    return {
      urgency: "Doctor consultation recommended",
      summary:
        "A routine doctor consultation is a sensible next step, especially if the symptoms continue, return, or affect daily life.",
      explanations: [
        "Longer-lasting or recurring symptoms can be related to common, treatable conditions.",
        "Only a qualified clinician can interpret these symptoms in the context of your health history.",
      ],
      observations: [
        duration === "More than a week"
          ? "The symptoms have lasted more than a week."
          : "The selected symptom pattern is worth discussing with a clinician.",
        "This is an informational recommendation, not a confirmed diagnosis.",
      ],
      nextSteps: [
        "Book a doctor appointment and take note of when each symptom started.",
        "Bring your current medicines, relevant reports, and any pattern you have noticed.",
      ],
      doctorQuestions: [
        "What are the likely causes of these symptoms in my situation?",
        "Do I need any tests, monitoring, or lifestyle changes?",
      ],
    };
  }

  const coldLike = selected.some((name) =>
    ["Fever", "Cough", "Sore throat", "Runny or blocked nose"].includes(name),
  );
  const digestive = selected.some((name) =>
    ["Nausea", "Stomach pain", "Diarrhoea", "Constipation"].includes(name),
  );
  return {
    urgency: "Self-care / monitoring",
    summary:
      "Your answers describe symptoms that are often suitable for gentle self-care and monitoring when they are mild and improving.",
    explanations: [
      coldLike
        ? "Cold-like symptoms can occur with common viral illnesses or allergies."
        : digestive
          ? "Mild digestive symptoms can occur with temporary food, routine, or minor illness changes."
          : "Mild discomfort, tiredness, or aches can have many everyday causes, including sleep, stress, or activity changes.",
      "This list gives common possibilities only; it does not identify the cause of your symptoms.",
    ],
    observations: [
      "You selected mild-to-moderate symptoms without the emergency patterns covered by this checker.",
      "Monitor whether symptoms improve, stay the same, or worsen over the next few days.",
    ],
    nextSteps: [
      "Rest, stay hydrated, and choose light meals if that feels comfortable.",
      "Keep a simple note of symptoms, timing, and any triggers.",
      "Book a doctor appointment if symptoms persist, return frequently, or interfere with normal activities.",
    ],
    doctorQuestions: [
      "If this continues, what should I track before an appointment?",
      "Could any of my regular medicines or health conditions be relevant?",
    ],
  };
}

export function SymptomChecker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity>("Mild");
  const [duration, setDuration] = useState<Duration>("Today");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [healthInformation, setHealthInformation] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const visibleSymptoms = useMemo(
    () =>
      symptoms.filter((symptom) =>
        symptom.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [search],
  );

  function toggleSymptom(name: string) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((symptom) => symptom !== name)
        : [...current, name],
    );
    setResult(null);
    setError("");
  }

  function checkSymptoms() {
    if (!selected.length) {
      setError("Choose at least one symptom to continue.");
      setResult(null);
      return;
    }
    const numberAge = Number(age);
    if (
      age &&
      (!Number.isInteger(numberAge) || numberAge < 1 || numberAge > 120)
    ) {
      setError("Enter an age between 1 and 120, or leave it blank.");
      setResult(null);
      return;
    }
    setError("");
    setResult(evaluateSymptoms(selected, severity, duration));
  }

  function reset() {
    setSelected([]);
    setSearch("");
    setSeverity("Mild");
    setDuration("Today");
    setAge("");
    setSex("");
    setHealthInformation("");
    setNotes("");
    setResult(null);
    setError("");
  }

  return (
    <>
      <PageHeader
        eyebrow="A LITTLE MORE UNDERSTANDING"
        title="Let’s understand how you’re feeling"
        description="Choose the symptoms you notice to see a safe, general next-step guide. This checker does not provide a diagnosis."
      />
      <div className="my-5 flex items-start gap-3 rounded-lg border border-[#eed8cb] bg-[#fcf5ef] p-4 text-xs leading-relaxed text-[#8f5f43]">
        <ShieldAlert className="size-5 shrink-0" />
        <p>
          If you have severe chest pain, serious breathing difficulty, fainting,
          confusion, severe allergic symptoms, or feel in immediate danger, seek
          emergency care now. Do not wait for this checker.
        </p>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Stethoscope className="size-5" />
            </span>
            <div>
              <h2>Tell us what you notice</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Select all symptoms that apply right now.
              </p>
            </div>
          </div>

          <Field label="Search symptoms" htmlFor="symptom-search">
            <div className="relative">
              <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
              <Input
                id="symptom-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search fever, headache, stomach pain..."
                className="pl-9"
              />
            </div>
          </Field>

          <div className="mt-5 space-y-5">
            {groupOrder.map((group) => {
              const items = visibleSymptoms.filter(
                (symptom) => symptom.group === group,
              );
              if (!items.length) return null;
              return (
                <section key={group} aria-labelledby={`group-${group}`}>
                  <h3
                    id={`group-${group}`}
                    className="mb-2 text-sm font-medium"
                  >
                    {group}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {items.map((symptom) => {
                      const active = selected.includes(symptom.name);
                      return (
                        <button
                          key={symptom.name}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggleSymptom(symptom.name)}
                          className={cn(
                            "rounded-full border px-3 py-2 text-sm transition-colors",
                            active
                              ? "border-primary bg-primary text-white"
                              : "border-border bg-white text-foreground hover:border-primary/50 hover:bg-muted",
                          )}
                        >
                          {active && (
                            <CheckCircle2 className="mr-1.5 inline size-3.5" />
                          )}
                          {symptom.name}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className="mt-5 rounded-lg bg-muted p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Selected symptoms
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleSymptom(name)}
                  >
                    <Badge tone="green">{name} ×</Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Severity">
              <div className="grid grid-cols-3 gap-2">
                {(["Mild", "Moderate", "Severe"] as Severity[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={severity === item}
                    onClick={() => {
                      setSeverity(item);
                      setResult(null);
                    }}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-xs font-medium",
                      severity === item
                        ? "border-primary bg-primary text-white"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="How long has this been happening?" htmlFor="duration">
              <Select
                id="duration"
                value={duration}
                onChange={(event) => {
                  setDuration(event.target.value as Duration);
                  setResult(null);
                }}
              >
                <option>Today</option>
                <option>1–3 days</option>
                <option>4–7 days</option>
                <option>More than a week</option>
              </Select>
            </Field>
            <Field label="Age (optional)" htmlFor="symptom-age">
              <Input
                id="symptom-age"
                inputMode="numeric"
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="e.g. 30"
              />
            </Field>
            <Field label="Sex (optional)" htmlFor="symptom-sex">
              <Select
                id="symptom-sex"
                value={sex}
                onChange={(event) => setSex(event.target.value)}
              >
                <option value="">Prefer not to say</option>
                <option>Female</option>
                <option>Male</option>
                <option>Intersex</option>
              </Select>
            </Field>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field
              label="Relevant health information (optional)"
              htmlFor="health-information"
            >
              <Textarea
                id="health-information"
                value={healthInformation}
                onChange={(event) => setHealthInformation(event.target.value)}
                placeholder="Conditions or regular medicines you choose to share"
              />
            </Field>
            <Field
              label="Anything else you noticed? (optional)"
              htmlFor="symptom-notes"
            >
              <Textarea
                id="symptom-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="For example, what makes it better or worse"
              />
            </Field>
          </div>
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={checkSymptoms}>
              <HeartPulse className="size-4" /> Check symptoms
            </Button>
            <Button variant="ghost" onClick={reset}>
              Clear form
            </Button>
          </div>
        </Card>

        <Card className="min-h-[480px] p-5 sm:p-6">
          {!result ? (
            <EmptyState
              icon={HeartPulse}
              title="Your next-step guide will appear here"
              description="Choose one or more symptoms and complete the short form. The result is a hardcoded general-information guide, not an AI diagnosis."
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">INFORMATIONAL RESULT</p>
                  <h2>Your suggested next step</h2>
                </div>
                <Badge tone={toneForUrgency[result.urgency]}>
                  {result.urgency}
                </Badge>
              </div>
              {result.emergencyWarning && (
                <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <AlertTriangle className="size-5 shrink-0" />
                  <p>{result.emergencyWarning}</p>
                </div>
              )}
              <section>
                <h3>Summary</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {result.summary}
                </p>
              </section>
              <section>
                <h3>What this may mean</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {result.explanations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Important observations</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {result.observations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>What you can do next</h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {result.nextSteps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
              {result.doctorQuestions.length > 0 && (
                <section>
                  <h3>Questions to discuss with a doctor</h3>
                  <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                    {result.doctorQuestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              )}
              <div className="flex flex-wrap gap-3 border-t border-border pt-5">
                <Button asChild>
                  <Link href="/appointments">
                    Book appointment <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/emergency">Emergency contacts</Link>
                </Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                This screen provides general health information only. It does
                not diagnose a condition or replace a qualified healthcare
                professional.
              </p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
