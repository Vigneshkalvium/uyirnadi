import { loadEnvConfig } from "@next/env";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const patients = [
  {
    email: "jhon@gmail.com",
    name: "Jhon",
    gender: "Man",
    height: 174,
    weight: 72,
    preference: "Balanced",
  },
  {
    email: "maha@gmail.com",
    name: "Maha",
    gender: "Woman",
    height: 160,
    weight: 58,
    preference: "Vegetarian",
  },
  {
    email: "vicky@gmail.com",
    name: "Vicky",
    gender: "Man",
    height: 168,
    weight: 67,
    preference: "Vegetarian",
  },
];
const doctors = [
  { email: "tharun.doctor@gmail.com", name: "Dr. Tharun" },
  { email: "kavin.doctor@gmail.com", name: "Dr. Kavin" },
];

const dateAt = (offset: number) => {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return value.toLocaleDateString("en-CA");
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
  const now = new Date().toISOString();
  const meta = { sample: true, createdAt: now, updatedAt: now };
  const patientIds = new Map<string, string>();
  const doctorIds = new Map<string, string>();

  for (const patient of patients)
    patientIds.set(
      patient.email,
      (await auth.getUserByEmail(patient.email)).uid,
    );
  for (const doctor of doctors)
    doctorIds.set(doctor.email, (await auth.getUserByEmail(doctor.email)).uid);

  const write = firestore.batch();
  for (const [index, patient] of patients.entries()) {
    const uid = patientIds.get(patient.email)!;
    const root = firestore.doc(`users/${uid}`);
    const record = (collection: string, id: string) =>
      root.collection(collection).doc(id);
    const waterAmounts = [1850, 2100, 1950, 2250, 2000, 2350, 1800].map(
      (amount) => amount + index * 50,
    );

    write.set(
      root,
      {
        name: patient.name,
        email: patient.email,
        role: "user",
        phone: `+91 90000 00${10 + index}`,
        dateOfBirth: `199${3 + index}-0${5 + index}-14`,
        gender: patient.gender,
        height: patient.height,
        weight: patient.weight,
        dietaryPreference: patient.preference,
        emergencyContact: "Sample emergency contact · +91 90000 00100",
        waterGoal: 2500,
        ...meta,
      },
      { merge: true },
    );
    write.set(
      record("healthProfiles", "sample-profile"),
      {
        age: 30 + index,
        height: patient.height,
        weight: patient.weight,
        dietaryPreference: patient.preference,
        allergies: "No sample allergies recorded",
        ...meta,
      },
      { merge: true },
    );

    waterAmounts.forEach((amount, day) =>
      write.set(
        record("waterLogs", `sample-water-${day}`),
        {
          date: dateAt(day - 6),
          amount,
          ...meta,
        },
        { merge: true },
      ),
    );
    [0, 1, 2, 3].forEach((point) =>
      write.set(
        record("bmiRecords", `sample-bmi-${point}`),
        {
          date: dateAt((point - 3) * 7),
          height: patient.height,
          weight: patient.weight + (3 - point) * 0.4,
          ...meta,
        },
        { merge: true },
      ),
    );
    [
      "Walking",
      "Yoga",
      "Cycling",
      "Walking",
      "Yoga",
      "Walking",
      "Walking",
    ].forEach((activity, day) =>
      write.set(
        record("fitnessLogs", `sample-fitness-${day}`),
        {
          date: dateAt(day - 6),
          activity,
          duration: 20 + ((day + index) % 4) * 10,
          calories: 80 + day * 15,
          ...meta,
        },
        { merge: true },
      ),
    );

    write.set(
      record("healthReports", "sample-wellness-report"),
      {
        name: "Wellness summary · sample data",
        mimeType: "application/pdf",
        analysis: {
          summary:
            "Sample record only. It does not contain a medical result or a clinical interpretation.",
          observations: [
            "This entry exists to demonstrate the report workspace.",
          ],
          interpretation:
            "No medical interpretation is provided for sample data.",
          nextSteps: [
            "Upload an original report for a document-based informational summary.",
          ],
          doctorQuestions: [
            "What details should I bring to my next consultation?",
          ],
        },
        sharedWith:
          index === 1
            ? []
            : [
                doctorIds.get(
                  index === 0 ? doctors[0].email : doctors[1].email,
                )!,
              ],
        ...meta,
      },
      { merge: true },
    );
    write.set(
      record("prescriptions", "sample-wellness-plan"),
      {
        name: "Wellness plan · sample data",
        confirmed: true,
        medicines: [
          {
            name: "Sample entry — not a prescription",
            dosage: "Not applicable",
            frequency: "Not applicable",
            duration: "Sample only",
            instructions:
              "Use your original prescription and verify extracted information before saving.",
            confidence: "high",
          },
        ],
        ...meta,
      },
      { merge: true },
    );
    write.set(
      record("nutritionPlans", "sample-balanced-plan"),
      {
        name: "Balanced meal plan · sample data",
        plan: {
          summary:
            "Sample planning data only. Confirm individual nutrition needs with a qualified professional.",
          meals: [
            {
              meal: "Breakfast",
              food: "Whole grains, fruit, and a protein source · sample",
            },
            { meal: "Lunch", food: "Vegetables, grains, and protein · sample" },
            { meal: "Dinner", food: "A balanced home-style meal · sample" },
          ],
          hydration:
            "Sample target: 2.5 L unless a qualified professional advises differently.",
        },
        ...meta,
      },
      { merge: true },
    );
    const conversation = record("conversations", "sample-welcome");
    write.set(
      conversation,
      { title: "Getting started · sample", ...meta },
      { merge: true },
    );
    write.set(
      conversation.collection("messages").doc("sample-user"),
      {
        role: "user",
        content: "How can I prepare for a routine health appointment?",
        ...meta,
      },
      { merge: true },
    );
    write.set(
      conversation.collection("messages").doc("sample-assistant"),
      {
        role: "assistant",
        content: {
          summary:
            "Sample AI workspace entry. AI guidance is informational and does not replace a clinician.",
          nextSteps: [
            "Write down your questions and relevant history before your appointment.",
          ],
        },
        ...meta,
      },
      { merge: true },
    );
    write.set(
      record("notifications", "sample-welcome"),
      {
        title: "Welcome to UyirNadi",
        message:
          "Sample records have been added to help you explore the workspace.",
        type: "system",
        read: false,
        ...meta,
      },
      { merge: true },
    );
  }

  for (const doctor of doctors) {
    const doctorId = doctorIds.get(doctor.email)!;
    const root = firestore.doc(`doctors/${doctorId}`);
    write.set(
      root,
      {
        name: doctor.name,
        specialization: "Profile pending verification",
        qualification: "To be added by the doctor",
        experience: 0,
        fee: 0,
        description:
          "Sample account. Professional details must be provided and verified before publishing.",
        active: false,
        ...meta,
      },
      { merge: true },
    );
    [1, 2, 3].forEach((offset, slot) =>
      write.set(
        root.collection("availability").doc(`sample-slot-${slot}`),
        {
          date: dateAt(offset),
          time: `${10 + slot}:00`,
          blocked: false,
          ...meta,
        },
        { merge: true },
      ),
    );
  }

  const appointments = [
    {
      patient: patients[0],
      doctor: doctors[0],
      status: "confirmed",
      date: dateAt(1),
      time: "10:00",
    },
    {
      patient: patients[1],
      doctor: doctors[1],
      status: "pending",
      date: dateAt(2),
      time: "11:00",
    },
    {
      patient: patients[2],
      doctor: doctors[1],
      status: "completed",
      date: dateAt(-3),
      time: "12:00",
    },
  ];
  appointments.forEach((appointment, index) =>
    write.set(
      firestore.doc(`appointments/sample-appointment-${index}`),
      {
        userId: patientIds.get(appointment.patient.email),
        patientName: appointment.patient.name,
        doctorId: doctorIds.get(appointment.doctor.email),
        doctorName: appointment.doctor.name,
        specialization: "Profile pending verification",
        date: appointment.date,
        time: appointment.time,
        slotId: `sample-slot-${index % 3}`,
        reason: "Sample appointment for exploring the workspace.",
        status: appointment.status,
        ...meta,
      },
      { merge: true },
    ),
  );

  [
    [
      "sample-nutrition",
      "Nutrition",
      "Simple plate planning",
      "Sample education content. Build meals from vegetables, protein, whole grains, and water.",
    ],
    [
      "sample-fitness",
      "Fitness",
      "Move in ways you enjoy",
      "Sample education content. Begin gently and choose activities that fit your routine.",
    ],
    [
      "sample-preventive",
      "Preventive Care",
      "Prepare for appointments",
      "Sample education content. Bring your questions, medication list, and relevant records.",
    ],
  ].forEach(([id, category, title, description]) =>
    write.set(
      firestore.doc(`healthTips/${id}`),
      {
        category,
        title,
        description,
        published: true,
        ...meta,
      },
      { merge: true },
    ),
  );
  [
    [
      "sample-ambulance",
      "Ambulance",
      "112",
      "National emergency assistance · confirm local availability",
    ],
    [
      "sample-police",
      "Police",
      "112",
      "National emergency assistance · confirm local availability",
    ],
    [
      "sample-hospital",
      "Nearest hospital",
      "Add local number",
      "Sample contact. Add a verified local hospital contact before relying on this list.",
    ],
  ].forEach(([id, name, phone, description]) =>
    write.set(
      firestore.doc(`emergencyContacts/${id}`),
      {
        name,
        phone,
        description,
        active: true,
        ...meta,
      },
      { merge: true },
    ),
  );
  write.set(
    firestore.doc("feedback/sample-jhon-feedback"),
    {
      userId: patientIds.get(patients[0].email),
      category: "Feedback",
      rating: 5,
      message: "Sample feedback entry for the administrator workspace.",
      status: "received",
      ...meta,
    },
    { merge: true },
  );

  await write.commit();
  console.log(
    `Seeded sample feature data for ${patients.length} patients, ${doctors.length} doctors, and shared admin workspaces.`,
  );
}

void main();
