"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeImportData, type ImportData } from "@/lib/utils";
import { StatsPreview } from "@/components/import/StatsPreview";
import { AuthOptions } from "@/components/import/AuthOptions";
import { createClient } from "@/lib/supabase/client";
import { nanoid } from "nanoid";

export default function ImportPage() {
  const router = useRouter();
  const [data, setData] = useState<ImportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
      }
    };
    checkAuth();

    // Get data from hash or sessionStorage
    let encodedData: string | null = null;

    if (typeof window !== "undefined") {
      // First try hash
      if (window.location.hash && window.location.hash.length > 1) {
        encodedData = window.location.hash.slice(1);
      }
      // Then try sessionStorage (after OAuth redirect)
      else {
        encodedData = sessionStorage.getItem("importData");
        if (encodedData) {
          sessionStorage.removeItem("importData");
        }
      }
    }

    if (!encodedData) {
      setError("No data found. Please run `bunx vibetracking` first.");
      return;
    }

    const decoded = decodeImportData(encodedData);
    if (!decoded) {
      setError("Invalid data format. Please run `bunx vibetracking` again.");
      return;
    }

    setData(decoded);

    // If authenticated and has data, auto-submit
    if (isAuthenticated && decoded) {
      handleImport(decoded);
    }
  }, [isAuthenticated]);

  const handleImport = async (importData: ImportData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Import failed");
      }

      const result = await response.json();
      router.push(result.profileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setIsLoading(false);
    }
  };

  const handleAnonymousSubmit = async (
    displayName: string,
    company: string
  ) => {
    if (!data) return;

    setIsLoading(true);
    try {
      // Create anonymous user first
      const anonymousId = nanoid(8);

      const response = await fetch("/api/auth/anonymous", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymousId,
          displayName,
          company,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create profile");
      }

      // Now import the data
      const importResponse = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          anonymousId,
        }),
      });

      if (!importResponse.ok) {
        const error = await importResponse.json();
        throw new Error(error.message || "Import failed");
      }

      const result = await importResponse.json();
      router.push(result.profileUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-bold mb-2">Oops!</h1>
          <p className="text-[#232323]/70 mb-6">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="btn-primary w-full"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">
            <span className="text-[#FEA6CC]">vibe</span>
            <span className="text-[#AAE7C0]">tracking</span>
          </h1>
          <p className="text-[#232323]/70">Your AI coding stats are ready!</p>
        </div>

        {/* Stats Preview */}
        <div className="mb-8">
          <StatsPreview data={data} />
        </div>

        {/* Divider */}
        <div className="border-t border-[#232323]/10 my-8" />

        {/* Auth Options */}
        <div>
          <h2 className="text-lg font-bold mb-4 text-center">
            Save your profile
          </h2>
          {isAuthenticated ? (
            <div className="text-center">
              <p className="text-[#232323]/70 mb-4">
                Importing your data...
              </p>
              <div className="animate-pulse">Please wait...</div>
            </div>
          ) : (
            <AuthOptions
              onAnonymousSubmit={handleAnonymousSubmit}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
