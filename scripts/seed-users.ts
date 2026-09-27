import { loadEnvConfig } from "@next/env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type DemoAccount = {
  email: string;
  password: string;
  name: string;
  role: "user" | "doctor" | "admin";
};

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
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const accounts: DemoAccount[] = [
    {
      email: "demo.patient@uyirnadi.example",
      password: process.env.SEED_DEMO_PATIENT_PASSWORD || "",
      name: "Demo Patient",
      role: "user",
    },
    {
      email: "demo.doctor@uyirnadi.example",
      password: process.env.SEED_DEMO_DOCTOR_PASSWORD || "",
      name: "Dr. Demo Care",
      role: "doctor",
    },
    {
      email: "demo.admin@uyirnadi.example",
      password: process.env.SEED_DEMO_ADMIN_PASSWORD || "",
      name: "Demo Administrator",
      role: "admin",
    },
  ];
  if (accounts.some((account) => !account.password)) {
    throw new Error(
      "Set SEED_DEMO_PATIENT_PASSWORD, SEED_DEMO_DOCTOR_PASSWORD, and SEED_DEMO_ADMIN_PASSWORD before running this script.",
    );
  }
  const ids = new Map<DemoAccount["role"], string>();

  for (const account of accounts) {
    let user;
    try {
      user = await auth.getUserByEmail(account.email);
      await auth.updateUser(user.uid, {
        displayName: account.name,
        password: account.password,
        emailVerified: true,
      });
    } catch (error) {
      const code =
        typeof error === "object" && error && "code" in error
          ? String(error.code)
          : "";
      if (code !== "auth/user-not-found") throw error;
      user = await auth.createUser({
        email: account.email,
        password: account.password,
        displayName: account.name,
        emailVerified: true,
      });
    }
    await auth.setCustomUserClaims(user.uid, {
      role: account.role,
      demo: true,
    });
    ids.set(account.role, user.uid);
    await firestore
      .doc(`users/${user.uid}`)
      .set(
        {
          name: account.name,
          email: account.email,
          role: account.role,
          demo: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );
    if (account.role === "doctor") {
      await firestore
        .doc(`doctors/${user.uid}`)
        .set(
          {
            name: account.name,
            specialization: "Demo care provider",
            qualification: "Demo profile · credentials not verified",
            experience: 0,
            fee: 0,
            description: "A clearly marked demonstration account.",
            active: false,
            demo: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true },
        );
    }
  }
  const patientId = ids.get("user")!;
  const doctorId = ids.get("doctor")!;
  const adminId = ids.get("admin")!;
  const dateAt = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString("en-CA");
  };
  const now = new Date().toISOString();
  const meta = { demo: true, createdAt: now, updatedAt: now };
  const write = firestore.batch();
  const userPath = (collection: string, id: string) =>
    firestore.doc(`users/${patientId}/${collection}/${id}`);

  write.set(
    firestore.doc(`users/${patientId}`),
    {
      name: "Demo Patient",
      email: "demo.patient@uyirnadi.example",
      role: "user",
      phone: "+91 90000 00000",
      dateOfBirth: "1994-05-14",
      gender: "Woman",
      height: 165,
      weight: 60,
      dietaryPreference: "Vegetarian",
      emergencyContact: "Demo Contact · +91 90000 00001",
      waterGoal: 2500,
      ...meta,
    },
    { merge: true },
  );
  write.set(
    firestore.doc(`users/${doctorId}`),
    {
      name: "Dr. Demo Care",
      email: "demo.doctor@uyirnadi.example",
      role: "doctor",
      phone: "+91 90000 00002",
      ...meta,
    },
    { merge: true },
  );
  write.set(
    firestore.doc(`users/${adminId}`),
    {
      name: "Demo Administrator",
      email: "demo.admin@uyirnadi.example",
      role: "admin",
      phone: "+91 90000 00003",
      ...meta,
    },
    { merge: true },
  );

  write.set(
    userPath("healthProfiles", "demo-profile"),
    {
      age: 31,
      height: 165,
      weight: 60,
      dietaryPreference: "Vegetarian",
      allergies: "None reported · demo data",
      ...meta,
    },
    { merge: true },
  );
  [
    [-6, 1800],
    [-5, 2100],
    [-4, 1950],
    [-3, 2300],
    [-2, 2050],
    [-1, 2400],
    [0, 1750],
  ].forEach(([offset, amount]) =>
    write.set(
      userPath("waterLogs", `demo-water-${offset}`),
      { date: dateAt(offset), amount, ...meta },
      { merge: true },
    ),
  );
  [
    [-6, "Walking", 25, 90],
    [-5, "Yoga", 35, 120],
    [-4, "Walking", 30, 105],
    [-3, "Cycling", 40, 160],
    [-2, "Yoga", 25, 85],
    [-1, "Walking", 45, 150],
    [0, "Walking", 32, 110],
  ].forEach(([offset, activity, duration, calories]) =>
    write.set(
      userPath("fitnessLogs", `demo-fitness-${offset}`),
      { date: dateAt(Number(offset)), activity, duration, calories, ...meta },
      { merge: true },
    ),
  );
  [
    [-21, 61.5],
    [-14, 61],
    [-7, 60.5],
    [0, 60],
  ].forEach(([offset, weight]) =>
    write.set(
      userPath("bmiRecords", `demo-bmi-${offset}`),
      { date: dateAt(Number(offset)), height: 165, weight, ...meta },
      { merge: true },
    ),
  );
  ['demo-vitamin-d','demo-vitamin-b12','demo-calcium'].forEach(id=>write.delete(userPath('medicines',id)));
  write.delete(userPath('medicineLogs','demo-log-today'));
  write.set(
    userPath("healthReports", "demo-report-cbc"),
    {
      name: "Complete Blood Count · demo",
      mimeType: "application/pdf",
      analysis: {
        summary:
          "Demo sample only. This is not a patient result and does not contain medical findings.",
        observations: [
          "Use your own original report for any medical discussion.",
        ],
        interpretation: "No interpretation is provided for demo data.",
        nextSteps: [
          "Upload your own report to receive an informational summary.",
        ],
        doctorQuestions: [],
      },
      sharedWith: [doctorId],
      ...meta,
    },
    { merge: true },
  );
  write.set(
    userPath("prescriptions", "demo-prescription"),
    {
      name: "Wellness supplement plan · demo",
      confirmed: true,
      medicines: [
        {
          name: "Example supplement",
          dosage: "Demo only",
          frequency: "Daily",
          duration: "14 days",
          instructions: "This is sample UI data, not a prescription.",
          confidence: "high",
        },
      ],
      ...meta,
    },
    { merge: true },
  );
  write.set(
    userPath("nutritionPlans", "demo-nutrition-plan"),
    {
      name: "Balanced vegetarian plan · demo",
      plan: {
        summary:
          "Demo sample meal plan. Confirm individual nutrition needs with a qualified professional.",
        meals: [
          { meal: "Breakfast", food: "Vegetable oats with fruit · demo" },
          {
            meal: "Lunch",
            food: "Whole grains, vegetables and protein source · demo",
          },
          { meal: "Dinner", food: "Balanced home-style meal · demo" },
        ],
        hydration:
          "Demo target: 2.5 L, unless your care team advises otherwise.",
      },
      ...meta,
    },
    { merge: true },
  );
  const conversation = firestore.doc(
    `users/${patientId}/conversations/demo-welcome`,
  );
  write.set(
    conversation,
    { title: "Welcome to UyirNadi · demo", ...meta },
    { merge: true },
  );
  write.set(
    conversation.collection("messages").doc("demo-message-user"),
    { role: "user", content: "This is a demo conversation.", ...meta },
    { merge: true },
  );
  write.set(
    conversation.collection("messages").doc("demo-message-assistant"),
    {
      role: "assistant",
      content: {
        summary:
          "Welcome to the UyirNadi demo. AI guidance is informational and does not replace a doctor.",
        nextSteps: ["Use the AI tools after adding a Gemini API key."],
      },
      ...meta,
    },
    { merge: true },
  );
  write.set(
    userPath("notifications", "demo-appointment-notice"),
    {
      title: "Demo appointment confirmed",
      message: "Your sample appointment is scheduled for tomorrow at 10:30 AM.",
      type: "appointment",
      read: false,
      ...meta,
    },
    { merge: true },
  );
  write.set(
    userPath("notifications", "demo-water-notice"),
    {
      title: "A moment to hydrate",
      message: "Your demo water log is ready to explore.",
      type: "system",
      read: false,
      ...meta,
    },
    { merge: true },
  );
  write.set(
    firestore.doc(`doctors/${doctorId}/availability/demo-availability-1`),
    { date: dateAt(1), time: "10:30", blocked: false, ...meta },
    { merge: true },
  );
  write.set(
    firestore.doc("appointments/demo-role-appointment"),
    {
      userId: patientId,
      patientName: "Demo Patient",
      doctorId,
      doctorName: "Dr. Demo Care",
      specialization: "Demo care provider",
      date: dateAt(1),
      time: "10:30",
      slotId: "demo-availability-1",
      reason: "Sample appointment for UI demonstration only.",
      status: "confirmed",
      ...meta,
    },
    { merge: true },
  );
  write.set(
    firestore.doc("feedback/demo-feedback"),
    {
      userId: patientId,
      category: "Feedback",
      rating: 5,
      message: "Demo feedback submission for administrator workspace testing.",
      status: "received",
      ...meta,
    },
    { merge: true },
  );
  await write.commit();
  console.log(
    "Seeded complete, clearly marked demo data for user, doctor and admin workspaces.",
  );
}

void main();
