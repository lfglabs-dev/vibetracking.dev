#!/usr/bin/env bun
/**
 * Vibetracking CLI
 * Track AI coding assistant usage across Claude Code, Codex, Cursor, and more.
 * Browser-first experience - data is viewed and shared on vibetracking.dev
 */

import { Command, Option } from "commander";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };
import pc from "picocolors";
import open from "open";
import pako from "pako";
import { generateWrapped } from "./wrapped.js";
import { getApiBaseUrl, loadCredentials, saveCredentials } from "./credentials.js";

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
  createUsageTable,
  formatUsageRow,
  formatTotalsRow,
  formatNumber,
  formatCurrency,
  formatModelName,
} from "./table.js";
import {
  isNativeAvailable,
  getNativeVersion,
  parseLocalSourcesAsync,
  finalizeReportAsync,
  finalizeMonthlyReportAsync,
  finalizeGraphAsync,
  type ModelReport,
  type MonthlyReport,
  type ParsedMessages,
} from "./native.js";
import { createSpinner } from "./spinner.js";
import * as fs from "node:fs";
import { performance } from "node:perf_hooks";
import type { SourceType } from "./graph-types.js";

interface FilterOptions {
  opencode?: boolean;
  claude?: boolean;
  codex?: boolean;
  gemini?: boolean;
  cursor?: boolean;
  amp?: boolean;
  droid?: boolean;
}

interface DateFilterOptions {
  since?: string;
  until?: string;
  year?: string;
  today?: boolean;
  week?: boolean;
  month?: boolean;
}

interface CursorSyncResult {
  attempted: boolean;
  synced: boolean;
  rows: number;
  error?: string;
}

// =============================================================================
// Date Helpers
// =============================================================================

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getDateFilters(options: DateFilterOptions): { since?: string; until?: string; year?: string } {
  const today = new Date();

  if (options.today) {
    const todayStr = formatDate(today);
    return { since: todayStr, until: todayStr };
  }

  if (options.week) {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    return { since: formatDate(weekAgo), until: formatDate(today) };
  }

  if (options.month) {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { since: formatDate(startOfMonth), until: formatDate(today) };
  }

  return {
    since: options.since,
    until: options.until,
    year: options.year,
  };
}

function getDateRangeLabel(options: DateFilterOptions): string | null {
  if (options.today) return "Today";
  if (options.week) return "Last 7 days";
  if (options.month) {
    const today = new Date();
    return today.toLocaleString("en-US", { month: "long", year: "numeric" } as Intl.DateTimeFormatOptions);
  }
  if (options.year) return options.year;
  if (options.since || options.until) {
    const parts: string[] = [];
    if (options.since) parts.push(`from ${options.since}`);
    if (options.until) parts.push(`to ${options.until}`);
    return parts.join(" ");
  }
  return null;
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

  // Default command: scan data and open browser
  program
    .command("default", { isDefault: true, hidden: true })
    .option("--json", "Output as JSON instead of opening browser")
    .option("--opencode", "Include only OpenCode data")
    .option("--claude", "Include only Claude Code data")
    .option("--codex", "Include only Codex CLI data")
    .option("--gemini", "Include only Gemini CLI data")
    .option("--cursor", "Include only Cursor IDE data")
    .option("--amp", "Include only Amp usage")
    .option("--droid", "Include only Factory Droid usage")
    .option("--no-spinner", "Disable spinner")
    .action(async (options) => {
      if (options.json) {
        await outputJsonReport("models", options);
      } else {
        await openBrowserWithData(options);
      }
    });

  program
    .command("models")
    .description("Show usage breakdown by model")
    .option("--json", "Output as JSON")
    .option("--opencode", "Show only OpenCode usage")
    .option("--claude", "Show only Claude Code usage")
    .option("--codex", "Show only Codex CLI usage")
    .option("--gemini", "Show only Gemini CLI usage")
    .option("--cursor", "Show only Cursor IDE usage")
    .option("--amp", "Show only Amp usage")
    .option("--droid", "Show only Factory Droid usage")
    .option("--today", "Show only today's usage")
    .option("--week", "Show last 7 days")
    .option("--month", "Show current month")
    .option("--since <date>", "Start date (YYYY-MM-DD)")
    .option("--until <date>", "End date (YYYY-MM-DD)")
    .option("--year <year>", "Filter to specific year")
    .option("--benchmark", "Show processing time")
    .option("--no-spinner", "Disable spinner")
    .action(async (options) => {
      if (options.json) {
        await outputJsonReport("models", options);
      } else {
        await showModelReport(options, { spinner: options.spinner });
      }
    });

  program
    .command("monthly")
    .description("Show monthly usage report")
    .option("--json", "Output as JSON")
    .option("--opencode", "Show only OpenCode usage")
    .option("--claude", "Show only Claude Code usage")
    .option("--codex", "Show only Codex CLI usage")
    .option("--gemini", "Show only Gemini CLI usage")
    .option("--cursor", "Show only Cursor IDE usage")
    .option("--amp", "Show only Amp usage")
    .option("--droid", "Show only Factory Droid usage")
    .option("--today", "Show only today's usage")
    .option("--week", "Show last 7 days")
    .option("--month", "Show current month")
    .option("--since <date>", "Start date (YYYY-MM-DD)")
    .option("--until <date>", "End date (YYYY-MM-DD)")
    .option("--year <year>", "Filter to specific year")
    .option("--benchmark", "Show processing time")
    .option("--no-spinner", "Disable spinner")
    .action(async (options) => {
      if (options.json) {
        await outputJsonReport("monthly", options);
      } else {
        await showMonthlyReport(options, { spinner: options.spinner });
      }
    });

  program
    .command("graph")
    .description("Export contribution graph data as JSON")
    .option("--output <file>", "Write to file instead of stdout")
    .option("--opencode", "Include only OpenCode data")
    .option("--claude", "Include only Claude Code data")
    .option("--codex", "Include only Codex CLI data")
    .option("--gemini", "Include only Gemini CLI data")
    .option("--cursor", "Include only Cursor IDE data")
    .option("--amp", "Include only Amp data")
    .option("--droid", "Include only Factory Droid data")
    .option("--since <date>", "Start date (YYYY-MM-DD)")
    .option("--until <date>", "End date (YYYY-MM-DD)")
    .option("--year <year>", "Filter to specific year")
    .option("--benchmark", "Show processing time")
    .option("--no-spinner", "Disable spinner")
    .action(async (options) => {
      await handleGraphCommand(options);
    });

  program
    .command("wrapped")
    .description("Generate Wrapped shareable image")
    .option("--output <file>", "Output file path (default: vibetracking-<year>-wrapped.png)")
    .option("--year <year>", "Year to generate (default: current year)")
    .option("--opencode", "Include only OpenCode data")
    .option("--claude", "Include only Claude Code data")
    .option("--codex", "Include only Codex CLI data")
    .option("--gemini", "Include only Gemini CLI data")
    .option("--cursor", "Include only Cursor IDE data")
    .option("--amp", "Include only Amp data")
    .option("--droid", "Include only Factory Droid data")
    .option("--no-spinner", "Disable loading spinner")
    .option("--short", "Display total tokens in abbreviated format")
    .addOption(new Option("--agents", "Show Top OpenCode Agents (default)").conflicts("clients"))
    .addOption(new Option("--clients", "Show Top Clients instead of Top OpenCode Agents").conflicts("agents"))
    .option("--disable-pinned", "Disable pinning of Sisyphus agents in rankings")
    .action(async (options) => {
      await handleWrappedCommand(options);
    });

  program
    .command("sync")
    .description("Sync your usage data to vibetracking.dev (requires prior authentication)")
    .option("--quiet", "Minimal output for background syncing")
    .option("--opencode", "Include only OpenCode data")
    .option("--claude", "Include only Claude Code data")
    .option("--codex", "Include only Codex CLI data")
    .option("--gemini", "Include only Gemini CLI data")
    .option("--cursor", "Include only Cursor IDE data")
    .option("--amp", "Include only Amp data")
    .option("--droid", "Include only Factory Droid data")
    .action(async (options) => {
      await handleSyncCommand(options);
    });

  program
    .command("pricing <model-id>")
    .description("Look up pricing for a model")
    .option("--json", "Output as JSON")
    .option("--provider <source>", "Force pricing source: 'litellm' or 'openrouter'")
    .option("--no-spinner", "Disable spinner")
    .action(async (modelId: string, options: { json?: boolean; provider?: string; spinner?: boolean }) => {
      await handlePricingCommand(modelId, options);
    });

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
// Browser-First Default Command
// =============================================================================

async function openBrowserWithData(options: FilterOptions & { spinner?: boolean }) {
  const useSpinner = options.spinner !== false;
  const spinner = useSpinner ? createSpinner({ color: "cyan" }) : null;

  spinner?.start(pc.gray("Scanning AI coding tool data..."));

  const enabledSources = getEnabledSources(options);
  const localSources: SourceType[] = (enabledSources || ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'])
    .filter(s => s !== 'cursor');
  const includeCursor = !enabledSources || enabledSources.includes('cursor');

  const { cursorSync, localMessages } = await loadDataSourcesParallel(localSources, {});

  if (!localMessages) {
    spinner?.error("No AI coding tool data found on this machine.");
    console.log(pc.gray("\n  Supported tools:"));
    console.log(pc.gray("  - Claude Code (~/.claude/projects/)"));
    console.log(pc.gray("  - Codex (~/.codex/)"));
    console.log(pc.gray("  - Cursor (use 'vibetracking cursor login' first)"));
    console.log();
    process.exit(1);
  }

  spinner?.update(pc.gray("Building data export..."));

  // Get graph data for encoding
  const graphData = await finalizeGraphAsync({
    localMessages,
    includeCursor: includeCursor && cursorSync.synced,
  });

  spinner?.stop();

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
// Sync Command (for background syncing with saved token)
// =============================================================================

async function handleSyncCommand(options: FilterOptions & { quiet?: boolean }) {
  const credentials = loadCredentials();

  if (!credentials) {
    if (!options.quiet) {
      console.log(pc.yellow("\n  Not authenticated."));
      console.log(pc.gray("  Run 'vibetracking' first to authenticate via browser.\n"));
    }
    process.exit(1);
  }

  const enabledSources = getEnabledSources(options);
  const localSources: SourceType[] = (enabledSources || ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'])
    .filter(s => s !== 'cursor');
  const includeCursor = !enabledSources || enabledSources.includes('cursor');

  const { cursorSync, localMessages } = await loadDataSourcesParallel(localSources, {});

  if (!localMessages) {
    if (!options.quiet) {
      console.log(pc.yellow("\n  No data to sync.\n"));
    }
    process.exit(1);
  }

  const graphData = await finalizeGraphAsync({
    localMessages,
    includeCursor: includeCursor && cursorSync.synced,
  });

  // Send to API
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
    console.log(pc.green("\n  Sync complete!\n"));
  }
}

// =============================================================================
// Source Management
// =============================================================================

function getEnabledSources(options: FilterOptions): SourceType[] | undefined {
  const hasFilter = options.opencode || options.claude || options.codex || options.gemini || options.cursor || options.amp || options.droid;
  if (!hasFilter) return undefined;

  const sources: SourceType[] = [];
  if (options.opencode) sources.push("opencode");
  if (options.claude) sources.push("claude");
  if (options.codex) sources.push("codex");
  if (options.gemini) sources.push("gemini");
  if (options.cursor) sources.push("cursor");
  if (options.amp) sources.push("amp");
  if (options.droid) sources.push("droid");
  return sources;
}

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
  localSources: SourceType[],
  dateFilters: { since?: string; until?: string; year?: string }
): Promise<LoadedDataSources> {
  const shouldParseLocal = localSources.length > 0;

  const [cursorResult, localResult] = await Promise.allSettled([
    syncCursorData(),
    shouldParseLocal
      ? parseLocalSourcesAsync({
          sources: localSources.filter(s => s !== 'cursor'),
          since: dateFilters.since,
          until: dateFilters.until,
          year: dateFilters.year,
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
// Report Commands
// =============================================================================

async function showModelReport(options: FilterOptions & DateFilterOptions & { benchmark?: boolean }, extraOptions?: { spinner?: boolean }) {
  const dateFilters = getDateFilters(options);
  const enabledSources = getEnabledSources(options);
  const onlyCursor = enabledSources?.length === 1 && enabledSources[0] === 'cursor';
  const includeCursor = !enabledSources || enabledSources.includes('cursor');

  if (onlyCursor) {
    const credentials = loadCursorCredentials();
    if (!credentials) {
      console.log(pc.red("\n  Error: Cursor authentication required."));
      console.log(pc.gray("  Run 'vibetracking cursor login' to authenticate with Cursor.\n"));
      process.exit(1);
    }
  }

  const dateRange = getDateRangeLabel(options);
  const title = dateRange
    ? `Token Usage Report by Model (${dateRange})`
    : "Token Usage Report by Model";

  console.log(pc.cyan(`\n  ${title}`));
  if (options.benchmark) {
    console.log(pc.gray(`  Using: Rust native module v${getNativeVersion()}`));
  }
  console.log();

  const useSpinner = extraOptions?.spinner !== false;
  const spinner = useSpinner ? createSpinner({ color: "cyan" }) : null;

  const localSources: SourceType[] = (enabledSources || ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'])
    .filter(s => s !== 'cursor');

  spinner?.start(pc.gray("Scanning session data..."));

  const { cursorSync, localMessages } = await loadDataSourcesParallel(
    onlyCursor ? [] : localSources,
    dateFilters
  );

  if (!localMessages && !onlyCursor) {
    spinner?.error('Failed to parse local session files');
    process.exit(1);
  }

  spinner?.update(pc.gray("Finalizing report..."));
  const startTime = performance.now();

  let report: ModelReport;
  try {
    const emptyMessages: ParsedMessages = { messages: [], opencodeCount: 0, claudeCount: 0, codexCount: 0, geminiCount: 0, ampCount: 0, droidCount: 0, processingTimeMs: 0 };
    report = await finalizeReportAsync({
      localMessages: localMessages || emptyMessages,
      includeCursor: includeCursor && cursorSync.synced,
      since: dateFilters.since,
      until: dateFilters.until,
      year: dateFilters.year,
    });
  } catch (e) {
    spinner?.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }

  const processingTime = performance.now() - startTime;
  spinner?.stop();

  if (report.entries.length === 0) {
    if (onlyCursor && !cursorSync.synced) {
      console.log(pc.yellow("  No Cursor data available."));
      console.log(pc.gray("  Run 'vibetracking cursor login' to authenticate with Cursor.\n"));
    } else {
      console.log(pc.yellow("  No usage data found.\n"));
    }
    return;
  }

  const table = createUsageTable("Source/Model");
  const filteredEntries = report.entries.filter(e => e.input + e.output + e.cacheRead + e.cacheWrite > 0);

  for (const entry of filteredEntries) {
    const sourceLabel = getSourceLabel(entry.source);
    const modelDisplay = `${pc.dim(sourceLabel)} ${formatModelName(entry.model)}`;
    table.push(
      formatUsageRow(
        modelDisplay,
        [entry.model],
        entry.input,
        entry.output,
        entry.cacheWrite,
        entry.cacheRead,
        entry.cost
      )
    );
  }

  table.push(
    formatTotalsRow(
      report.totalInput,
      report.totalOutput,
      report.totalCacheWrite,
      report.totalCacheRead,
      report.totalCost
    )
  );

  console.log(table.toString());

  console.log(
    pc.gray(
      `\n  Total: ${formatNumber(report.totalMessages)} messages, ` +
        `${formatNumber(report.totalInput + report.totalOutput + report.totalCacheRead + report.totalCacheWrite)} tokens, ` +
        `${pc.green(formatCurrency(report.totalCost))}`
    )
  );

  if (options.benchmark) {
    console.log(pc.gray(`  Processing time: ${processingTime.toFixed(0)}ms (Rust) + ${report.processingTimeMs}ms (parsing)`));
  }

  console.log();
}

async function showMonthlyReport(options: FilterOptions & DateFilterOptions & { benchmark?: boolean }, extraOptions?: { spinner?: boolean }) {
  const dateRange = getDateRangeLabel(options);
  const title = dateRange
    ? `Monthly Token Usage Report (${dateRange})`
    : "Monthly Token Usage Report";

  console.log(pc.cyan(`\n  ${title}`));
  if (options.benchmark) {
    console.log(pc.gray(`  Using: Rust native module v${getNativeVersion()}`));
  }
  console.log();

  const useSpinner = extraOptions?.spinner !== false;
  const spinner = useSpinner ? createSpinner({ color: "cyan" }) : null;

  const dateFilters = getDateFilters(options);
  const enabledSources = getEnabledSources(options);
  const localSources: SourceType[] = (enabledSources || ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'])
    .filter(s => s !== 'cursor');
  const includeCursor = !enabledSources || enabledSources.includes('cursor');

  spinner?.start(pc.gray("Scanning session data..."));

  const { cursorSync, localMessages } = await loadDataSourcesParallel(localSources, dateFilters);

  if (!localMessages) {
    spinner?.error('Failed to parse local session files');
    process.exit(1);
  }

  spinner?.update(pc.gray("Finalizing report..."));
  const startTime = performance.now();

  let report: MonthlyReport;
  try {
    report = await finalizeMonthlyReportAsync({
      localMessages,
      includeCursor: includeCursor && cursorSync.synced,
      since: dateFilters.since,
      until: dateFilters.until,
      year: dateFilters.year,
    });
  } catch (e) {
    spinner?.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }

  const processingTime = performance.now() - startTime;
  spinner?.stop();

  if (report.entries.length === 0) {
    console.log(pc.yellow("  No usage data found.\n"));
    return;
  }

  const table = createUsageTable("Month");
  const filteredEntries = report.entries.filter(e => e.input + e.output + e.cacheRead + e.cacheWrite > 0);

  for (const entry of filteredEntries) {
    table.push(
      formatUsageRow(
        entry.month,
        entry.models,
        entry.input,
        entry.output,
        entry.cacheWrite,
        entry.cacheRead,
        entry.cost
      )
    );
  }

  const totalInput = report.entries.reduce((sum, e) => sum + e.input, 0);
  const totalOutput = report.entries.reduce((sum, e) => sum + e.output, 0);
  const totalCacheRead = report.entries.reduce((sum, e) => sum + e.cacheRead, 0);
  const totalCacheWrite = report.entries.reduce((sum, e) => sum + e.cacheWrite, 0);

  table.push(
    formatTotalsRow(totalInput, totalOutput, totalCacheWrite, totalCacheRead, report.totalCost)
  );

  console.log(table.toString());
  console.log(pc.gray(`\n  Total Cost: ${pc.green(formatCurrency(report.totalCost))}`));

  if (options.benchmark) {
    console.log(pc.gray(`  Processing time: ${processingTime.toFixed(0)}ms (Rust) + ${report.processingTimeMs}ms (parsing)`));
  }

  console.log();
}

type JsonReportType = "models" | "monthly";

async function outputJsonReport(
  reportType: JsonReportType,
  options: FilterOptions & DateFilterOptions
) {
  const dateFilters = getDateFilters(options);
  const enabledSources = getEnabledSources(options);
  const onlyCursor = enabledSources?.length === 1 && enabledSources[0] === 'cursor';
  const includeCursor = !enabledSources || enabledSources.includes('cursor');
  const localSources: SourceType[] = (enabledSources || ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'])
    .filter(s => s !== 'cursor');

  const { cursorSync, localMessages } = await loadDataSourcesParallel(
    onlyCursor ? [] : localSources,
    dateFilters
  );

  if (!localMessages && !onlyCursor) {
    console.error(JSON.stringify({ error: "Failed to parse local session files" }));
    process.exit(1);
  }

  const emptyMessages: ParsedMessages = { messages: [], opencodeCount: 0, claudeCount: 0, codexCount: 0, geminiCount: 0, ampCount: 0, droidCount: 0, processingTimeMs: 0 };

  if (reportType === "models") {
    const report = await finalizeReportAsync({
      localMessages: localMessages || emptyMessages,
      includeCursor: includeCursor && cursorSync.synced,
      since: dateFilters.since,
      until: dateFilters.until,
      year: dateFilters.year,
    });
    console.log(JSON.stringify(report, null, 2));
  } else {
    const report = await finalizeMonthlyReportAsync({
      localMessages: localMessages || emptyMessages,
      includeCursor: includeCursor && cursorSync.synced,
      since: dateFilters.since,
      until: dateFilters.until,
      year: dateFilters.year,
    });
    console.log(JSON.stringify(report, null, 2));
  }
}

// =============================================================================
// Graph Command
// =============================================================================

interface GraphCommandOptions extends FilterOptions, DateFilterOptions {
  output?: string;
  benchmark?: boolean;
  spinner?: boolean;
}

async function handleGraphCommand(options: GraphCommandOptions) {
  const useSpinner = options.output && options.spinner !== false;
  const spinner = useSpinner ? createSpinner({ color: "cyan" }) : null;

  const dateFilters = getDateFilters(options);
  const enabledSources = getEnabledSources(options);
  const localSources: SourceType[] = (enabledSources || ['opencode', 'claude', 'codex', 'gemini', 'cursor', 'amp', 'droid'])
    .filter(s => s !== 'cursor');
  const includeCursor = !enabledSources || enabledSources.includes('cursor');

  spinner?.start(pc.gray("Scanning session data..."));

  const { cursorSync, localMessages } = await loadDataSourcesParallel(localSources, dateFilters);

  if (!localMessages) {
    spinner?.error('Failed to parse local session files');
    process.exit(1);
  }

  spinner?.update(pc.gray("Generating graph data..."));
  const startTime = performance.now();

  const data = await finalizeGraphAsync({
    localMessages,
    includeCursor: includeCursor && cursorSync.synced,
    since: dateFilters.since,
    until: dateFilters.until,
    year: dateFilters.year,
  });

  const processingTime = performance.now() - startTime;
  spinner?.stop();

  const jsonOutput = JSON.stringify(data, null, 2);

  if (options.output) {
    fs.writeFileSync(options.output, jsonOutput, "utf-8");
    console.error(pc.green(`Graph data written to ${options.output}`));
    console.error(
      pc.gray(
        `  ${data.contributions.length} days, ${data.summary.sources.length} sources, ${data.summary.models.length} models`
      )
    );
    console.error(pc.gray(`  Total: ${formatCurrency(data.summary.totalCost)}`));
    if (options.benchmark) {
      console.error(pc.gray(`  Processing time: ${processingTime.toFixed(0)}ms`));
    }
  } else {
    console.log(jsonOutput);
  }
}

// =============================================================================
// Wrapped Command
// =============================================================================

interface WrappedCommandOptions extends FilterOptions {
  output?: string;
  year?: string;
  spinner?: boolean;
  short?: boolean;
  agents?: boolean;
  clients?: boolean;
  disablePinned?: boolean;
}

async function handleWrappedCommand(options: WrappedCommandOptions) {
  const useSpinner = options.spinner !== false;
  const spinner = useSpinner ? createSpinner({ color: "cyan" }) : null;
  const currentYear = new Date().getFullYear().toString();
  const year = options.year || currentYear;
  spinner?.start(pc.gray(`Generating your ${year} Wrapped...`));

  try {
    const enabledSources = getEnabledSources(options);
    const outputPath = await generateWrapped({
      output: options.output,
      year,
      sources: enabledSources,
      short: options.short,
      includeAgents: !options.clients,
      pinSisyphus: !options.disablePinned,
    });

    spinner?.stop();
    console.log(pc.green(`\n  Your Vibetracking Wrapped image is ready!`));
    console.log(pc.white(`  ${outputPath}`));
    console.log();
    console.log(pc.gray("  Share it on Twitter/X with #vibetracking"));
    console.log();
  } catch (error) {
    spinner?.error(`Failed to generate wrapped: ${(error as Error).message}`);
    process.exit(1);
  }
}

// =============================================================================
// Pricing Command
// =============================================================================

async function handlePricingCommand(modelId: string, options: { json?: boolean; provider?: string; spinner?: boolean }) {
  const validProviders = ["litellm", "openrouter"];
  if (options.provider && !validProviders.includes(options.provider.toLowerCase())) {
    console.log(pc.red(`\n  Invalid provider: ${options.provider}`));
    console.log(pc.gray(`  Valid providers: ${validProviders.join(", ")}\n`));
    process.exit(1);
  }

  const useSpinner = options.spinner !== false;
  const spinner = useSpinner ? createSpinner({ color: "cyan" }) : null;
  const providerLabel = options.provider ? ` from ${options.provider}` : "";
  spinner?.start(pc.gray(`Fetching pricing data${providerLabel}...`));

  let core: typeof import("@vibetracking/core");
  try {
    const mod = await import("@vibetracking/core");
    core = (mod.default ?? mod) as typeof import("@vibetracking/core");
  } catch (importErr) {
    spinner?.stop();
    const errorMsg = (importErr as Error).message || "Unknown error";
    if (options.json) {
      console.log(JSON.stringify({ error: "Native module not available", details: errorMsg }, null, 2));
    } else {
      console.log(pc.red(`\n  Native module not available: ${errorMsg}`));
      console.log(pc.gray("  Run 'bun run build:core' to build the native module.\n"));
    }
    process.exit(1);
  }

  try {
    const provider = options.provider?.toLowerCase() || undefined;
    const nativeResult = await core.lookupPricing(modelId, provider);
    spinner?.stop();

    const result = {
      matchedKey: nativeResult.matchedKey,
      source: nativeResult.source as "litellm" | "openrouter",
      pricing: {
        input_cost_per_token: nativeResult.pricing.inputCostPerToken,
        output_cost_per_token: nativeResult.pricing.outputCostPerToken,
        cache_read_input_token_cost: nativeResult.pricing.cacheReadInputTokenCost,
        cache_creation_input_token_cost: nativeResult.pricing.cacheCreationInputTokenCost,
      },
    };

    if (options.json) {
      console.log(JSON.stringify({
        modelId,
        matchedKey: result.matchedKey,
        source: result.source,
        pricing: {
          inputCostPerToken: result.pricing.input_cost_per_token ?? 0,
          outputCostPerToken: result.pricing.output_cost_per_token ?? 0,
          cacheReadInputTokenCost: result.pricing.cache_read_input_token_cost,
          cacheCreationInputTokenCost: result.pricing.cache_creation_input_token_cost,
        },
      }, null, 2));
    } else {
      const sourceLabel = result.source.toLowerCase() === "litellm" ? pc.blue("LiteLLM") : pc.magenta("OpenRouter");
      const inputCost = result.pricing.input_cost_per_token ?? 0;
      const outputCost = result.pricing.output_cost_per_token ?? 0;
      const cacheReadCost = result.pricing.cache_read_input_token_cost;
      const cacheWriteCost = result.pricing.cache_creation_input_token_cost;

      console.log(pc.cyan(`\n  Pricing for: ${pc.white(modelId)}`));
      console.log(pc.gray(`  Matched key: ${result.matchedKey}`));
      console.log(pc.gray(`  Source: `) + sourceLabel);
      console.log();
      console.log(pc.white(`  Input:  `) + formatPricePerMillion(inputCost));
      console.log(pc.white(`  Output: `) + formatPricePerMillion(outputCost));
      if (cacheReadCost !== undefined) {
        console.log(pc.white(`  Cache Read:  `) + formatPricePerMillion(cacheReadCost));
      }
      if (cacheWriteCost !== undefined) {
        console.log(pc.white(`  Cache Write: `) + formatPricePerMillion(cacheWriteCost));
      }
      console.log();
    }
  } catch (err) {
    spinner?.stop();
    const errorMsg = (err as Error).message || "Unknown error";
    const isModelNotFound = errorMsg.toLowerCase().includes("not found") ||
                            errorMsg.toLowerCase().includes("no pricing");

    if (options.json) {
      if (isModelNotFound) {
        console.log(JSON.stringify({ error: "Model not found", modelId }, null, 2));
      } else {
        console.log(JSON.stringify({ error: errorMsg, modelId }, null, 2));
      }
    } else {
      if (isModelNotFound) {
        console.log(pc.red(`\n  Model not found: ${modelId}\n`));
      } else {
        console.log(pc.red(`\n  Error looking up pricing: ${errorMsg}\n`));
      }
    }
    process.exit(1);
  }
}

function formatPricePerMillion(costPerToken: number): string {
  const perMillion = costPerToken * 1_000_000;
  return pc.green(`$${perMillion.toFixed(2)}`) + pc.gray(" / 1M tokens");
}

function getSourceLabel(source: string): string {
  switch (source) {
    case "opencode": return "OpenCode";
    case "claude": return "Claude";
    case "codex": return "Codex";
    case "gemini": return "Gemini";
    case "cursor": return "Cursor";
    case "amp": return "Amp";
    case "droid": return "Droid";
    default: return source;
  }
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
