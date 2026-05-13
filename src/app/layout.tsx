import type { Metadata } from "next";
import AuthProvider from "@/components/layout/auth-provider";
import PostHogProvider from "@/components/analytics/posthog-provider";
import { ToastProvider } from "@/components/ui/toast";
import { LangProvider } from "@/lib/i18n/context";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "EduHire — Teaching Jobs in India | CBSE, ICSE, State Board Jobs",
    template: "%s | EduHire",
  },
  description:
    "Find your perfect teaching position across India. CBSE, ICSE, State Board, IB — all boards covered. Verified schools, transparent salaries, smart matching.",
  keywords: [
    "teaching jobs",
    "teacher jobs",
    "teaching positions",
    "CBSE jobs",
    "ICSE jobs",
    "State Board jobs",
    "school teacher jobs",
    "education jobs",
    "teaching vacancies",
    "teacher recruitment",
    "online teaching jobs",
    "part time teaching jobs"
  ],
  openGraph: {
    title: "EduHire — Teaching Jobs in India | CBSE, ICSE, State Board Jobs",
    description:
      "Connecting passionate educators with leading schools across India.",
    url: "https://theeduhire.in",
    siteName: "EduHire",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <LangProvider>
            <PostHogProvider />
            {children}
          </LangProvider>
        </AuthProvider>
        <ToastProvider />
      </body>
    </html>
  );
}
