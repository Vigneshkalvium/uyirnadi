"use client";
import { firebaseConfigured, appCheckHeaders } from "@/lib/firebase/client";
import { demoSeed, demoProfile } from "./demo";
import type { RecordData, Profile } from "@/types";
const key = "uyirnadi-demo-v1";
function readDemo(): Record<string, RecordData[]> {
  try {
    const value = localStorage.getItem(key);
    if (value) return JSON.parse(value);
  } catch {}
  const data = demoSeed();
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}
function writeDemo(data: Record<string, RecordData[]>) {
  localStorage.setItem(key, JSON.stringify(data));
  window.dispatchEvent(new Event("uyirnadi-data"));
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers =
    init?.method && init.method !== "GET" ? await appCheckHeaders() : {};
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...headers,
      ...init?.headers,
    },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}
export async function listRecords(
  collection: string,
  cursor?: string,
  doctorId?: string,
): Promise<{ records: RecordData[]; nextCursor: string | null }> {
  if (!firebaseConfigured)
    return { records: readDemo()[collection] || [], nextCursor: null };
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (doctorId) params.set("doctorId", doctorId);
  return api(`/api/data/${collection}?${params}`);
}
export async function saveRecord(
  collection: string,
  data: Record<string, unknown>,
  id?: string,
) {
  if (!firebaseConfigured) {
    const all = readDemo();
    const record = {
      ...data,
      id: id || crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all[collection] = id
      ? (all[collection] || []).map((r) =>
          r.id === id ? { ...r, ...record } : r,
        )
      : [record, ...(all[collection] || [])];
    writeDemo(all);
    return record;
  }
  const result = await api<{ record: RecordData }>(`/api/data/${collection}`, {
    method: id ? "PATCH" : "POST",
    body: JSON.stringify({ data, id }),
  });
  window.dispatchEvent(new Event("uyirnadi-data"));
  return result.record;
}
export async function deleteRecord(collection: string, id: string) {
  if (!firebaseConfigured) {
    const all = readDemo();
    all[collection] = (all[collection] || []).filter((r) => r.id !== id);
    writeDemo(all);
    return;
  }
  await api(`/api/data/${collection}`, {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
  window.dispatchEvent(new Event("uyirnadi-data"));
}
export async function getProfile(): Promise<Profile> {
  if (!firebaseConfigured) {
    try {
      return (
        JSON.parse(localStorage.getItem("uyirnadi-profile") || "null") ||
        demoProfile
      );
    } catch {
      return demoProfile;
    }
  }
  return (await api<{ profile: Profile }>("/api/profile")).profile;
}
export async function saveProfile(profile: Profile) {
  if (!firebaseConfigured)
    localStorage.setItem("uyirnadi-profile", JSON.stringify(profile));
  else
    await api("/api/profile", { method: "PUT", body: JSON.stringify(Object.fromEntries(Object.entries(profile).filter(([key]) => ["name","email","phone","dateOfBirth","gender","height","weight","dietaryPreference","emergencyContact","waterGoal","photoPath"].includes(key)))) });
  window.dispatchEvent(new Event("uyirnadi-data"));
}
export async function updateAppointment(id: string, status: string) {
  if (!firebaseConfigured) return saveRecord("appointments", { status }, id);
  await api(`/api/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  window.dispatchEvent(new Event("uyirnadi-data"));
}
