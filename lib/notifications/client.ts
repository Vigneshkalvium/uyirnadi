"use client";
import { firebaseApp, firebaseConfigured } from "@/lib/firebase/client";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { api } from "@/lib/firestore/client";
export async function enableNotifications() {
  if (!firebaseConfigured)
    throw new Error(
      "Push notifications need a connected Firebase project. In-app demo notifications are available.",
    );
  if (!(await isSupported()))
    throw new Error(
      "This browser does not support push notifications. In-app updates are still available.",
    );
  if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
    throw new Error("Push notifications have not been configured yet.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    throw new Error(
      "Notifications were not enabled. You can still view in-app updates.",
    );
  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );
  const token = await getToken(getMessaging(firebaseApp()), {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  await api("/api/notifications", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
