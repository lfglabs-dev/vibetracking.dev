import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "900"],
});

export const metadata: Metadata = {
  title: "Vibetracking - Track your AI coding vibes",
  description: "See your AI coding tool usage stats and compete on the leaderboard",
  metadataBase: new URL("https://vibetracking.dev"),
  openGraph: {
    title: "Vibetracking",
    description: "Track your AI coding vibes",
    type: "website",
    siteName: "Vibetracking",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vibetracking",
    description: "Track your AI coding vibes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${rubik.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
