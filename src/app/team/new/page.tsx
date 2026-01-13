"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { GitHubOrg } from "@/lib/github-org";
import { AnimatedSticker } from "@/components/shared/AnimatedSticker";
import { Logo } from "@/components/shared/Logo";

type AuthState = "loading" | "not_logged_in" | "needs_org_access" | "has_org_access";

// Sticker positions around the card
const cardStickers = [
  { src: "/stickers/vibe.webp", className: "absolute -top-20 -left-28 -rotate-12", size: 160, delay: 100 },
  { src: "/stickers/rainbow.webp", className: "absolute -top-16 -right-24 rotate-12", size: 144, delay: 200 },
  { src: "/stickers/cursor.webp", className: "absolute top-1/4 -left-32 -rotate-6", size: 128, delay: 300 },
  { src: "/stickers/banana.webp", className: "absolute top-1/3 -right-28 rotate-6", size: 128, delay: 400 },
  { src: "/stickers/cloud.webp", className: "absolute -bottom-20 -left-24 rotate-12", size: 144, delay: 500 },
  { src: "/stickers/jensen.webp", className: "absolute -bottom-16 -right-28 -rotate-12", size: 160, delay: 600 },
];

// Extra stickers scattered around the page
const pageStickers = [
  { src: "/stickers/elon.webp", className: "fixed top-8 left-8 rotate-12", size: 120, delay: 700 },
  { src: "/stickers/marck.webp", className: "fixed top-12 right-12 -rotate-6", size: 140, delay: 800 },
  { src: "/stickers/no_em_dashes.webp", className: "fixed bottom-24 left-12 rotate-6", size: 130, delay: 900 },
  { src: "/stickers/vibe.webp", className: "fixed bottom-16 right-8 -rotate-12", size: 110, delay: 1000 },
  { src: "/stickers/rainbow.webp", className: "fixed top-1/3 left-4 rotate-12", size: 100, delay: 1100 },
  { src: "/stickers/cloud.webp", className: "fixed top-1/2 right-4 -rotate-6", size: 110, delay: 1200 },
];

export default function NewTeamPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [orgs, setOrgs] = useState<GitHubOrg[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuthAndLoadOrgs() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Not logged in at all
        if (!session) {
          setAuthState("not_logged_in");
          return;
        }

        // Logged in but no provider token (shouldn't happen normally)
        if (!session.provider_token) {
          setAuthState("needs_org_access");
          return;
        }

        // Try to fetch orgs - this will tell us if we have the right scope
        const response = await fetch("https://api.github.com/user/orgs", {
          headers: {
            Authorization: `Bearer ${session.provider_token}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (response.status === 403) {
          // Forbidden - likely missing read:org scope
          setAuthState("needs_org_access");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }

        const data = await response.json();
        setOrgs(data);
        setAuthState("has_org_access");
      } catch (err) {
        console.error("Error checking auth:", err);
        setError("Failed to load your organizations");
        setAuthState("needs_org_access");
      }
    }

    checkAuthAndLoadOrgs();
  }, []);

  const handleGrantOrgAccess = async () => {
    const supabase = createClient();

    // Re-authenticate with read:org scope
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/team/new`,
        scopes: "read:org", // Request org access
      },
    });

    if (error) {
      setError("Failed to start authentication");
      console.error("OAuth error:", error);
    }
  };

  const handleLogin = async () => {
    const supabase = createClient();

    // Login with read:org scope since they're going to create a team
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/team/new`,
        scopes: "read:org",
      },
    });

    if (error) {
      setError("Failed to start authentication");
      console.error("OAuth error:", error);
    }
  };

  const handleCreateTeam = async () => {
    if (!selectedOrg) return;

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgLogin: selectedOrg }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Team already exists, redirect to it
          router.push(`/team/${data.teamSlug}`);
          return;
        }
        throw new Error(data.error || "Failed to create team");
      }

      router.push(`/team/${data.team.slug}`);
    } catch (err) {
      console.error("Error creating team:", err);
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  };

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-8 px-4 overflow-hidden">
      {/* Page stickers scattered around */}
      {pageStickers.map((sticker, index) => (
        <AnimatedSticker
          key={`page-${index}`}
          src={sticker.src}
          width={sticker.size}
          height={sticker.size}
          className={sticker.className}
          delay={sticker.delay}
        />
      ))}

      <div className="max-w-md mx-auto w-full relative">
        {/* Stickers around the card */}
        {cardStickers.map((sticker, index) => (
          <AnimatedSticker
            key={`card-${index}`}
            src={sticker.src}
            width={sticker.size}
            height={sticker.size}
            className={sticker.className}
            delay={sticker.delay}
          />
        ))}

        <div className="relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <Logo size="xl" asLink={false} className="mb-4" />
            <p className="text-2xl font-bold text-[#232323]">
              Create a Team
            </p>
          </div>

          {/* Main Card */}
          <div className="card">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            {/* Not logged in */}
            {authState === "not_logged_in" && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🔐</div>
                <h2 className="text-lg font-bold mb-2">Sign in to continue</h2>
                <p className="text-[#232323]/60 mb-6 text-sm">
                  You need to sign in with GitHub to create a team.
                </p>
                <button onClick={handleLogin} className="btn btn-primary w-full">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Sign in with GitHub
                </button>
              </div>
            )}

            {/* Needs org access */}
            {authState === "needs_org_access" && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🏢</div>
                <h2 className="text-lg font-bold mb-2">Grant organization access</h2>
                <p className="text-[#232323]/60 mb-6 text-sm">
                  To create a team, we need permission to see your GitHub organizations.
                  This is a one-time authorization.
                </p>
                <button onClick={handleGrantOrgAccess} className="btn btn-primary w-full whitespace-nowrap">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Grant Access
                </button>
              </div>
            )}

            {/* Has org access - no orgs found */}
            {authState === "has_org_access" && orgs.length === 0 && (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">🏢</div>
                <h2 className="text-lg font-bold mb-2">No organizations found</h2>
                <p className="text-[#232323]/60 mb-6 text-sm">
                  You need to be a member of a GitHub organization to create a team.
                </p>
                <a
                  href="https://github.com/organizations/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full inline-block text-center"
                >
                  Create an Organization on GitHub
                </a>
              </div>
            )}

            {/* Has org access - show org selector */}
            {authState === "has_org_access" && orgs.length > 0 && (
              <div className="space-y-4">
                <p className="text-center text-[#232323]/60 text-sm">
                  Select a GitHub organization to create a team.
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {orgs.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => setSelectedOrg(org.login)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                        selectedOrg === org.login
                          ? "border-[#AAE7C0] bg-[#AAE7C0]/10"
                          : "border-transparent bg-[#232323]/5 hover:bg-[#232323]/10"
                      }`}
                    >
                      <img
                        src={org.avatar_url}
                        alt={org.name || org.login}
                        className="w-10 h-10 rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{org.name || org.login}</div>
                        <div className="text-xs text-[#232323]/60 truncate">@{org.login}</div>
                      </div>
                      {selectedOrg === org.login && (
                        <div className="text-[#238636] text-xl flex-shrink-0">✓</div>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCreateTeam}
                  disabled={!selectedOrg || creating}
                  className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                      Creating team...
                    </>
                  ) : (
                    "Create Team"
                  )}
                </button>

                <p className="text-xs text-[#232323]/40 text-center">
                  Team members will be synced from your GitHub organization.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
