"use client";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  getToken,
  type AppCheck,
} from "firebase/app-check";
export const firebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
);
let check: AppCheck | undefined;
export function firebaseApp() {
  if (!firebaseConfigured) throw new Error("Firebase is not configured.");
  return getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
}
export function clientAuth() {
  return getAuth(firebaseApp());
}
export async function appCheckHeaders(): Promise<Record<string, string>> {
  if (!process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY) return {};
  check ??= initializeAppCheck(firebaseApp(), {
    provider: new ReCaptchaV3Provider(
      process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY,
    ),
    isTokenAutoRefreshEnabled: true,
  });
  return { "X-Firebase-AppCheck": (await getToken(check)).token };
}
