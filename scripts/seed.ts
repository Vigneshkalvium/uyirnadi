import { loadEnvConfig } from "@next/env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

async function main() {
  loadEnvConfig(process.cwd());
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n",
          ),
        }),
      });
  const firestore = getFirestore(app);
  const now = new Date().toISOString();
  const demo = { demo: true, createdAt: now, updatedAt: now };

  const doctors = [
    {
      id: "demo-doctor-meera",
      name: "Dr. Meera Krishnan",
      specialization: "General Physician",
      qualification: "Demo profile · credentials not verified",
      experience: 8,
      fee: 500,
      description:
        "A clearly labelled sample profile for exploring appointment booking.",
      active: true,
    },
    {
      id: "demo-doctor-arjun",
      name: "Dr. Arjun Menon",
      specialization: "Cardiologist",
      qualification: "Demo profile · credentials not verified",
      experience: 12,
      fee: 800,
      description:
        "A clearly labelled sample specialist profile for interface testing.",
      active: true,
    },
    {
      id: "demo-doctor-priya",
      name: "Dr. Priya Raman",
      specialization: "Nutritionist",
      qualification: "Demo profile · credentials not verified",
      experience: 6,
      fee: 600,
      description:
        "A clearly labelled sample nutrition profile for interface testing.",
      active: true,
    },
  ];
  const tips = [
    {
      id: "demo-tip-movement",
      title: "Small steps. A healthier you.",
      category: "Fitness",
      description:
        "Make time for movement you enjoy. A short walk can be a gentle way to build consistency. Choose activities that fit your ability and ask your care team about restrictions.",
      image: "/walking.svg",
      published: true,
    },
    {
      id: "demo-tip-nutrition",
      title: "A little more color on your plate",
      category: "Nutrition",
      description:
        "Explore a variety of foods that fit your preferences and allergies. Discuss individual dietary needs with a qualified professional.",
      image: "/nutrition.svg",
      published: true,
    },
    {
      id: "demo-tip-mindfulness",
      title: "Make room for a mindful moment",
      category: "Mental Wellness",
      description:
        "Pause, find a comfortable seat and take a few gentle breaths. Reach out to someone you trust if you need support.",
      published: true,
    },
  ];
  const contacts = [
    {
      id: "demo-contact-emergency",
      name: "Demo emergency service",
      phone: "112",
      category: "Emergency",
      region: "Demo data only — confirm your local number",
    },
    {
      id: "demo-contact-ambulance",
      name: "Demo ambulance service",
      phone: "108",
      category: "Ambulance",
      region: "Demo data only — confirm your local number",
    },
  ];

  const batch = firestore.batch();
  for (const doctor of doctors) {
    batch.set(
      firestore.doc(`doctors/${doctor.id}`),
      { ...doctor, ...demo },
      { merge: true },
    );
    for (const [index, time] of [
      "09:00",
      "10:30",
      "14:00",
      "16:00",
    ].entries()) {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);
      const dateValue = date.toLocaleDateString("en-CA");
      batch.set(
        firestore.doc(
          `doctors/${doctor.id}/availability/demo-${dateValue}-${time.replace(":", "")}`,
        ),
        { date: dateValue, time, blocked: false, ...demo },
        { merge: true },
      );
    }
  }
  for (const tip of tips)
    batch.set(
      firestore.doc(`healthTips/${tip.id}`),
      { ...tip, ...demo },
      { merge: true },
    );
  for (const contact of contacts)
    batch.set(
      firestore.doc(`emergencyContacts/${contact.id}`),
      { ...contact, ...demo },
      { merge: true },
    );
  await batch.commit();
  console.log(
    "Seeded clearly marked demo doctors, availability, health tips and emergency contacts.",
  );
}

void main();
