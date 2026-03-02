import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { NotificationProvider } from "@/components/NotificationProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskFlow - Smart Task Management",
  description: "A modern, intuitive task management application inspired by Todoist. Organize your work, amplify your productivity.",
  keywords: ["TaskFlow", "Task Management", "Todoist", "Productivity", "Next.js", "TypeScript"],
  authors: [{ name: "TaskFlow Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "TaskFlow - Smart Task Management",
    description: "Organize your work, amplify your productivity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskFlow - Smart Task Management",
    description: "Organize your work, amplify your productivity",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <NotificationProvider />
        </Providers>
      </body>
    </html>
  );
}
