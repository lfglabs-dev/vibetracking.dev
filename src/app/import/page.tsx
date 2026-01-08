"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeImportData, type ImportData } from "@/lib/utils";
import { AuthOptions } from "@/components/import/AuthOptions";
import { createClient } from "@/lib/supabase/client";
import { AnimatedSticker } from "@/components/shared/AnimatedSticker";
import { Logo } from "@/components/shared/Logo";

function ImportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ImportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [needsCompany, setNeedsCompany] = useState(false);
  const [company, setCompany] = useState("");

  useEffect(() => {
    const initialize = async () => {
      // Get data from hash or sessionStorage first
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

      // Check if user is authenticated
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        // Check if user already has a company set
        const { data: existingUser } = await supabase
          .from("users")
          .select("company")
          .eq("id", user.id)
          .single<{ company: string | null }>();

        if (existingUser?.company) {
          // User already has company, proceed with import
          handleImport(decoded);
        } else {
          // User needs to set company first
          setNeedsCompany(true);
        }
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleImport = async (importData: ImportData, companyName?: string) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...importData,
          company: companyName,
        }),
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

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setNeedsCompany(false);
    handleImport(data, company);
  };

  const handleSkipCompany = () => {
    if (!data) return;
    setNeedsCompany(false);
    handleImport(data);
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
    <div className="min-h-screen flex items-center justify-center py-8 px-4">
      <div className="max-w-md mx-auto w-full relative">
        {/* Stickers - positioned in a circle around the form with more spacing */}
        <div
          className="pointer-events-none select-none absolute inset-0 z-0 overflow-visible"
          aria-hidden="true"
        >
          {/* Top left - 10 o'clock position */}
          <AnimatedSticker
            src="/stickers/vibe.webp"
            width={200}
            height={200}
            className="absolute -top-32 -left-40 md:-left-56 lg:-left-72 w-40 md:w-48 lg:w-52 rotate-[-12deg] drop-shadow-lg"
            delay={100}
          />
          {/* Top right - 2 o'clock position */}
          <AnimatedSticker
            src="/stickers/rainbow.webp"
            width={200}
            height={200}
            className="absolute -top-28 -right-36 md:-right-56 lg:-right-72 w-40 md:w-48 lg:w-52 rotate-[15deg] drop-shadow-lg"
            delay={200}
          />
          {/* Left side - 9 o'clock position */}
          <AnimatedSticker
            src="/stickers/cursor.webp"
            width={160}
            height={160}
            className="absolute top-1/3 -left-36 md:-left-52 lg:-left-64 w-32 md:w-40 lg:w-44 rotate-[8deg] hidden sm:block drop-shadow-lg"
            delay={300}
          />
          {/* Right side - 3 o'clock position */}
          <AnimatedSticker
            src="/stickers/banana.webp"
            width={160}
            height={160}
            className="absolute top-1/3 -right-36 md:-right-52 lg:-right-64 w-32 md:w-40 lg:w-44 rotate-[-8deg] hidden sm:block drop-shadow-lg"
            delay={400}
          />
          {/* Bottom left - 8 o'clock position */}
          <AnimatedSticker
            src="/stickers/cloud.webp"
            width={140}
            height={140}
            className="absolute -bottom-8 -left-32 md:-left-48 lg:-left-60 w-28 md:w-36 lg:w-40 rotate-[10deg] hidden md:block drop-shadow-lg"
            delay={500}
          />
          {/* Bottom right - 4 o'clock position */}
          <AnimatedSticker
            src="/stickers/jensen.webp"
            width={160}
            height={160}
            className="absolute -bottom-4 -right-32 md:-right-52 lg:-right-64 w-32 md:w-40 lg:w-44 rotate-[-10deg] hidden md:block drop-shadow-lg"
            delay={600}
          />
        </div>

        <div className="relative z-10">
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <Logo size="xl" asLink={false} className="mb-4" />
            <p className="text-2xl font-bold text-[#232323]">
              You&apos;re almost there...
            </p>
          </div>

          {/* Save Profile Form */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4 text-center">
              Save your profile
            </h2>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#AAE7C0] border-t-transparent mb-4"></div>
                <p className="text-[#232323]/70">
                  Importing your data...
                </p>
                <p className="text-sm text-[#232323]/50 mt-2">
                  This may take a moment, please don&apos;t refresh the page
                </p>
              </div>
            ) : needsCompany ? (
              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <p className="text-center text-[#232323]/70 mb-4">
                  One more thing! Add your company to complete your profile.
                </p>
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
                    onClick={handleSkipCompany}
                    className="btn-secondary flex-1"
                  >
                    Skip
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    Continue
                  </button>
                </div>
              </form>
            ) : isAuthenticated ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#AAE7C0] border-t-transparent mb-4"></div>
                <p className="text-[#232323]/70">
                  Setting up your profile...
                </p>
              </div>
            ) : (
              <AuthOptions isLoading={isLoading} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportPageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-xl">Loading...</div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<ImportPageLoading />}>
      <ImportPageContent />
    </Suspense>
  );
}
