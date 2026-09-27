import { Suspense } from "react";
import { AuthForm } from "@/components/forms/auth-form";
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
