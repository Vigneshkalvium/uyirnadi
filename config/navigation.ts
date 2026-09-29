import {
  LayoutDashboard,
  HeartPulse,
  MessageCircle,
  Tablets,
  Stethoscope,
  Salad,
  CalendarDays,
  Files,
  Lightbulb,
  Scale,
  Droplets,
  Footprints,
  UserRound,
  MessageSquare,
  ShieldPlus,
  Users,
  Clock,
  ClipboardList,
  BarChart3,
  Phone,
} from "lucide-react";
export const navigation = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Health analytics", href: "/health", icon: HeartPulse },
    ],
  },
  {
    label: "YOUR HEALTH, SIMPLIFIED",
    items: [
      {
        label: "AI health assistant",
        href: "/chatbot",
        icon: MessageCircle,
        badge: "AI",
      },
      {
        label: "Tablet guide",
        href: "/medicines",
        icon: Tablets,
      },
      { label: "Symptom checker", href: "/symptom-checker", icon: Stethoscope },
      { label: "Nutrition planner", href: "/nutrition", icon: Salad },
    ],
  },
  {
    label: "CARE & WELLNESS",
    items: [
      { label: "Appointments", href: "/appointments", icon: CalendarDays },
      { label: "Health reports", href: "/reports", icon: Files },
      { label: "Health tips", href: "/health-tips", icon: Lightbulb },
      { label: "BMI calculator", href: "/bmi", icon: Scale },
      { label: "Water tracker", href: "/water", icon: Droplets },
      { label: "Fitness & activity", href: "/fitness", icon: Footprints },
    ],
  },
];
export const doctorNavigation = [
  {
    label: "DOCTOR WORKSPACE",
    items: [
      { label: "Overview", href: "/doctor/dashboard", icon: LayoutDashboard },
      {
        label: "Appointments",
        href: "/doctor/appointments",
        icon: CalendarDays,
      },
      { label: "Availability", href: "/doctor/availability", icon: Clock },
      { label: "Patients", href: "/doctor/patients", icon: Users },
      {
        label: "Prescriptions",
        href: "/doctor/prescriptions",
        icon: ClipboardList,
      },
      { label: "Patient reports", href: "/doctor/reports", icon: Files },
      { label: "My profile", href: "/doctor/profile", icon: UserRound },
    ],
  },
];
export const adminNavigation = [
  {
    label: "ADMIN WORKSPACE",
    items: [
      { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
      {
        label: "Appointments",
        href: "/admin/appointments",
        icon: CalendarDays,
      },
      { label: "Health tips", href: "/admin/health-tips", icon: Lightbulb },
      { label: "Feedback", href: "/admin/feedback", icon: MessageSquare },
      {
        label: "Emergency contacts",
        href: "/admin/emergency-contacts",
        icon: Phone,
      },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    ],
  },
];
export const secondaryNavigation = [
  { label: "My profile", href: "/profile", icon: UserRound },
  { label: "Help & feedback", href: "/feedback", icon: MessageSquare },
  { label: "Emergency help", href: "/emergency", icon: ShieldPlus },
];
