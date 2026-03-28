import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SupportOS — SaaS Agent Dashboard",
  description:
    "A high-fidelity SaaS support agent dashboard simulation showcasing SLA management, escalation workflows, AI context badges, internal notes, and real-time ticket state machines.",
  keywords: [
    "SaaS support dashboard",
    "customer success",
    "technical support",
    "SLA management",
    "ticket system",
    "portfolio project",
  ],
  authors: [{ name: "Support Agent Portfolio" }],
  openGraph: {
    type: "website",
    title: "SupportOS — SaaS Agent Dashboard",
    description:
      "Portfolio: A full-featured support agent dashboard with live SLA countdowns, P1 escalations, internal notes, and slash-command macros.",
    siteName: "SupportOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "SupportOS — SaaS Agent Dashboard",
    description:
      "Portfolio: A full-featured support agent dashboard with live SLA countdowns, P1 escalations, internal notes, and slash-command macros.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
