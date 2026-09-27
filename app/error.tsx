"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1>We hit a small bump.</h1>
      <p className="text-muted-foreground">
        Your information couldn’t be loaded. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-5 py-3 text-white"
      >
        Try again
      </button>
    </main>
  );
}
