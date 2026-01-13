"use client";

import Link from "next/link";

interface PrivateTeamPageProps {
  teamName: string;
}

export function PrivateTeamPage({ teamName }: PrivateTeamPageProps) {
  return (
    <main className="min-h-screen bg-[#FFFBF5]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-black">vibetracking</h1>
          </Link>
        </header>

        {/* Private Team Card */}
        <div className="card text-center py-16">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold mb-3">Private Team</h2>
          <p className="text-[#232323]/60 mb-6 max-w-md mx-auto">
            This team&apos;s stats are private. Only team members can view this page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn btn-secondary">
              Go to Leaderboard
            </Link>
            <Link href="/team/new" className="btn btn-primary">
              Create Your Own Team
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[#232323]/40 mt-8 text-sm">
          Want to track your team&apos;s AI usage?{" "}
          <Link href="/team/new" className="underline hover:text-[#232323]/60">
            Create a team
          </Link>
        </p>
      </div>
    </main>
  );
}
