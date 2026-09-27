import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="eyebrow">UYIRNADI · 404</p>
      <h1>Let’s get you back to care.</h1>
      <p className="text-muted-foreground">We couldn’t find that page.</p>
      <Link
        className="rounded-lg bg-primary px-5 py-3 text-white"
        href="/dashboard"
      >
        Back to your dashboard
      </Link>
    </main>
  );
}
