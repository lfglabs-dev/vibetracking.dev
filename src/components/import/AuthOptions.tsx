"use client";

import { createClient } from "@/lib/supabase/client";

interface AuthOptionsProps {
  isLoading: boolean;
}

// Storage key for pending import data
export const IMPORT_DATA_KEY = "vibetracking_import_data";
export const IMPORT_DATA_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export interface StoredImportData {
  data: string;
  timestamp: number;
  inviter?: string;
}

export function AuthOptions({ isLoading }: AuthOptionsProps) {
  const handleGitHubLogin = async () => {
    const supabase = createClient();

    // Get inviter from URL query param
    const urlParams = new URLSearchParams(window.location.search);
    const inviter = urlParams.get("inviter");

    // Store the hash data in localStorage with timestamp before redirecting
    // Using localStorage instead of sessionStorage to survive OAuth redirects
    if (typeof window !== "undefined" && window.location.hash) {
      const storedData: StoredImportData = {
        data: window.location.hash.slice(1),
        timestamp: Date.now(),
        inviter: inviter || undefined,
      };
      localStorage.setItem(IMPORT_DATA_KEY, JSON.stringify(storedData));
    }

    // Build the redirect URL, preserving inviter if present
    const nextUrl = inviter ? `/import?inviter=${encodeURIComponent(inviter)}` : "/import";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      },
    });

    if (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-center text-[#232323]/70 mb-4">
        Connect your GitHub account to save your profile
      </p>
      <button
        onClick={handleGitHubLogin}
        className="w-full py-3 px-4 bg-[#232323] text-white rounded-[10px] border-2 border-[#232323] hover:bg-[#333] transition-colors flex items-center justify-center gap-3 font-semibold"
        disabled={isLoading}
      >
        Continue with GitHub
      </button>
    </div>
  );
}
