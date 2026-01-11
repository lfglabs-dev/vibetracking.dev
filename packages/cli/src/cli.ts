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
  loadCursorCredentials,
  saveCursorCredentials,
  clearCursorCredentials,
  validateCursorSession,
  readCursorUsage,
  getCursorCredentialsPath,
  syncCursorCache,
  isCursorLoggedIn,
  isCursorInstalled,
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

function getApiBaseUrl(): string {
  return process.env.VIBETRACKING_API_URL || "https://vibetracking.dev";
}

interface CursorSyncResult {
  attempted: boolean;
  synced: boolean;
  rows: number;
  error?: string;
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

  // Cursor IDE integration
  const cursorCommand = program
    .command("cursor")
    .description("Cursor IDE integration commands");

  cursorCommand
    .command("login")
    .description("Login to Cursor (paste your session token)")
    .action(async () => {
      await cursorLogin();
    });

  cursorCommand
    .command("logout")
    .description("Logout from Cursor")
    .action(async () => {
      await cursorLogout();
    });

  cursorCommand
    .command("status")
    .description("Check Cursor authentication status")
    .action(async () => {
      await cursorStatus();
    });

  await program.parseAsync();
}

/**
 * Prompt user to login to Cursor during first-run if Cursor is installed
 * Returns true if user successfully logged in, false otherwise
 */
async function promptForCursorLogin(): Promise<boolean> {
  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Ask y/n question
  const shouldLogin = await new Promise<boolean>((resolve) => {
    rl.question(pc.white("  Would you like to include your Cursor usage data? (y/n): "), (answer) => {
      resolve(answer.trim().toLowerCase() === "y");
    });
  });

  if (!shouldLogin) {
    rl.close();
    console.log();
    return false;
  }

  // Open browser to Cursor dashboard
  console.log(pc.gray("\n  Opening Cursor dashboard in your browser..."));
  await open("https://www.cursor.com/dashboard");

  // Show instructions - token is HttpOnly so must use Network tab
  const isMac = process.platform === "darwin";
  const devtoolsShortcut = isMac ? "Cmd+Option+I" : "F12";

  console.log(pc.white("\n  To get your token:"));
  console.log(pc.gray(`  1. Press ${pc.white(devtoolsShortcut)} to open DevTools`));
  console.log(pc.gray(`  2. Go to ${pc.white("Network")} tab, click any request to cursor.com`));
  console.log(pc.gray(`  3. In the ${pc.white("Cookies")} tab, find ${pc.white("WorkosCursorSessionToken")}`));
  console.log(pc.gray(`  4. Copy the value (starts with "eyJ...")`));
  console.log();

  // Prompt for token
  const token = await new Promise<string>((resolve) => {
    rl.question(pc.white("  Paste your session token: "), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!token) {
    console.log(pc.yellow("\n  Skipped. You can run 'vibetracking cursor login' later.\n"));
    return false;
  }

  // Validate and save
  console.log(pc.gray("\n  Validating token..."));
  const validation = await validateCursorSession(token);

  if (!validation.valid) {
    console.log(pc.red(`\n  Invalid token: ${validation.error}`));
    console.log(pc.gray("  Continuing without Cursor data. Run 'vibetracking cursor login' later.\n"));
    return false;
  }

  saveCursorCredentials({
    sessionToken: token,
    createdAt: new Date().toISOString(),
  });

  console.log(pc.green("\n  Success! Logged in to Cursor."));
  if (validation.membershipType) {
    console.log(pc.gray(`  Membership: ${validation.membershipType}`));
  }
  console.log();

  return true;
}

async function openBrowserWithData(inviterUsername?: string) {
  // Check if Cursor is installed but not logged in - prompt user to setup
  const cursorInstalled = isCursorInstalled();
  const cursorLoggedIn = isCursorLoggedIn();

  // Clean inviter username (strip @ prefix if present)
  const inviter = inviterUsername?.replace(/^@/, "");

  console.log(pc.cyan("\n  Vibetracking\n"));

  if (inviter) {
    console.log(pc.magenta(`  Accepting challenge from @${inviter}\n`));
  }

  if (cursorInstalled && !cursorLoggedIn) {
    console.log(pc.white("  We detected Cursor IDE installed."));
    await promptForCursorLogin();
  }

  // Initialize native module (downloads binary on first run)
  try {
    await initNativeModule();
  } catch (e) {
    console.error(pc.red(`\n  Failed to initialize: ${(e as Error).message}\n`));
    process.exit(1);
  }

  const spinner = createSpinner({ color: "cyan" });
  spinner.start(pc.gray("Scanning AI coding tool data..."));

  const allSources: SourceType[] = ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'];
  const localSources = allSources.filter(s => s !== 'cursor');
  const includeCursor = isCursorLoggedIn();

  const { cursorSync, localMessages } = await loadDataSourcesParallel(localSources);

  // Check if we have any data - either from local sources or Cursor
  const hasLocalData = localMessages && localMessages.messages.length > 0;
  const hasCursorData = includeCursor && cursorSync.synced && cursorSync.rows > 0;

  if (!hasLocalData && !hasCursorData) {
    spinner.error("No AI coding tool data found on this machine.");
    console.log(pc.gray("\n  Supported tools:"));
    console.log(pc.gray("  - Claude Code (~/.claude/projects/)"));
    console.log(pc.gray("  - Codex (~/.codex/)"));
    console.log(pc.gray("  - Cursor (use 'vibetracking cursor login' first)"));
    if (cursorSync.error) {
      console.log(pc.gray(`\n  Cursor sync error: ${cursorSync.error}`));
    }
    console.log();
    process.exit(1);
  }

  spinner.update(pc.gray("Building data export..."));

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
    includeCursor: includeCursor && cursorSync.synced,
  });

  spinner.stop();

  // Show summary
  const totalTokens = graphData.summary.totalTokens;
  const totalCost = graphData.summary.totalCost;
  const sources = graphData.summary.sources;

  console.log(pc.white(`  Found ${formatNumber(totalTokens)} tokens from ${sources.length} tool${sources.length > 1 ? "s" : ""}`));
  console.log(pc.gray(`  Estimated cost: ${pc.green(formatCurrency(totalCost))}`));
  console.log(pc.gray(`  Sources: ${sources.join(", ")}`));
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

  console.log(pc.white("  Opening browser to import your data..."));
  console.log(pc.gray(`  ${url.slice(0, 60)}...\n`));

  await open(url);
}

// =============================================================================
// Data Loading
// =============================================================================

async function syncCursorData(): Promise<CursorSyncResult> {
  const credentials = loadCursorCredentials();
  if (!credentials) {
    return { attempted: false, synced: false, rows: 0 };
  }

  const result = await syncCursorCache();
  return {
    attempted: true,
    synced: result.synced,
    rows: result.rows,
    error: result.error,
  };
}

interface LoadedDataSources {
  cursorSync: CursorSyncResult;
  localMessages: ParsedMessages | null;
}

async function loadDataSourcesParallel(
  localSources: SourceType[]
): Promise<LoadedDataSources> {
  const shouldParseLocal = localSources.length > 0;

  const [cursorResult, localResult] = await Promise.allSettled([
    syncCursorData(),
    shouldParseLocal
      ? parseLocalSourcesAsync({
          sources: localSources.filter(s => s !== 'cursor'),
        })
      : Promise.resolve(null),
  ]);

  const cursorSync: CursorSyncResult = cursorResult.status === 'fulfilled'
    ? cursorResult.value
    : { attempted: true, synced: false, rows: 0, error: 'Cursor sync failed' };

  const localMessages: ParsedMessages | null = localResult.status === 'fulfilled'
    ? localResult.value
    : null;

  return { cursorSync, localMessages };
}

// =============================================================================
// Cursor IDE Authentication
// =============================================================================

async function cursorLogin(): Promise<void> {
  const credentials = loadCursorCredentials();
  if (credentials) {
    console.log(pc.yellow("\n  Already logged in to Cursor."));
    console.log(pc.gray("  Run 'vibetracking cursor logout' to sign out first.\n"));
    return;
  }

  console.log(pc.cyan("\n  Cursor IDE - Login\n"));

  // Open browser to Cursor dashboard
  console.log(pc.gray("  Opening Cursor dashboard in your browser..."));
  await open("https://www.cursor.com/dashboard");

  // Show instructions - token is HttpOnly so must use Network tab
  const isMac = process.platform === "darwin";
  const devtoolsShortcut = isMac ? "Cmd+Option+I" : "F12";

  console.log(pc.white("\n  To get your token:"));
  console.log(pc.gray(`  1. Press ${pc.white(devtoolsShortcut)} to open DevTools`));
  console.log(pc.gray(`  2. Go to ${pc.white("Network")} tab, click any request to cursor.com`));
  console.log(pc.gray(`  3. In the ${pc.white("Cookies")} tab, find ${pc.white("WorkosCursorSessionToken")}`));
  console.log(pc.gray(`  4. Copy the value (starts with "eyJ...")`));
  console.log();

  const readline = await import("node:readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const token = await new Promise<string>((resolve) => {
    rl.question(pc.white("  Paste your session token: "), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

  if (!token) {
    console.log(pc.red("\n  No token provided. Login cancelled.\n"));
    return;
  }

  console.log(pc.gray("\n  Validating token..."));
  const validation = await validateCursorSession(token);

  if (!validation.valid) {
    console.log(pc.red(`\n  Invalid token: ${validation.error}`));
    console.log(pc.gray("  Please try again with a valid session token.\n"));
    return;
  }

  saveCursorCredentials({
    sessionToken: token,
    createdAt: new Date().toISOString(),
  });

  console.log(pc.green("\n  Success! Logged in to Cursor."));
  if (validation.membershipType) {
    console.log(pc.gray(`  Membership: ${validation.membershipType}`));
  }
  console.log(pc.gray("  Your usage data will now be included in reports.\n"));
}

async function cursorLogout(): Promise<void> {
  const credentials = loadCursorCredentials();

  if (!credentials) {
    console.log(pc.yellow("\n  Not logged in to Cursor.\n"));
    return;
  }

  const cleared = clearCursorCredentials();

  if (cleared) {
    console.log(pc.green("\n  Logged out from Cursor.\n"));
  } else {
    console.error(pc.red("\n  Failed to clear Cursor credentials.\n"));
    process.exit(1);
  }
}

async function cursorStatus(): Promise<void> {
  const credentials = loadCursorCredentials();

  if (!credentials) {
    console.log(pc.yellow("\n  Not logged in to Cursor."));
    console.log(pc.gray("  Run 'vibetracking cursor login' to authenticate.\n"));
    return;
  }

  console.log(pc.cyan("\n  Cursor IDE - Status\n"));
  console.log(pc.gray("  Checking session validity..."));

  const validation = await validateCursorSession(credentials.sessionToken);

  if (validation.valid) {
    console.log(pc.green("  Session is valid"));
    if (validation.membershipType) {
      console.log(pc.white(`  Membership: ${validation.membershipType}`));
    }
    console.log(pc.gray(`  Logged in: ${new Date(credentials.createdAt).toLocaleDateString()}`));

    try {
      const usage = await readCursorUsage();
      const totalCost = usage.byModel.reduce((sum, m) => sum + m.cost, 0);
      console.log(pc.gray(`  Models used: ${usage.byModel.length}`));
      console.log(pc.gray(`  Total usage events: ${usage.rows.length}`));
      console.log(pc.gray(`  Total cost: $${totalCost.toFixed(2)}`));
    } catch {
      // Ignore fetch errors for status check
    }
  } else {
    console.log(pc.red(`  Session invalid: ${validation.error}`));
    console.log(pc.gray("  Run 'vibetracking cursor login' to re-authenticate."));
  }

  console.log(pc.gray(`\n  Credentials: ${getCursorCredentialsPath()}\n`));
}

main().catch(console.error);
