"use client";
import { useState } from "react";
import { Sparkles, Stethoscope, Salad, AlertTriangle } from "lucide-react";
import {
  Card,
  PageHeader,
  Button,
  Badge,
  LoadingCards,
  ErrorState,
  EmptyState,
} from "@/components/ui";
import { RecordForm, type FormField } from "@/components/forms/record-form";
import { AIResponse, AIDisclaimer } from "./ai-response";
import { api } from "@/lib/firestore/client";
import { firebaseConfigured } from "@/lib/firebase/client";
import { useRecords } from "@/hooks/use-records";
import type { AIResult } from "@/types";
const symptomFields: FormField[] = [
  {
    name: "symptoms",
    label: "What are you experiencing?",
    type: "textarea",
    required: true,
    placeholder: "Describe your symptoms in your own words.",
  },
  {
    name: "severity",
    label: "Severity",
    type: "select",
    options: ["Mild", "Moderate", "Severe"],
    required: true,
  },
  {
    name: "duration",
    label: "How long has this been happening?",
    required: true,
    placeholder: "e.g. 2 days",
  },
  { name: "age", label: "Age", type: "number", min: 1, max: 120 },
  {
    name: "sex",
    label: "Sex (optional)",
    type: "select",
    options: ["Female", "Male", "Intersex", "Prefer not to say"],
  },
  {
    name: "healthInformation",
    label: "Relevant health information (optional)",
    type: "textarea",
    placeholder:
      "Existing conditions, current medicines or other context you choose to share.",
  },
];
const nutritionFields: FormField[] = [
  { name: "age", label: "Age", type: "number", min: 18, max: 120 },
  { name: "height", label: "Height (cm)", type: "number", min: 100, max: 260 },
  { name: "weight", label: "Weight (kg)", type: "number", min: 25, max: 500 },
  {
    name: "activity",
    label: "Activity level",
    type: "select",
    options: [
      "Mostly seated",
      "Lightly active",
      "Moderately active",
      "Very active",
    ],
    required: true,
  },
  {
    name: "goal",
    label: "Your goal",
    type: "select",
    options: [
      "Balanced eating",
      "Maintain weight",
      "Build strength",
      "Discuss weight management",
    ],
    required: true,
  },
  {
    name: "diet",
    label: "Dietary preference",
    type: "select",
    options: ["No preference", "Vegetarian", "Vegan", "Pescatarian"],
    required: true,
  },
  {
    name: "allergies",
    label: "Food allergies",
    required: true,
    placeholder: "List allergies, or enter none",
  },
  {
    name: "mealPreference",
    label: "Meal preferences",
    placeholder: "e.g. South Indian, quick weekday meals",
  },
  {
    name: "healthInformation",
    label: "Health information (optional)",
    type: "textarea",
    placeholder: "Share any dietary restrictions from your care team.",
  },
];
export function AITool({
  kind,
}: {
  kind: "symptoms" | "nutrition" | "recommendations";
}) {
  const nutrition = kind === "nutrition";
  const recommendations = kind === "recommendations";
  const [result, setResult] = useState<AIResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState<Record<string, unknown>>();
  const plans = useRecords("nutritionPlans");
  async function generate(values: Record<string, unknown>) {
    setLast(values);
    setError("");
    if (!firebaseConfigured) {
      setError(
        "Connect Firebase and Gemini to generate personalized guidance. No medical AI result is simulated in demo mode.",
      );
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ result: AIResult }>(`/api/ai/${kind}`, {
        method: "POST",
        body: JSON.stringify({ prompt: JSON.stringify(values) }),
      });
      setResult(data.result);
      await plans.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to generate guidance.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow={
          nutrition ? "NOURISH YOUR EVERYDAY" : "A LITTLE MORE UNDERSTANDING"
        }
        title={
          nutrition
            ? "Good food. Made personal."
            : recommendations
              ? "Small changes, thoughtfully chosen"
              : "Let’s understand how you’re feeling"
        }
        description={
          nutrition
            ? "A meal plan that considers your routine, preferences and goals."
            : "Share what’s on your mind and explore helpful next steps."
        }
      />
      <AIDisclaimer />
      {!nutrition && !recommendations && (
        <div className="my-5 flex items-start gap-3 rounded-lg border border-[#eed8cb] bg-[#fcf5ef] p-4 text-xs leading-relaxed text-[#a2785e]">
          <AlertTriangle className="size-5 shrink-0" />
          If you may be experiencing a medical emergency, seek immediate
          emergency care. Do not wait for an AI assessment.
        </div>
      )}
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-2">
            {nutrition ? (
              <Salad className="size-5 text-primary" />
            ) : (
              <Stethoscope className="size-5 text-primary" />
            )}
            <h2>
              {nutrition ? "A little about your plate" : "A little about you"}
            </h2>
          </div>
          <RecordForm
            fields={
              nutrition
                ? nutritionFields
                : recommendations
                  ? [
                      {
                        name: "context",
                        label: "Your wellbeing goals and current habits",
                        type: "textarea",
                        required: true,
                      },
                    ]
                  : symptomFields
            }
            initial={
              nutrition
                ? {
                    age: 30,
                    height: 165,
                    weight: 60,
                    activity: "Lightly active",
                    goal: "Balanced eating",
                    diet: "Vegetarian",
                    allergies: "None",
                  }
                : { severity: "Mild", age: 30 }
            }
            onSubmit={generate}
            submitLabel={
              nutrition ? "Create my meal plan" : "Get informational guidance"
            }
          />
        </Card>
        <div>
          {error && (
            <ErrorState message={error} retry={() => last && generate(last)} />
          )}
          <Card className="mt-0 p-6">
            {busy ? (
              <>
                <div
                  role="status"
                  className="mb-5 flex items-center gap-2 text-sm"
                >
                  <Sparkles className="size-4 animate-pulse" />
                  Putting your information together...
                </div>
                <LoadingCards />
              </>
            ) : result ? (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2>
                    {nutrition
                      ? "Your personal meal plan"
                      : "Your informational summary"}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => last && generate(last)}
                  >
                    Regenerate
                  </Button>
                </div>
                <AIResponse result={result} />
              </>
            ) : (
              <EmptyState
                icon={nutrition ? Salad : Sparkles}
                title={
                  nutrition
                    ? "A plan that fits your everyday"
                    : "Clarity starts with a little context"
                }
                description={
                  nutrition
                    ? "Tell us about your preferences to get started. Medical nutrition advice should be confirmed with a qualified professional."
                    : "Complete the form to explore possible explanations and questions for your doctor."
                }
              />
            )}
          </Card>
          {nutrition && plans.records.length > 0 && (
            <Card className="mt-5 p-5">
              <h2 className="mb-4">Saved meal plans</h2>
              {plans.records.map((p) => (
                <button
                  key={p.id}
                  className="flex w-full items-center justify-between border-t border-border py-3 text-left text-xs"
                  onClick={() => setResult(p.plan as AIResult)}
                >
                  <span>{String(p.name)}</span>
                  <Badge>
                    {new Date(p.createdAt || "").toLocaleDateString()}
                  </Badge>
                </button>
              ))}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
