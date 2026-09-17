import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Chat } from "@/components/Chat";
import { themeBootScript } from "@/components/theme";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Northstar — your money, explained",
  description:
    "See what you own, what it reacts to, and what to do about it — in plain English.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <Nav />
        <main>
          <div className="wrap">{children}</div>
        </main>
        <Chat />
      </body>
    </html>
  );
}
