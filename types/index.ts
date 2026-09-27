export type Role = "user" | "doctor" | "admin";
export type RecordData = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};
export type Profile = {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  dietaryPreference?: string;
  emergencyContact?: string;
  waterGoal?: number;
  photoPath?: string;
};
export type CollectionName =
  | "healthReports"
  | "prescriptions"
  | "medicines"
  | "medicineLogs"
  | "waterLogs"
  | "fitnessLogs"
  | "bmiRecords"
  | "nutritionPlans"
  | "conversations"
  | "notifications"
  | "healthProfiles"
  | "doctors"
  | "appointments"
  | "healthTips"
  | "emergencyContacts"
  | "feedback"
  | "users"
  | "availability";
export type AIKind =
  | "chat"
  | "prescription"
  | "symptoms"
  | "report"
  | "nutrition"
  | "recommendations";
export type AIResult = {
  summary: string;
  observations?: string[];
  interpretation?: string;
  nextSteps?: string[];
  doctorQuestions?: string[];
  emergencyWarning?: string;
  urgency?: string;
  medicines?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    confidence: string;
  }[];
  values?: { name: string; value: string; range: string; flag: string }[];
  meals?: { meal: string; food: string }[];
  hydration?: string;
};
