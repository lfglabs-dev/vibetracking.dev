import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import Your Stats | Vibetracking",
  description: "Import your AI coding tool usage stats and join the leaderboard",
  openGraph: {
    title: "Import Your Stats | Vibetracking",
    description: "Import your AI coding tool usage stats and join the leaderboard",
    images: ["/previews/preview.webp"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Import Your Stats | Vibetracking",
    description: "Import your AI coding tool usage stats and join the leaderboard",
    images: ["/previews/preview.webp"],
  },
};

export default function ImportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
