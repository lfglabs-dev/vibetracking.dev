"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface AuthOptionsProps {
  onAnonymousSubmit: (displayName: string, company: string) => Promise<void>;
  isLoading: boolean;
}

export function AuthOptions({ onAnonymousSubmit, isLoading }: AuthOptionsProps) {
  const [showAnonymousForm, setShowAnonymousForm] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [company, setCompany] = useState("");

  const handleGitHubLogin = async () => {
    const supabase = createClient();

    // Store the hash data in sessionStorage before redirecting
    if (typeof window !== "undefined" && window.location.hash) {
      sessionStorage.setItem("importData", window.location.hash.slice(1));
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/import`,
      },
    });

    if (error) {
      console.error("Error logging in:", error);
    }
  };

  const handleAnonymousSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAnonymousSubmit(displayName, company);
  };

  if (showAnonymousForm) {
    return (
      <form onSubmit={handleAnonymousSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] border border-[#232323] focus:outline-none focus:ring-2 focus:ring-[#AAE7C0]"
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Company (optional)
          </label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full px-4 py-3 rounded-[10px] border border-[#232323] focus:outline-none focus:ring-2 focus:ring-[#AAE7C0]"
            placeholder="Your company"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowAnonymousForm(false)}
            className="btn-secondary flex-1"
            disabled={isLoading}
          >
            Back
          </button>
          <button
            type="submit"
            className="btn-primary flex-1"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleGitHubLogin}
        className="w-full py-3 px-4 bg-[#232323] text-white rounded-[10px] border-2 border-[#232323] hover:bg-[#333] transition-colors flex items-center justify-center gap-3 font-semibold"
        disabled={isLoading}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path
            fillRule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            clipRule="evenodd"
          />
        </svg>
        Continue with GitHub
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#232323]/20"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-[#EEF0F2] text-[#232323]/60">or</span>
        </div>
      </div>

      <button
        onClick={() => setShowAnonymousForm(true)}
        className="btn-secondary w-full"
        disabled={isLoading}
      >
        Continue without login
      </button>
    </div>
  );
}
