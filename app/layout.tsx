import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Certi Gen - Digital Certificate Management",
  description: "Sistem Manajemen Sertifikat Digital dengan Verifikasi QR Code",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased font-sans bg-stone-50 text-stone-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
