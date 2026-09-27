"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { firebaseConfigured, clientAuth } from "@/lib/firebase/client";
import { api } from "@/lib/firestore/client";
import { Button, Input, Field, Busy } from "@/components/ui";
import { toast } from "sonner";
export function AuthForm({
  mode,
}: {
  mode: "login" | "register" | "forgot-password" | "reset-password";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const registerMode = mode === "register";
  const reset = mode === "forgot-password" || mode === "reset-password";
  const schema = z.object({
    name: registerMode
      ? z.string().trim().min(2, "Enter your full name")
      : z.string().optional(),
    email:
      mode === "reset-password"
        ? z.string().optional()
        : z.email("Enter a valid email address"),
    password:
      mode === "forgot-password"
        ? z.string().optional()
        : z
            .string()
            .min(registerMode || reset ? 8 : 1, "Use at least 8 characters")
            .max(128),
    consent: registerMode
      ? z.literal(true, { error: "Please accept to continue" })
      : z.boolean().optional(),
  });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });
  async function establish(user: import("firebase/auth").User) {
    const data = await api<{ role: string }>("/api/auth/session", {
      method: "POST",
      body: JSON.stringify({ idToken: await user.getIdToken(true) }),
    });
    router.push(
      data.role === "admin"
        ? "/admin/dashboard"
        : data.role === "doctor"
          ? "/doctor/dashboard"
          : "/dashboard",
    );
    router.refresh();
  }
  async function submit(data: z.infer<typeof schema>) {
    setError("");
    if (!firebaseConfigured) {
      setError(
        "Firebase authentication isn’t configured yet. You can explore the demo workspace below.",
      );
      return;
    }
    try {
      const auth = clientAuth();
      await setPersistence(auth, browserLocalPersistence);
      if (mode === "forgot-password") {
        await sendPasswordResetEmail(auth, data.email!);
        setDone(true);
        return;
      }
      if (mode === "reset-password") {
        const code = params.get("oobCode");
        if (!code)
          throw new Error(
            "This password reset link is invalid. Request a new one.",
          );
        await confirmPasswordReset(auth, code, data.password!);
        setDone(true);
        return;
      }
      const credential = registerMode
        ? await createUserWithEmailAndPassword(
            auth,
            data.email!,
            data.password!,
          )
        : await signInWithEmailAndPassword(auth, data.email!, data.password!);
      if (registerMode)
        await updateProfile(credential.user, { displayName: data.name });
      await establish(credential.user);
    } catch {
      setError(
        reset
          ? "Could not complete this request. Check your reset link or try again."
          : "We couldn’t sign you in. Check your details, or try another sign-in method.",
      );
    }
  }
  return (
    <div className="auth-grid">
      <aside className="auth-aside">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.jpeg"
            alt="UyirNadi"
            width={42}
            height={42}
            className="rounded-md object-cover object-top"
          />
          <span className="text-3xl font-semibold tracking-tight">
            UyirNadi
          </span>
        </Link>
        <div>
          <span className="mb-7 inline-block rounded-full border border-[#d0dcc0] px-4 py-2 text-xs text-primary">
            A little care changes everything.
          </span>
          <h1 className="max-w-lg text-5xl font-medium leading-[1.2]">
            Your Lifeline
            <br />
            to Better Health.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-[#879578]">
            A thoughtful home for your health. Everyday wellbeing, clearer
            information, and connected care — all in one place.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 text-xs text-[#355b43]"><span className="rounded-full border border-[#cbd9c2] bg-white/65 px-4 py-2">Private health records</span><span className="rounded-full border border-[#cbd9c2] bg-white/65 px-4 py-2">Connected care</span></div>
        </div>
        <div>
          <p lang="ta" className="text-xs leading-6 text-[#81936e]">
            நோய்நாடி நோய்முதல் நாடி அதுதணிக்கும்
            <br />
            வாய்நாடி வாய்ப்பச் செயல்.
          </p>
          <p className="mt-4 text-[10px] text-[#99a38c]">
            Thoughtfully built for your wellbeing.
          </p>
        </div>
      </aside>
      <main className="flex items-center justify-center bg-white p-6 sm:p-14">
        <div className="w-full max-w-sm">
          <Link
            href="/dashboard"
            className="mb-10 flex items-center gap-2 lg:hidden"
          >
            <Image
              src="/logo.jpeg"
              alt="UyirNadi"
              width={32}
              height={32}
              className="rounded-md object-cover object-top"
            />
            <span className="text-xl font-semibold">UyirNadi</span>
          </Link>
          <p className="eyebrow mb-3">YOUR HEALTH JOURNEY STARTS HERE</p>
          <h1>
            {registerMode
              ? "A healthier chapter awaits."
              : mode === "forgot-password"
                ? "Let’s get you back in."
                : mode === "reset-password"
                  ? "A fresh start."
                  : "Good to have you here."}
          </h1>
          <p className="mt-3 mb-7 text-sm leading-relaxed text-muted-foreground">
            {registerMode
              ? "Create your account and make room for a little more care."
              : reset
                ? "We’ll help you securely reset your password."
                : "Sign in to your personal space for better health."}
          </p>
          {done ? (
            <div className="rounded-lg bg-muted p-5">
              <ShieldCheck className="mb-3 size-6 text-primary" />
              <p className="text-sm">
                {mode === "forgot-password"
                  ? "If an account exists for this email, you’ll receive a password reset link."
                  : "Your password has been reset. You can now sign in."}
              </p>
              <Button asChild className="mt-5">
                <Link href="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(submit)}>
              {registerMode && (
                <Field
                  label="Full name"
                  htmlFor="name"
                  error={errors.name?.message}
                >
                  <Input
                    id="name"
                    autoComplete="name"
                    placeholder="Your full name"
                    {...register("name")}
                  />
                </Field>
              )}
              {mode !== "reset-password" && (
                <Field
                  label="Email address"
                  htmlFor="email"
                  error={errors.email?.message}
                >
                  <Input
                    id="email"
                    autoComplete="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email")}
                  />
                </Field>
              )}
              {mode !== "forgot-password" && (
                <Field
                  label="Password"
                  htmlFor="password"
                  error={errors.password?.message}
                >
                  <div className="relative">
                    <Input
                      id="password"
                      type={show ? "text" : "password"}
                      autoComplete={
                        registerMode || reset
                          ? "new-password"
                          : "current-password"
                      }
                      placeholder={
                        registerMode
                          ? "At least 8 characters"
                          : "Enter your password"
                      }
                      className="pr-11"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-3 top-3 text-muted-foreground"
                      onClick={() => setShow(!show)}
                    >
                      {show ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </Field>
              )}
              {mode === "login" && (
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
              {registerMode && (
                <div>
                  <label className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                    <input
                      type="checkbox"
                      className="mt-1 accent-primary"
                      {...register("consent")}
                    />
                    I understand that AI guidance is informational, and that my
                    account data will be stored to provide healthcare management
                    features.
                  </label>
                  {errors.consent && (
                    <p className="mt-2 text-xs text-red-600">
                      {errors.consent.message}
                    </p>
                  )}
                </div>
              )}
              {error && (
                <p
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-xs text-red-700"
                >
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Busy>Please wait...</Busy>
                ) : (
                  <>
                    {registerMode
                      ? "Create my account"
                      : mode === "forgot-password"
                        ? "Send reset link"
                        : mode === "reset-password"
                          ? "Reset password"
                          : "Sign in"}
                    <ArrowRight />
                  </>
                )}
              </Button>
            </form>
          )}
          {!reset && process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true" && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={async () => {
                try {
                  const user = await signInWithPopup(
                    clientAuth(),
                    new GoogleAuthProvider(),
                  );
                  await establish(user.user);
                } catch {
                  toast.error("Google sign-in was not completed.");
                }
              }}
            >
              Continue with Google
            </Button>
          )}
          {!reset && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {registerMode ? "Already have an account?" : "New to UyirNadi?"}{" "}
              <Link
                className="font-medium text-primary"
                href={registerMode ? "/login" : "/register"}
              >
                {registerMode ? "Sign in" : "Create an account"}
              </Link>
            </p>
          )}
          {!firebaseConfigured && (
            <div className="mt-8 border-t border-border pt-6">
              <Button variant="secondary" asChild className="w-full">
                <Link href="/dashboard">
                  Explore the demo workspace
                  <ArrowUpRightIcon />
                </Link>
              </Button>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                No account needed. Sample data only.
              </p>
            </div>
          )}
          <p className="mt-8 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Your privacy is at the heart of our care.
          </p>
        </div>
      </main>
    </div>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight className="-rotate-45" />;
}
