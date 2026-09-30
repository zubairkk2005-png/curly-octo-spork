import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ProfitPilot — Know Your Real Profit",
  description:
    "ProfitPilot helps Amazon and eBay sellers understand revenue, costs, margins, and real profit.",
  openGraph: {
    title: "ProfitPilot — Know Your Real Profit",
    description:
      "ProfitPilot helps Amazon and eBay sellers understand revenue, costs, margins, and real profit.",
    type: "website",
  },
};

// Applies the saved theme before paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem('pp_theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
