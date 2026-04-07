import type { Metadata } from "next";
import AuthProvider from "@/components/layout/auth-provider";
import { ToastProvider } from "@/components/ui/toast";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "EduHire — Teaching Jobs in Tamil Nadu",
    template: "%s | EduHire",
  },
  description:
    "Find your perfect teaching position across 15+ cities in Tamil Nadu. CBSE, ICSE, State Board, IB — all boards covered.",
  openGraph: {
    title: "EduHire — Teaching Jobs in Tamil Nadu",
    description:
      "Connecting passionate educators with leading schools across Tamil Nadu.",
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
        <AuthProvider>{children}</AuthProvider>
        <ToastProvider />
      </body>
    </html>
  );
}
