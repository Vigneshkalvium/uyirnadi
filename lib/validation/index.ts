import { z } from "zod";
const text = z.string().trim().max(2000);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const profileSchema = z
  .object({
    name: text.min(2).max(100),
    email: z.email(),
    phone: z.string().max(25).optional(),
    dateOfBirth: date.or(z.literal("")).optional(),
    gender: text.optional(),
    height: z.coerce.number().min(30).max(260).optional(),
    weight: z.coerce.number().min(2).max(500).optional(),
    dietaryPreference: text.optional(),
    emergencyContact: text.max(100).optional(),
    waterGoal: z.coerce.number().int().min(250).max(10000).optional(),
    photoPath: text.optional(),
  })
  .strict();
export const schemas = {
  waterLogs: z.object({
    date,
    amount: z.coerce.number().int().min(0).max(15000),
  }),
  fitnessLogs: z.object({
    activity: z.enum(["Walking", "Running", "Cycling", "Gym", "Yoga", "Other"]),
    duration: z.coerce.number().min(1).max(1440),
    calories: z.coerce.number().min(0).max(10000).optional(),
    date,
  }),
  bmiRecords: z.object({
    height: z.coerce.number().min(30).max(260),
    weight: z.coerce.number().min(2).max(500),
    date,
  }),
  medicines: z
    .object({
      name: text.min(1).max(100),
      dosage: text.min(1).max(100),
      frequency: z.enum(["Daily", "Twice daily", "As needed"]),
      time,
      startDate: date,
      endDate: date,
      instructions: text.optional(),
    })
    .refine((v) => v.endDate >= v.startDate, {
      message: "End date must follow start date",
      path: ["endDate"],
    }),
  medicineLogs: z.object({
    medicineId: text.min(1),
    date,
    status: z.enum(["taken", "skipped"]),
    time,
  }),
  healthReports: z.object({
    name: text.min(1),
    storagePath: text.min(1),
    mimeType: text,
    analysis: z.unknown().optional(),
    sharedWith: z.array(z.string().max(128)).max(20).optional(),
  }),
  prescriptions: z.object({
    name: text.min(1),
    storagePath: text.optional(),
    medicines: z
      .array(
        z.object({
          name: text.min(1),
          dosage: text,
          frequency: text,
          duration: text,
          instructions: text,
          confidence: text.optional(),
        }),
      )
      .max(50),
    confirmed: z.literal(true),
  }),
  nutritionPlans: z.object({ name: text, plan: z.unknown() }),
  healthProfiles: profileSchema,
  notifications: z.object({
    title: text,
    message: text,
    type: text,
    read: z.boolean(),
  }),
  conversations: z.object({ title: text.min(1) }),
  healthTips: z.object({
    title: text.min(3),
    description: text.min(10).max(10000),
    category: z.enum([
      "Nutrition",
      "Fitness",
      "Preventive Care",
      "Mental Wellness",
      "General Health",
      "Medicine Safety",
    ]),
    image: z.url().or(z.literal("")).optional(),
    published: z.boolean(),
  }),
  emergencyContacts: z.object({
    name: text.min(1),
    phone: z.string().regex(/^[+\d\s()-]{2,25}$/),
    category: z.enum(["Emergency", "Hospital", "Ambulance", "Police", "Other"]),
    region: text,
  }),
  feedback: z.object({
    category: z.enum(["Feedback", "Support", "Suggestion", "Contact"]),
    message: text.min(10),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  }),
  doctors: z.object({
    name: text.min(2),
    specialization: text.min(2),
    qualification: text,
    experience: z.coerce.number().min(0).max(70),
    fee: z.coerce.number().min(0).max(100000),
    description: text,
    photo: text.optional(),
    active: z.boolean(),
  }),
  availability: z.object({ date, time, blocked: z.boolean() }),
};
export const appointmentSchema = z.object({
  doctorId: z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
  slotId: z.string().regex(/^[a-zA-Z0-9_-]{1,160}$/),
  reason: text.max(1000),
});
export const aiInputSchema = z.object({
  consent: z.boolean().optional(),
  prompt: text.min(1).max(12000),
  conversationId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,128}$/)
    .optional(),
  storagePath: z.string().max(500).optional(),
});
export const aiResultSchema = z.object({
  summary: z.string(),
  observations: z.array(z.string()).optional(),
  interpretation: z.string().optional(),
  nextSteps: z.array(z.string()).optional(),
  doctorQuestions: z.array(z.string()).optional(),
  emergencyWarning: z.string().optional(),
  urgency: z
    .enum([
      "Emergency",
      "Urgent medical attention",
      "Doctor consultation recommended",
      "Self-care / monitoring",
    ])
    .optional(),
  medicines: z
    .array(
      z.object({
        name: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        duration: z.string(),
        instructions: z.string(),
        confidence: z.enum(["high", "low", "unclear"]),
      }),
    )
    .optional(),
  values: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        range: z.string(),
        flag: z.string(),
      }),
    )
    .optional(),
  meals: z.array(z.object({ meal: z.string(), food: z.string() })).optional(),
  hydration: z.string().optional(),
});
export const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];
export const maxFileSize = 8 * 1024 * 1024;
