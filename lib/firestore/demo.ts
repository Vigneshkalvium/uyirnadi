import type { RecordData, Profile } from "@/types";
import { today } from "@/lib/utils";
const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA");
};
export const demoProfile: Profile = {
  name: "Ananya Sharma",
  email: "ananya@example.com",
  height: 165,
  weight: 60,
  waterGoal: 2500,
  dietaryPreference: "Vegetarian",
};
export function demoSeed(): Record<string, RecordData[]> {
  const stamp = new Date().toISOString();
  const record = (id: string, data: Record<string, unknown>) => ({
    id,
    createdAt: stamp,
    updatedAt: stamp,
    ...data,
  });
  return {
    waterLogs: [
      ...Array.from({ length: 6 }, (_, i) =>
        record(`water-${i}`, {
          date: day(i - 6),
          amount: [1750, 2200, 1900, 2500, 2100, 2300][i],
        }),
      ),
      record("water-today", { date: today(), amount: 1750 }),
    ],
    bmiRecords: [
      record("bmi-1", { date: day(-21), height: 165, weight: 61.5 }),
      record("bmi-2", { date: day(-14), height: 165, weight: 61 }),
      record("bmi-3", { date: today(), height: 165, weight: 60 }),
    ],
    fitnessLogs: [
      ...Array.from({ length: 6 }, (_, i) =>
        record(`fitness-${i}`, {
          date: day(i - 6),
          activity: i % 2 ? "Yoga" : "Walking",
          duration: [25, 40, 30, 45, 20, 35][i],
        }),
      ),
      record("fitness-today", {
        date: today(),
        activity: "Walking",
        duration: 32,
      }),
    ],
    doctors: [
      record("demo-doctor-1", {
        name: "Dr. Meera Krishnan",
        specialization: "General Physician",
        qualification: "Demo profile · credentials not verified",
        experience: 8,
        fee: 500,
        description:
          "A sample doctor profile for exploring the booking experience.",
        photo: "/doctor.svg",
        active: true,
      }),
      record("demo-doctor-2", {
        name: "Dr. Arjun Menon",
        specialization: "Cardiologist",
        qualification: "Demo profile · credentials not verified",
        experience: 12,
        fee: 800,
        description:
          "A sample specialist profile. This is not a real healthcare provider.",
        active: true,
      }),
      record("demo-doctor-3", {
        name: "Dr. Priya Raman",
        specialization: "Nutritionist",
        qualification: "Demo profile · credentials not verified",
        experience: 6,
        fee: 600,
        description: "Explore nutrition consultations in the demo workspace.",
        active: true,
      }),
    ],
    appointments: [
      record("demo-appointment", {
        doctorId: "demo-doctor-1",
        doctorName: "Dr. Meera Krishnan",
        specialization: "General Physician",
        patientName: "Ananya Sharma",
        date: day(1),
        time: "10:30",
        status: "confirmed",
        reason: "Routine health check-up",
        userId: "demo",
      }),
    ],
    healthReports: [
      record("demo-report-1", {
        name: "Complete Blood Count",
        mimeType: "application/pdf",
        demo: true,
        createdAt: day(-3) + "T10:00:00Z",
      }),
      record("demo-report-2", {
        name: "Annual Health Checkup",
        mimeType: "application/pdf",
        demo: true,
        createdAt: day(-10) + "T10:00:00Z",
      }),
    ],
    healthTips: [
      record("tip-1", {
        title: "Small steps. A healthier you.",
        description:
          "Make time for movement you enjoy. A short walk is a simple way to build a consistent routine. Choose activities that fit your ability and ask your care team about any restrictions.",
        category: "Fitness",
        image: "/walking.svg",
        published: true,
      }),
      record("tip-2", {
        title: "A little more color on your plate",
        description:
          "Explore a variety of vegetables, fruits, grains and protein sources that fit your preferences and allergies. Discuss medical dietary needs with a registered dietitian.",
        category: "Nutrition",
        image: "/nutrition.svg",
        published: true,
      }),
      record("tip-3", {
        title: "Make room for a mindful moment",
        description:
          "Pause, find a comfortable seat and take a few gentle breaths. Reach out to someone you trust when you need support.",
        category: "Mental Wellness",
        published: true,
      }),
    ],
    notifications: [
      record("notification-1", {
        title: "Your appointment is coming up",
        message:
          "Your demo consultation with Dr. Meera Krishnan is tomorrow at 10:30 AM.",
        type: "appointment",
        read: false,
      }),
      record("notification-2", {
        title: "A moment to hydrate",
        message: "Check in with your water goal for today.",
        type: "medicine",
        read: false,
      }),
    ],
    emergencyContacts: [],
    feedback: [],
    prescriptions: [],
    nutritionPlans: [],
    conversations: [],
    availability: [],
    users: [
      record("demo", {
        name: "Ananya Sharma",
        email: "ananya@example.com",
        role: "user",
      }),
    ],
  };
}
