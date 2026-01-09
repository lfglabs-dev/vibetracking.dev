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
import { getApiBaseUrl, loadCredentials } from "./credentials.js";
import { login, logout, whoami } from "./auth.js";

import {
  loadCursorCredentials,
  saveCursorCredentials,
  clearCursorCredentials,
  validateCursorSession,
  readCursorUsage,
  getCursorCredentialsPath,
  syncCursorCache,
} from "./cursor.js";
import {
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
    .version(pkg.version);

  // Default command: sync if authenticated, else open browser
  program
    .command("default", { isDefault: true, hidden: true })
    .action(async () => {
      const credentials = loadCredentials();
      if (credentials) {
        await syncAndPrintProfile(credentials);
      } else {
        await openBrowserWithData();
      }
    });

  // Authentication commands
  program.command("login").description("Login to vibetracking.dev").action(login);
  program.command("logout").description("Logout from vibetracking.dev").action(logout);
  program.command("whoami").description("Show current user").action(whoami);

  // Sync command for cron jobs
  program
    .command("sync")
    .description("Sync usage data to vibetracking.dev (for cron jobs)")
    .option("--quiet", "No output on success")
    .action(async (options) => {
      await handleSyncCommand(options);
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

// =============================================================================
// Default Command: Sync if authenticated, else open browser
// =============================================================================

async function syncAndPrintProfile(credentials: { token: string; username: string }) {
  const spinner = createSpinner({ color: "cyan" });
  spinner.start(pc.gray("Syncing usage data..."));

  const allSources: SourceType[] = ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'];
  const localSources = allSources.filter(s => s !== 'cursor');

  const { cursorSync, localMessages } = await loadDataSourcesParallel(localSources);

  if (!localMessages) {
    spinner.error("No data found to sync.");
    process.exit(1);
  }

  const graphData = await finalizeGraphAsync({
    localMessages,
    includeCursor: cursorSync.synced,
  });

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/sync`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${credentials.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: graphData }),
  });

  if (!response.ok) {
    spinner.error(`Sync failed: ${response.statusText}`);
    process.exit(1);
  }

  spinner.stop();
  console.log(pc.green("\n  Synced successfully!"));
  console.log(pc.cyan(`  ${baseUrl}/@${credentials.username}\n`));
}

async function openBrowserWithData() {
  const spinner = createSpinner({ color: "cyan" });
  spinner.start(pc.gray("Scanning AI coding tool data..."));

  const allSources: SourceType[] = ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'];
  const localSources = allSources.filter(s => s !== 'cursor');

  const { cursorSync, localMessages } = await loadDataSourcesParallel(localSources);

  if (!localMessages) {
    spinner.error("No AI coding tool data found on this machine.");
    console.log(pc.gray("\n  Supported tools:"));
    console.log(pc.gray("  - Claude Code (~/.claude/projects/)"));
    console.log(pc.gray("  - Codex (~/.codex/)"));
    console.log(pc.gray("  - Cursor (use 'vibetracking cursor login' first)"));
    console.log();
    process.exit(1);
  }

  spinner.update(pc.gray("Building data export..."));

  const graphData = await finalizeGraphAsync({
    localMessages,
    includeCursor: cursorSync.synced,
  });

  spinner.stop();

  // Show summary
  const totalTokens = graphData.summary.totalTokens;
  const totalCost = graphData.summary.totalCost;
  const sources = graphData.summary.sources;

  console.log(pc.cyan("\n  Vibetracking\n"));
  console.log(pc.white(`  Found ${formatNumber(totalTokens)} tokens from ${sources.length} tool${sources.length > 1 ? "s" : ""}`));
  console.log(pc.gray(`  Estimated cost: ${pc.green(formatCurrency(totalCost))}`));
  console.log(pc.gray(`  Sources: ${sources.join(", ")}`));
  console.log();

  // Encode data and open browser
  const encoded = encodeDataForBrowser(graphData);
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/import#${encoded}`;

  console.log(pc.white("  Opening browser to import your data..."));
  console.log(pc.gray(`  ${url.slice(0, 60)}...\n`));

  await open(url);
}

// =============================================================================
// Sync Command (for cron jobs)
// =============================================================================

async function handleSyncCommand(options: { quiet?: boolean }) {
  const credentials = loadCredentials();

  if (!credentials) {
    if (!options.quiet) {
      console.log(pc.yellow("\n  Not authenticated."));
      console.log(pc.gray("  Run 'vibetracking' first to authenticate via browser.\n"));
    }
    process.exit(1);
  }

  const allSources: SourceType[] = ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'];
  const localSources = allSources.filter(s => s !== 'cursor');

  const { cursorSync, localMessages } = await loadDataSourcesParallel(localSources);

  if (!localMessages) {
    if (!options.quiet) {
      console.log(pc.yellow("\n  No data to sync.\n"));
    }
    process.exit(1);
  }

  const graphData = await finalizeGraphAsync({
    localMessages,
    includeCursor: cursorSync.synced,
  });

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/sync`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${credentials.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: graphData }),
  });

  if (!response.ok) {
    if (!options.quiet) {
      console.log(pc.red(`\n  Sync failed: ${response.statusText}\n`));
    }
    process.exit(1);
  }

  if (!options.quiet) {
    console.log(pc.green("\n  Synced successfully!"));
    console.log(pc.cyan(`  ${baseUrl}/@${credentials.username}\n`));
  }
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
  console.log(pc.white("  To get your session token:"));
  console.log(pc.gray("  1. Open https://www.cursor.com/settings in your browser"));
  console.log(pc.gray("  2. Open Developer Tools (F12) > Network tab"));
  console.log(pc.gray("  3. Find any request to cursor.com/api"));
  console.log(pc.gray("  4. Copy the 'WorkosCursorSessionToken' cookie value"));
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
