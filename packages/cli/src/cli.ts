#!/usr/bin/env bun
/**
 * Vibetracking CLI
 * Track AI coding assistant usage across Claude Code, Codex, Cursor, and more.
 * Browser-first experience - data is viewed and shared on vibetracking.dev
 */

import { Command } from "commander";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };
import pc from "picocolors";
import open from "open";
import pako from "pako";

import {
  clearCursorCache,
  getCursorCacheStatus,
  syncCursorCache,
  isCursorInstalled,
  openCursorExportPage,
  readCursorMessagesFromCache,
  type CursorSyncResult,
} from "./cursor.js";
import {
  initNativeModule,
  parseLocalSourcesAsync,
  finalizeGraphAsync,
  type ParsedMessages,
} from "./native.js";
import { createSpinner } from "./spinner.js";
import type { SourceType } from "./graph-types.js";

// =============================================================================
// Helpers
// =============================================================================

function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

function formatDateTime(date?: Date): string | undefined {
  if (!date) return undefined;
  return date.toLocaleString();
}

function getApiBaseUrl(): string {
  return process.env.VIBETRACKING_API_URL || "https://vibetracking.dev";
}


// =============================================================================
// Data Encoding for Browser Import
// =============================================================================

function encodeDataForBrowser(data: unknown): string {
  const jsonString = JSON.stringify(data);
  const compressed = pako.gzip(jsonString);
  // Convert to base64url
  const base64 = Buffer.from(compressed).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// =============================================================================
// Main Functions
// =============================================================================

async function main() {
  const program = new Command();

  program
    .name("vibetracking")
    .description("Vibetracking - Track AI coding costs across Claude Code, Codex, Cursor, and more")
    .version(pkg.version)
    .option("-i, --inviter <username>", "Accept a challenge from a user (e.g., @username)")
    .action(async (options) => {
      await openBrowserWithData(options.inviter);
    });

  program
    .command("sync")
    .description("Sync data (same as running vibetracking)")
    .option("-i, --inviter <username>", "Accept a challenge from a user (e.g., @username)")
    .action(async (options) => {
      await openBrowserWithData(options.inviter);
    });

  program
    .command("login")
    .description("Login via browser import flow")
    .action(async () => {
      console.log(pc.gray("\n  Login happens during the import flow in your browser.\n"));
      await openBrowserWithData();
    });

  program
    .command("whoami")
    .description("Show CLI auth status")
    .action(() => {
      console.log(pc.gray("\n  No CLI auth session. Login happens in the browser during import.\n"));
    });

  program
    .command("logout")
    .description("Clear local CLI state")
    .action(() => {
      const { cleared, path } = clearCursorCache();
      if (cleared) {
        console.log(pc.green(`\n  Cleared Cursor cache: ${path}\n`));
      } else {
        console.log(pc.gray(`\n  No Cursor cache found at: ${path}\n`));
      }
      console.log(pc.gray("  No CLI auth session to clear.\n"));
    });

  const cursor = program
    .command("cursor")
    .description("Cursor integration helpers");

  cursor
    .command("login")
    .description("Open Cursor export page in your browser")
    .action(async () => {
      console.log(pc.cyan("\n  Opening Cursor export page..."));
      console.log(pc.gray("  If prompted, log in to Cursor in your browser.\n"));
      await openCursorExportPage();
    });

  cursor
    .command("status")
    .description("Show Cursor cache status")
    .action(() => {
      const installed = isCursorInstalled();
      const status = getCursorCacheStatus();
      const lastModified = formatDateTime(status.lastModified);

      console.log(pc.magenta("\n  Cursor status"));
      console.log(pc.gray(`  Installed: ${installed ? "yes" : "no"}`));
      console.log(pc.gray(`  Cache: ${status.exists ? "present" : "missing"}`));
      if (status.exists && lastModified) {
        console.log(pc.gray(`  Last updated: ${lastModified}`));
      }
      console.log(pc.gray(`  Path: ${status.path}\n`));
    });

  cursor
    .command("logout")
    .description("Clear cached Cursor data")
    .action(() => {
      const { cleared, path } = clearCursorCache();
      if (cleared) {
        console.log(pc.green(`\n  Cleared Cursor cache: ${path}\n`));
      } else {
        console.log(pc.gray(`\n  No Cursor cache found at: ${path}\n`));
      }
    });

  await program.parseAsync();
}

async function openBrowserWithData(inviterUsername?: string) {
  const cursorInstalled = isCursorInstalled();

  // Clean inviter username (strip @ prefix if present)
  const inviter = inviterUsername?.replace(/^@/, "");

  console.log(pc.magenta("\n  ✨ Vibetracking\n"));

  if (inviter) {
    console.log(pc.magenta(`  Accepting challenge from @${inviter}\n`));
  }

  // Initialize native module (downloads binary on first run)
  try {
    await initNativeModule();
  } catch (e) {
    console.error(pc.red(`\n  Failed to initialize: ${(e as Error).message}\n`));
    process.exit(1);
  }

  // Sync Cursor data first (requires user interaction - opens browser)
  let cursorSync: CursorSyncResult = { synced: false, rows: 0 };
  if (cursorInstalled) {
    cursorSync = await syncCursorCache();
  }
  let cachedCursorRows = 0;
  if (!cursorSync.synced) {
    cachedCursorRows = readCursorMessagesFromCache().length;
    if (cachedCursorRows > 0) {
      const cachedStatus = getCursorCacheStatus();
      const lastModified = formatDateTime(cachedStatus.lastModified);
      console.log(pc.gray(`  Using cached Cursor data${lastModified ? ` (last updated ${lastModified})` : ""}.`));
    }
  }

  const spinner = createSpinner({ color: "magenta" });
  spinner.start(pc.gray("Scanning your AI coding adventures..."));

  const localSources: SourceType[] = ['opencode', 'claude', 'codex', 'gemini', 'amp', 'droid'];
  const localMessages = await parseLocalSourcesAsync({ sources: localSources });

  // Check if we have any data - either from local sources or Cursor
  const hasLocalData = localMessages && localMessages.messages.length > 0;
  const hasCursorData = (cursorSync.synced && cursorSync.rows > 0) || cachedCursorRows > 0;

  if (!hasLocalData && !hasCursorData) {
    spinner.error("No AI coding adventures found yet!");
    console.log(pc.gray("\n  Supported tools:"));
    console.log(pc.gray("  - Claude Code (~/.claude/projects/)"));
    console.log(pc.gray("  - Codex (~/.codex/)"));
    console.log(pc.gray("  - Cursor (download from cursor.com)"));
    console.log(pc.gray("  - Gemini (~/.gemini/)"));
    console.log(pc.gray("  - Amp (~/.ampcode/)"));
    if (cursorSync.error) {
      console.log(pc.gray(`\n  Cursor error: ${cursorSync.error}`));
    }
    console.log();
    process.exit(1);
  }

  spinner.update(pc.gray("Crunching the numbers..."));

  // Get graph data for encoding
  // Use empty ParsedMessages if no local data (Cursor-only scenario)
  const emptyParsedMessages: ParsedMessages = {
    messages: [],
    opencodeCount: 0,
    claudeCount: 0,
    codexCount: 0,
    geminiCount: 0,
    ampCount: 0,
    droidCount: 0,
    processingTimeMs: 0,
  };
  const messagesForGraph = localMessages ?? emptyParsedMessages;
  const graphData = await finalizeGraphAsync({
    localMessages: messagesForGraph,
    includeCursor: cursorSync.synced || cachedCursorRows > 0,
  });

  spinner.stop();

  // Show summary
  const totalTokens = graphData.summary.totalTokens;
  const totalCost = graphData.summary.totalCost;
  const sources = graphData.summary.sources;

  console.log(pc.yellow(`  🎉 Found ${formatNumber(totalTokens)} tokens from ${sources.length} tool${sources.length > 1 ? "s" : ""}`));
  console.log(pc.gray(`     You've mass-vibed ${pc.green(formatCurrency(totalCost))} on AI coding!`));
  console.log(pc.gray(`     Tools: ${sources.join(" · ")}`));
  console.log();

  // Encode data and open browser
  const encoded = encodeDataForBrowser(graphData);
  const baseUrl = getApiBaseUrl();

  // Build URL with optional inviter query param
  let url = `${baseUrl}/import`;
  if (inviter) {
    url += `?inviter=${encodeURIComponent(inviter)}`;
  }
  url += `#${encoded}`;

  console.log(pc.cyan(`  🚀 Let's see your stats!`));
  console.log(pc.gray(`     vibetracking.dev/import#...\n`));

  await open(url);
}

main().catch(console.error);
