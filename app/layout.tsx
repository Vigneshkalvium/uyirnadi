import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "UyirNadi — Your Lifeline to Better Health",
    template: "%s | UyirNadi",
  },
  description:
    "A thoughtful home for your health. Track your wellbeing, connect with care, and get informational AI guidance.",
  icons: { icon: "/logo.jpeg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
