# UyirNadi

**Your Lifeline to Better Health.** A responsive Next.js healthcare-management MVP with private Firebase data, server-side Gemini integration, appointment workflows, health tracking, and dedicated patient, doctor and administrator workspaces.

> “நோய்நாடி நோய்முதல் நாடி அதுதணிக்கும் வாய்நாடி வாய்ப்பச் செயல்.”

## What is included

- Firebase email/password authentication, optional Google sign-in, server session cookies, role claims, protected routes and persistent sessions.
- Personal dashboard; BMI, water, fitness and medicine trackers; nutrition plans; health tips; emergency contacts; feedback.
- Appointment booking with Firestore transaction protection against double-booking. Doctors can publish slots and manage their schedule.
- Private report and prescription upload, file-signature validation, server-side OCR abstraction powered by Gemini Vision, editable prescription extraction, and AI report summaries.
- Gemini health assistant, symptom checker, nutrition planner and recommendations endpoint. Every response uses a safety system prompt and medical disclaimer.
- Admin routes for providers, appointment oversight, health tips, feedback and emergency contacts.
- In-app notifications plus optional Firebase Cloud Messaging registration for browsers that support it.

## Architecture

```
Browser UI → Next.js App Router → protected API routes → Firebase Admin SDK
                                  ├→ Firestore / Storage
                                  └→ Gemini API / OCR provider interface
```

The browser never receives a Gemini key, Firebase Admin credential or service-account private key. Firebase Auth issues an ID token; `/api/auth/session` exchanges it for an httpOnly session cookie. Server routes verify the cookie and role before accessing private data.

## Local development

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open `http://localhost:3000`. Without Firebase environment variables, the product is intentionally a clearly labelled local demo workspace using browser-local sample data. It never invents medical AI output and never uploads files. Add Firebase and Gemini settings for real accounts, storage and AI operations.

Run validation:

```bash
npm run typecheck
npm run lint
npm run build
```

## Environment variables

Copy [.env.local.example](./.env.local.example) and fill only server-side secrets in `.env.local`; never commit it.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Web app configuration. These identify the Firebase project but do not grant privileged access. |
| `NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY` | reCAPTCHA v3 key for Firebase App Check (optional but recommended). |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | FCM web push public key. |
| `GEMINI_API_KEY` | Gemini API key. Server only. |
| `FIREBASE_ADMIN_*` | Firebase service-account configuration. Server only. Escape linebreaks in `FIREBASE_ADMIN_PRIVATE_KEY` as `\\n`. |
| `APP_URL` | Canonical application origin; used to reject cross-origin state changes. |
| `REQUIRE_APP_CHECK` | Set to `true` after App Check is deployed. |

## Firebase setup

1. Create a Firebase project and register a Web App. Copy its configuration into the `NEXT_PUBLIC_FIREBASE_*` variables.
2. Enable **Authentication → Email/Password**. Enable Google only if you set `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` and complete its consent-screen/provider settings.
3. Create a Firestore database in production mode and a Cloud Storage bucket.
4. Create a service account with the minimum Firebase Admin permissions needed by this server, then set the three `FIREBASE_ADMIN_*` values.
5. Deploy the security rules:

   ```bash
   firebase login
   firebase use YOUR_PROJECT_ID
   firebase deploy --only firestore:rules,storage
   ```

6. Register a reCAPTCHA v3 provider in Firebase App Check. Set the public site key, then set `REQUIRE_APP_CHECK=true` only after validating legitimate requests.
7. For browser push, configure FCM Web Push certificates, add the VAPID public key, and host `public/firebase-messaging-sw.js` on the same origin. In-app notifications remain available where push permission is denied.

### Roles

Roles come from Firebase custom claims, never from a browser request. First create the account, then assign its role from a trusted operator machine:

```bash
npm run set-role -- FIREBASE_UID doctor
npm run set-role -- FIREBASE_UID admin
```

The person must sign out and sign in again after a claim change. Create a matching `doctors/{uid}` profile using the admin workspace before publishing that doctor to patients.

## Gemini and OCR setup

Create a Gemini API key in Google AI Studio and set `GEMINI_API_KEY`. The default model is `gemini-2.5-flash`; override it with `GEMINI_MODEL` if required. `lib/ocr/index.ts` exposes an `OCRProvider` interface, so Google Cloud Vision or another compliant OCR supplier can replace `GeminiVisionOCR` without changing the upload workflow.

Documents only reach Gemini after a user explicitly opts in. The backend restricts upload MIME types to PDF/JPEG/PNG, validates magic bytes, limits size to 8 MB and ensures storage paths belong to the signed-in user.

## Data model

Private user records are stored under `users/{uid}` subcollections: `healthReports`, `prescriptions`, `waterLogs`, `fitnessLogs`, `bmiRecords`, `nutritionPlans`, `conversations/messages`, and `notifications`. Shared platform collections include `doctors`, `appointments`, `healthTips`, `emergencyContacts` and `feedback`.

Health reports are private. A doctor can access a report only when the report explicitly lists that doctor in `sharedWith` and a confirmed/completed appointment relationship exists; the server checks both conditions in `/api/patients`.

## Deployment notes

Deploy to Firebase App Hosting, Vercel, or another Node.js-capable host. Configure every environment variable in the host rather than committing them. Set `APP_URL` to the deployed HTTPS origin.

The product intentionally does not claim to diagnose, prescribe, change doses, or contact emergency services automatically. Review the safety prompt and local clinical/privacy requirements with qualified legal and healthcare professionals before a production launch.
