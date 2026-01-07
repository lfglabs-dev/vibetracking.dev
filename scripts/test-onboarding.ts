#!/usr/bin/env npx tsx

/**
 * Test script for the vibe tracking onboarding flow.
 *
 * This script:
 * 1. Generates realistic sample import data
 * 2. Compresses and encodes it (like the CLI does)
 * 3. Opens the browser to localhost:3000/import with the data
 *
 * Usage:
 *   npm run test:onboarding
 *   # or
 *   npx tsx scripts/test-onboarding.ts
 *
 * Prerequisites:
 *   1. Start the dev server: npm run dev
 *   2. Run this script in another terminal
 */

import pako from "pako";
import { exec } from "child_process";

// Generate realistic test data
function generateTestData() {
  const now = Date.now();
  const today = new Date();

  // Generate daily activity for the last 90 days
  const dailyActivity = [];
  for (let i = 89; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Skip some days randomly for realistic gaps
    if (Math.random() > 0.7) continue;

    dailyActivity.push({
      date: date.toISOString().split("T")[0],
      messageCount: Math.floor(Math.random() * 100) + 10,
      sessionCount: Math.floor(Math.random() * 8) + 1,
      toolCallCount: Math.floor(Math.random() * 50) + 5,
      totalTokens: Math.floor(Math.random() * 500000) + 50000,
    });
  }

  // Calculate stats from daily activity
  const totalTokens = dailyActivity.reduce((sum, d) => sum + (d.totalTokens || 0), 0);
  const totalSessions = dailyActivity.reduce((sum, d) => sum + d.sessionCount, 0);
  const totalMessages = dailyActivity.reduce((sum, d) => sum + d.messageCount, 0);

  const data = {
    timestamp: now,
    version: 1,
    tools: {
      claude_code: {
        tool: "claude_code" as const,
        dailyActivity,
        modelUsage: [
          {
            model: "claude-sonnet-4-20250514",
            inputTokens: Math.floor(totalTokens * 0.4),
            outputTokens: Math.floor(totalTokens * 0.15),
            cacheReadTokens: Math.floor(totalTokens * 0.3),
            cacheCreationTokens: Math.floor(totalTokens * 0.05),
          },
          {
            model: "claude-3-5-haiku-20241022",
            inputTokens: Math.floor(totalTokens * 0.07),
            outputTokens: Math.floor(totalTokens * 0.03),
          },
        ],
        longestSession: {
          sessionId: "test-session-123",
          durationMs: 3600000 + Math.floor(Math.random() * 7200000), // 1-3 hours
          messageCount: 45,
          startedAt: new Date(now - 86400000).toISOString(),
        },
        stats: {
          totalTokens,
          totalSessions,
          totalMessages,
          longestSessionMs: 3600000 + Math.floor(Math.random() * 7200000),
          firstActivityDate: dailyActivity[0]?.date,
          lastActivityDate: dailyActivity[dailyActivity.length - 1]?.date,
        },
        hourCounts: {
          "9": 120,
          "10": 180,
          "11": 200,
          "14": 150,
          "15": 170,
          "16": 140,
        },
      },
    },
  };

  return data;
}

// Encode data like the CLI does
function encodeData(data: object): string {
  const jsonString = JSON.stringify(data);
  const compressed = pako.gzip(jsonString);
  return Buffer.from(compressed).toString("base64url");
}

// Open URL in default browser
function openBrowser(url: string) {
  const platform = process.platform;
  let command: string;

  if (platform === "darwin") {
    command = `open "${url}"`;
  } else if (platform === "win32") {
    command = `start "${url}"`;
  } else {
    command = `xdg-open "${url}"`;
  }

  exec(command, (error) => {
    if (error) {
      console.error("Failed to open browser:", error);
      console.log("\nManually open this URL:");
      console.log(url);
    }
  });
}

// Main
function main() {
  const baseUrl = process.env.BASE_URL || "http://localhost:3000";

  console.log("🎯 Generating test data for vibe tracking onboarding...\n");

  const data = generateTestData();
  const encoded = encodeData(data);

  const stats = data.tools.claude_code?.stats;
  console.log("📊 Generated test data:");
  console.log(`   Total Tokens: ${stats?.totalTokens.toLocaleString()}`);
  console.log(`   Total Sessions: ${stats?.totalSessions}`);
  console.log(`   Total Messages: ${stats?.totalMessages}`);
  console.log(`   Date Range: ${stats?.firstActivityDate} to ${stats?.lastActivityDate}`);
  console.log("");

  const importUrl = `${baseUrl}/import#${encoded}`;

  console.log("🔗 Import URL generated (hash length: " + encoded.length + " chars)");
  console.log("");
  console.log("🚀 Opening browser...\n");

  openBrowser(importUrl);

  console.log("📋 Next steps:");
  console.log("   1. The import page should show your test stats");
  console.log("   2. Click 'Continue with GitHub' to authenticate");
  console.log("   3. After auth, you'll be redirected to your profile");
  console.log("   4. Your profile will show the imported test data");
  console.log("");
  console.log("💡 If the browser didn't open, use this URL:");
  console.log(importUrl);
}

main();
