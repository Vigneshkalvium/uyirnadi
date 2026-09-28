"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Salad, ShieldCheck } from "lucide-react";
import { Card, Badge, EmptyState, PageHeader } from "@/components/ui";
import { RecordForm, type FormField } from "@/components/forms/record-form";

type Diet = "No preference" | "Vegetarian" | "Vegan" | "Pescatarian";
type Activity =
  "Mostly seated" | "Lightly active" | "Moderately active" | "Very active";
type Goal =
  | "Balanced eating"
  | "Maintain weight"
  | "Build strength"
  | "Discuss weight management";

type Meal = { label: string; suggestion: string };
type Plan = {
  summary: string;
  meals: Meal[];
  hydration: string;
  notes: string[];
  diet: Diet;
  goal: Goal;
};

const fields: FormField[] = [
  {
    name: "age",
    label: "Age",
    type: "number",
    min: 18,
    max: 120,
    required: true,
  },
  {
    name: "height",
    label: "Height (cm)",
    type: "number",
    min: 100,
    max: 260,
    required: true,
  },
  {
    name: "weight",
    label: "Weight (kg)",
    type: "number",
    min: 25,
    max: 500,
    required: true,
  },
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
    placeholder: "Enter none if not applicable",
    required: true,
  },
  {
    name: "mealPreference",
    label: "Meal preferences (optional)",
    placeholder: "For example: South Indian, quick weekday meals",
  },
  {
    name: "healthInformation",
    label: "Health information (optional)",
    type: "textarea",
    placeholder:
      "Only share information you are comfortable sharing. Follow any care-team instructions you have.",
  },
];

const mealsByDiet: Record<Diet, Meal[]> = {
  "No preference": [
    {
      label: "Breakfast",
      suggestion:
        "Oats or idli with fruit and a protein source such as egg, curd, or dal.",
    },
    {
      label: "Lunch",
      suggestion:
        "Rice or roti, vegetables, dal or lean protein, and curd or salad.",
    },
    {
      label: "Snack",
      suggestion: "Fruit with unsalted nuts, roasted chana, or yoghurt.",
    },
    {
      label: "Dinner",
      suggestion:
        "Vegetables with roti or millet, plus dal, egg, chicken, or another protein source.",
    },
  ],
  Vegetarian: [
    {
      label: "Breakfast",
      suggestion:
        "Vegetable oats, idli with sambar, or dosa with a side of fruit.",
    },
    {
      label: "Lunch",
      suggestion:
        "Rice or roti, dal or chana, mixed vegetables, and curd or salad.",
    },
    {
      label: "Snack",
      suggestion: "Fruit with roasted chana, nuts, sprouts, or yoghurt.",
    },
    {
      label: "Dinner",
      suggestion:
        "Roti or millet with a vegetable curry and a protein source such as dal, paneer, or beans.",
    },
  ],
  Vegan: [
    {
      label: "Breakfast",
      suggestion:
        "Vegetable poha, oats made with plant milk, or idli with sambar and fruit.",
    },
    {
      label: "Lunch",
      suggestion:
        "Rice or roti, dal, chickpeas or rajma, and a generous serving of vegetables.",
    },
    {
      label: "Snack",
      suggestion:
        "Fruit, roasted chana, seeds, or a small handful of unsalted nuts.",
    },
    {
      label: "Dinner",
      suggestion:
        "Millet or roti with beans, lentils, tofu, and seasonal vegetables.",
    },
  ],
  Pescatarian: [
    {
      label: "Breakfast",
      suggestion:
        "Oats or idli with fruit and curd, egg, or another suitable protein source.",
    },
    {
      label: "Lunch",
      suggestion:
        "Rice or roti, vegetables, dal, and grilled fish where preferred.",
    },
    {
      label: "Snack",
      suggestion: "Fruit with yoghurt, roasted chana, seeds, or unsalted nuts.",
    },
    {
      label: "Dinner",
      suggestion:
        "Vegetables with roti or millet, plus dal, tofu, or grilled fish.",
    },
  ],
};

const hydrationByActivity: Record<Activity, string> = {
  "Mostly seated":
    "About 2.0 L of fluids across the day is a general starting point.",
  "Lightly active":
    "About 2.3 L of fluids across the day is a general starting point.",
  "Moderately active":
    "About 2.5 L of fluids across the day is a general starting point.",
  "Very active":
    "About 2.8 L of fluids across the day is a general starting point; add fluids around activity and hot weather.",
};

const goalSummary: Record<Goal, string> = {
  "Balanced eating":
    "This sample plan uses regular meals with vegetables, protein sources, whole grains, and fruit.",
  "Maintain weight":
    "This sample plan focuses on regular, satisfying meals rather than skipping meals or restrictive rules.",
  "Build strength":
    "This sample plan includes a protein source at each main meal alongside regular activity and recovery.",
  "Discuss weight management":
    "This sample plan is a balanced starting point. Discuss individual weight goals with a qualified professional.",
};

function createPlan(values: Record<string, unknown>): Plan {
  const diet = values.diet as Diet;
  const activity = values.activity as Activity;
  const goal = values.goal as Goal;
  const allergies = String(values.allergies || "None").trim();
  const preference = String(values.mealPreference || "").trim();

  return {
    diet,
    goal,
    summary: `${goalSummary[goal]} It is a hardcoded general meal template, not a medical or calorie prescription.${preference ? ` Your meal preference noted: ${preference}.` : ""}`,
    meals: mealsByDiet[diet],
    hydration: hydrationByActivity[activity],
    notes: [
      allergies.toLowerCase() === "none"
        ? "No food allergies were entered. Always check ingredients and choose foods that suit you."
        : `You entered: “${allergies}”. Check labels and replace any meal item that contains an allergen.`,
      "Adjust portions for hunger, activity, culture, budget, and advice from your healthcare professional.",
      "If you have kidney, heart, digestive, pregnancy, eating-disorder, diabetes, or other clinical nutrition needs, ask a qualified professional before changing your diet.",
    ],
  };
}

export function NutritionPlanner() {
  const [plan, setPlan] = useState<Plan | null>(null);

  async function generate(values: Record<string, unknown>) {
    setPlan(createPlan(values));
  }

  return (
    <>
      <PageHeader
        eyebrow="NOURISH YOUR EVERYDAY"
        title="Good food. Made simple."
        description="Create a general meal template based on your routine and food preferences. This planner works without AI."
      />
      <div className="my-5 flex items-start gap-3 rounded-lg border border-[#e7ebdf] bg-[#f7f9f2] p-4 text-xs leading-relaxed text-[#657a67]">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          These are hardcoded general meal suggestions, not personalised medical
          nutrition advice. Follow your clinician’s advice for any health
          condition, allergy, pregnancy, or special dietary need.
        </p>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
              <Salad className="size-5" />
            </span>
            <div>
              <h2>A little about your routine</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your answers choose a suitable sample meal template.
              </p>
            </div>
          </div>
          <RecordForm
            fields={fields}
            initial={{
              age: 30,
              height: 165,
              weight: 60,
              activity: "Lightly active",
              goal: "Balanced eating",
              diet: "Vegetarian",
              allergies: "None",
            }}
            onSubmit={generate}
            submitLabel="Create my meal template"
          />
        </Card>
        <Card className="min-h-[500px] p-5 sm:p-6">
          {!plan ? (
            <EmptyState
              icon={Salad}
              title="Your meal template will appear here"
              description="Complete the form to see a hardcoded everyday meal guide with breakfast, lunch, snack, dinner, and hydration suggestions."
            />
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="eyebrow mb-2">GENERAL MEAL TEMPLATE</p>
                  <h2>Your everyday plan</h2>
                </div>
                <div className="flex gap-2">
                  <Badge>{plan.diet}</Badge>
                  <Badge tone="blue">{plan.goal}</Badge>
                </div>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                {plan.summary}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {plan.meals.map((meal) => (
                  <section
                    key={meal.label}
                    className="rounded-lg border border-border p-4"
                  >
                    <p className="text-xs font-semibold text-primary">
                      {meal.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {meal.suggestion}
                    </p>
                  </section>
                ))}
              </div>
              <section className="rounded-lg bg-muted p-4">
                <h3 className="text-sm font-semibold">Hydration</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {plan.hydration} Your individual need can vary with weather,
                  activity, and medical advice.
                </p>
              </section>
              <section>
                <h3 className="text-sm font-semibold">Helpful notes</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  {plan.notes.map((note) => (
                    <li key={note} className="flex gap-2">
                      <CheckCircle2 className="mt-1 size-3.5 shrink-0 text-primary" />
                      {note}
                    </li>
                  ))}
                </ul>
              </section>
              <button
                type="button"
                onClick={() => setPlan(null)}
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <RefreshCw className="size-4" /> Start a new plan
              </button>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
