"use client";

import { useState } from "react";

export function CTABox() {
  const [copied, setCopied] = useState(false);

  const command = "bunx vibetracking";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-center py-12">
      {/* Main Title */}
      <h1 className="text-5xl md:text-6xl font-black mb-4">
        Are you a good vibe Coder ?{" "}
        <span className="inline-block animate-bounce">
          <svg
            className="w-10 h-10 md:w-12 md:h-12 inline text-[#FEA6CC]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-lg md:text-xl text-[#232323]/70 mb-8 max-w-xl mx-auto">
        Track your AI coding usage across Claude Code, Codex, and Cursor. One command. Zero config.
      </p>

      {/* Command Box */}
      <div className="inline-flex items-center gap-2 bg-[#232323] rounded-xl px-4 py-3 mb-4">
        <code className="text-white font-mono text-lg">{command}</code>
        <span className="text-white/30">|</span>
        <span className="text-[#AAE7C0] font-mono text-sm">bash</span>
        <button
          onClick={handleCopy}
          className="text-white/50 hover:text-white transition-colors ml-2 p-1 rounded hover:bg-white/10"
          title="Copy to clipboard"
        >
          {copied ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Sub-link */}
      <p className="text-sm text-[#232323]/50">
        Or check out the{" "}
        <a href="https://github.com/vibetracking/cli" className="text-[#FEA6CC] hover:underline">
          documentation
        </a>
      </p>
    </div>
  );
}
