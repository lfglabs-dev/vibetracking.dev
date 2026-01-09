"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeImportData, type ImportData } from "@/lib/utils";
import {
  AuthOptions,
  IMPORT_DATA_KEY,
  IMPORT_DATA_EXPIRY_MS,
  type StoredImportData,
} from "@/components/import/AuthOptions";
import { createClient } from "@/lib/supabase/client";
import { AnimatedSticker } from "@/components/shared/AnimatedSticker";
import { Logo } from "@/components/shared/Logo";

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
      // Get data from hash or localStorage first
      let encodedData: string | null = null;

      if (typeof window !== "undefined") {
        // First try hash (fresh from CLI)
        if (window.location.hash && window.location.hash.length > 1) {
          encodedData = window.location.hash.slice(1);
          // Also store in localStorage in case user refreshes or OAuth redirects
          const storedData: StoredImportData = {
            data: encodedData,
            timestamp: Date.now(),
          };
          localStorage.setItem(IMPORT_DATA_KEY, JSON.stringify(storedData));
        }
        // Then try localStorage (after OAuth redirect or page refresh)
        else {
          const stored = localStorage.getItem(IMPORT_DATA_KEY);
          if (stored) {
            try {
              const parsed: StoredImportData = JSON.parse(stored);
              // Check if data is not expired (1 hour)
              if (Date.now() - parsed.timestamp < IMPORT_DATA_EXPIRY_MS) {
                encodedData = parsed.data;
              } else {
                // Data expired, clean up
                localStorage.removeItem(IMPORT_DATA_KEY);
              }
            } catch {
              // Invalid JSON, clean up
              localStorage.removeItem(IMPORT_DATA_KEY);
            }
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

      // Clean up localStorage after successful import
      localStorage.removeItem(IMPORT_DATA_KEY);

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
