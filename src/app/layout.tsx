import type { Metadata } from "next";
import AuthProvider from "@/components/layout/auth-provider";
import PostHogProvider from "@/components/analytics/posthog-provider";
import { ToastProvider } from "@/components/ui/toast";
import { LangProvider } from "@/lib/i18n/context";
import "@/styles/globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://theeduhire.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "EduHire — Teaching Jobs in Tamil Nadu | CBSE, ICSE, State Board",
    template: "%s | EduHire",
  },
  description:
    "Find teaching jobs across Tamil Nadu. CBSE, ICSE, State Board, Matriculation — all boards. Verified schools, transparent salaries, smart matching. Free for teachers.",
  keywords: [
    "teaching jobs Tamil Nadu",
    "teacher jobs Chennai",
    "teacher jobs Coimbatore",
    "CBSE teaching jobs",
    "ICSE teaching jobs",
    "State Board teacher jobs",
    "Matriculation school jobs",
    "school teacher jobs India",
    "education jobs Tamil Nadu",
    "teacher recruitment India",
    "TNTET jobs",
    "CTET teaching jobs",
    "part time teaching jobs",
    "fresher teacher jobs",
    "B.Ed jobs Tamil Nadu",
  ],
  openGraph: {
    title: "EduHire — Teaching Jobs in Tamil Nadu | CBSE, ICSE, State Board",
    description:
      "Verified schools, transparent salaries, smart matching. Find your next teaching role in Tamil Nadu.",
    url: BASE_URL,
    siteName: "EduHire",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "EduHire — Teaching Jobs in Tamil Nadu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EduHire — Teaching Jobs in Tamil Nadu",
    description:
      "Verified schools, transparent salaries. Free for teachers. Find your next teaching role in Tamil Nadu.",
    images: ["/og-default.png"],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
