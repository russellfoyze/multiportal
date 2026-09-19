import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MA HOSSAIN — Private Document Portal",
  description: "Secure private document vault powered by Google Drive API for Russell Foyze.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
