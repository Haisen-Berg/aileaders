import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AILeaders.uz — Excel Таҳлили",
  description: "Беш миллион сунъий интеллект етакчилари лойиҳаси",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full">
      <body className={`${geist.className} min-h-full`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
