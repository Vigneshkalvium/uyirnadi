import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function today() {
  return new Date().toLocaleDateString("en-CA");
}
export function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export function bmi(height: number, weight: number) {
  return Math.round((weight / (height / 100) ** 2) * 10) / 10;
}
export function bmiCategory(value: number) {
  return value < 18.5
    ? "Underweight"
    : value < 25
      ? "Normal range"
      : value < 30
        ? "Overweight"
        : "Obesity";
}
