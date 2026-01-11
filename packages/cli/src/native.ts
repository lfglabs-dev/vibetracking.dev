/**
 * Native module loader for Rust core
 *
 * Downloads the native binary from GitHub releases on first run,
 * then loads it from ~/.vibetracking/bin/
 */

import type {
  TokenContributionData,
  GraphOptions as TSGraphOptions,
  SourceType,
} from "./graph-types.js";
import { createRequire } from "module";
import { existsSync, mkdirSync, writeFileSync, chmodSync } from "fs";
import { homedir } from "os";
import path from "path";

// =============================================================================
// Binary Download Configuration
// =============================================================================

const BINARY_VERSION = "0.2.0";
const GITHUB_REPO = "lfglabs-dev/vibetracking.dev";
const GITHUB_RELEASE_URL = `https://github.com/${GITHUB_REPO}/releases/download`;

function getPlatformBinaryName(): string {
  const platform = process.platform;
  const arch = process.arch;

  const platformMap: Record<string, string> = {
    "darwin-arm64": "darwin-arm64",
    "darwin-x64": "darwin-x64",
    "linux-x64": "linux-x64-gnu",
    "linux-arm64": "linux-arm64-gnu",
    "win32-x64": "win32-x64-msvc",
    "win32-arm64": "win32-arm64-msvc",
  };

  const key = `${platform}-${arch}`;
  const binaryName = platformMap[key];
  if (!binaryName) {
    throw new Error(`Unsupported platform: ${platform}-${arch}`);
  }

  return `vibetracking-core.${binaryName}.node`;
}

function getBinaryPath(): string {
  const binDir = path.join(homedir(), ".vibetracking", "bin", BINARY_VERSION);
  return path.join(binDir, getPlatformBinaryName());
}

async function downloadBinary(destPath: string): Promise<void> {
  const binaryName = getPlatformBinaryName();
  const url = `${GITHUB_RELEASE_URL}/cli-v${BINARY_VERSION}/${binaryName}`;

  console.log(`\n  Downloading native binary...`);
  console.log(`  ${url}\n`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download binary: ${response.status} ${response.statusText}\n` +
      `URL: ${url}\n` +
      `Please check if the release exists at https://github.com/${GITHUB_REPO}/releases/tag/cli-v${BINARY_VERSION}`
    );
  }

  const buffer = await response.arrayBuffer();
  mkdirSync(path.dirname(destPath), { recursive: true });
  writeFileSync(destPath, Buffer.from(buffer));

  // Make executable on Unix
  if (process.platform !== "win32") {
    chmodSync(destPath, 0o755);
  }

  console.log(`  Binary installed to ${destPath}\n`);
}

async function ensureBinaryExists(): Promise<string> {
  const binaryPath = getBinaryPath();

  if (!existsSync(binaryPath)) {
    await downloadBinary(binaryPath);
  }

  return binaryPath;
}

// =============================================================================
// Types matching Rust exports
// =============================================================================

interface NativeTokenBreakdown {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
}

interface NativeDailyTotals {
  tokens: number;
  cost: number;
  messages: number;
}

interface NativeSourceContribution {
  source: string;
  modelId: string;
  providerId: string;
  tokens: NativeTokenBreakdown;
  cost: number;
  messages: number;
}

interface NativeDailyContribution {
  date: string;
  totals: NativeDailyTotals;
  intensity: number;
  tokenBreakdown: NativeTokenBreakdown;
  sources: NativeSourceContribution[];
}

interface NativeYearSummary {
  year: string;
  totalTokens: number;
  totalCost: number;
  rangeStart: string;
  rangeEnd: string;
}

interface NativeDataSummary {
  totalTokens: number;
  totalCost: number;
  totalDays: number;
  activeDays: number;
  averagePerDay: number;
  maxCostInSingleDay: number;
  sources: string[];
  models: string[];
}

interface NativeGraphMeta {
  generatedAt: string;
  version: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  processingTimeMs: number;
}

interface NativeGraphResult {
  meta: NativeGraphMeta;
  summary: NativeDataSummary;
  years: NativeYearSummary[];
  contributions: NativeDailyContribution[];
}

interface NativeReportOptions {
  homeDir?: string;
  sources?: string[];
  since?: string;
  until?: string;
  year?: string;
}

interface NativeModelUsage {
  source: string;
  model: string;
  provider: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
  messageCount: number;
  cost: number;
}

interface NativeModelReport {
  entries: NativeModelUsage[];
  totalInput: number;
  totalOutput: number;
  totalCacheRead: number;
  totalCacheWrite: number;
  totalMessages: number;
  totalCost: number;
  processingTimeMs: number;
}

interface NativeMonthlyUsage {
  month: string;
  models: string[];
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  messageCount: number;
  cost: number;
}

interface NativeMonthlyReport {
  entries: NativeMonthlyUsage[];
  totalCost: number;
  processingTimeMs: number;
}

// Types for two-phase processing (parallel optimization)
interface NativeParsedMessage {
  source: string;
  modelId: string;
  providerId: string;
  timestamp: number;
  date: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
  sessionId: string;
  agent?: string;
}

interface NativeParsedMessages {
  messages: NativeParsedMessage[];
  opencodeCount: number;
  claudeCount: number;
  codexCount: number;
  geminiCount: number;
  ampCount: number;
  droidCount?: number;
  processingTimeMs: number;
}

interface NativeLocalParseOptions {
  homeDir?: string;
  sources?: string[];
  since?: string;
  until?: string;
  year?: string;
}

interface NativeFinalizeReportOptions {
  homeDir?: string;
  localMessages: NativeParsedMessages;
  includeCursor: boolean;
  since?: string;
  until?: string;
  year?: string;
}

interface NativeCore {
  version(): string;
  healthCheck(): string;
  parseLocalSources(options: NativeLocalParseOptions): NativeParsedMessages;
  finalizeReport(options: NativeFinalizeReportOptions): NativeModelReport;
  finalizeMonthlyReport(options: NativeFinalizeReportOptions): NativeMonthlyReport;
  finalizeGraph(options: NativeFinalizeReportOptions): NativeGraphResult;
}

// =============================================================================
// Module loading
// =============================================================================

let nativeCore: NativeCore | null = null;
let loadError: Error | null = null;
let binaryPath: string | null = null;

/**
 * Initialize the native module - downloads binary if needed
 * Must be called before using any native functions
 */
export async function initNativeModule(): Promise<void> {
  if (nativeCore) return; // Already initialized

  try {
    binaryPath = await ensureBinaryExists();
    const require = createRequire(import.meta.url);
    nativeCore = require(binaryPath) as NativeCore;
  } catch (e) {
    loadError = e as Error;
    throw new Error(
      `Failed to load native module: ${loadError.message}\n` +
      `Binary path: ${binaryPath || "unknown"}`
    );
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Check if native module is available
 */
export function isNativeAvailable(): boolean {
  return nativeCore !== null;
}

/**
 * Get native module version
 */
export function getNativeVersion(): string | null {
  return nativeCore?.version() ?? null;
}

/**
 * Convert native result to TypeScript format
 */
function fromNativeResult(result: NativeGraphResult): TokenContributionData {
  return {
    meta: {
      generatedAt: result.meta.generatedAt,
      version: result.meta.version,
      dateRange: {
        start: result.meta.dateRangeStart,
        end: result.meta.dateRangeEnd,
      },
    },
    summary: {
      totalTokens: result.summary.totalTokens,
      totalCost: result.summary.totalCost,
      totalDays: result.summary.totalDays,
      activeDays: result.summary.activeDays,
      averagePerDay: result.summary.averagePerDay,
      maxCostInSingleDay: result.summary.maxCostInSingleDay,
      sources: result.summary.sources as SourceType[],
      models: result.summary.models,
    },
    years: result.years.map((y) => ({
      year: y.year,
      totalTokens: y.totalTokens,
      totalCost: y.totalCost,
      range: {
        start: y.rangeStart,
        end: y.rangeEnd,
      },
    })),
    contributions: result.contributions.map((c) => ({
      date: c.date,
      totals: {
        tokens: c.totals.tokens,
        cost: c.totals.cost,
        messages: c.totals.messages,
      },
      intensity: c.intensity as 0 | 1 | 2 | 3 | 4,
      tokenBreakdown: {
        input: c.tokenBreakdown.input,
        output: c.tokenBreakdown.output,
        cacheRead: c.tokenBreakdown.cacheRead,
        cacheWrite: c.tokenBreakdown.cacheWrite,
        reasoning: c.tokenBreakdown.reasoning,
      },
      sources: c.sources.map((s) => ({
        source: s.source as SourceType,
        modelId: s.modelId,
        providerId: s.providerId,
        tokens: {
          input: s.tokens.input,
          output: s.tokens.output,
          cacheRead: s.tokens.cacheRead,
          cacheWrite: s.tokens.cacheWrite,
          reasoning: s.tokens.reasoning,
        },
        cost: s.cost,
        messages: s.messages,
      })),
    })),
  };
}

// =============================================================================
// Reports
// =============================================================================

export interface ModelUsage {
  source: string;
  model: string;
  provider: string;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
  messageCount: number;
  cost: number;
}

export interface ModelReport {
  entries: ModelUsage[];
  totalInput: number;
  totalOutput: number;
  totalCacheRead: number;
  totalCacheWrite: number;
  totalMessages: number;
  totalCost: number;
  processingTimeMs: number;
}

export interface MonthlyUsage {
  month: string;
  models: string[];
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  messageCount: number;
  cost: number;
}

export interface MonthlyReport {
  entries: MonthlyUsage[];
  totalCost: number;
  processingTimeMs: number;
}

// =============================================================================
// Two-Phase Processing (Parallel Optimization)
// =============================================================================

export interface ParsedMessages {
  messages: Array<{
    source: string;
    modelId: string;
    providerId: string;
    timestamp: number;
    date: string;
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    reasoning: number;
    sessionId: string;
    agent?: string;
  }>;
  opencodeCount: number;
  claudeCount: number;
  codexCount: number;
  geminiCount: number;
  ampCount: number;
  droidCount: number;
  processingTimeMs: number;
}

export interface LocalParseOptions {
  sources?: SourceType[];
  since?: string;
  until?: string;
  year?: string;
}

export interface FinalizeOptions {
  localMessages: ParsedMessages;
  includeCursor: boolean;
  since?: string;
  until?: string;
  year?: string;
}



// =============================================================================
// Async Subprocess Wrappers (Non-blocking for UI)
// =============================================================================

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_TIMEOUT_MS = 300_000;
const NATIVE_TIMEOUT_MS = parseInt(
  process.env.VIBETRACKING_NATIVE_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS),
  10
);

const SIGKILL_GRACE_MS = 500;
const DEFAULT_MAX_OUTPUT_BYTES = 100 * 1024 * 1024;
const MAX_OUTPUT_BYTES = parseInt(
  process.env.VIBETRACKING_MAX_OUTPUT_BYTES || String(DEFAULT_MAX_OUTPUT_BYTES),
  10
);

interface BunSubprocess {
  stdout: { text: () => Promise<string> };
  stderr: { text: () => Promise<string> };
  exited: Promise<number>;
  signalCode: string | null;
  killed: boolean;
  kill: (signal?: string) => void;
}

interface BunSpawnOptions {
  stdout: string;
  stderr: string;
}

interface BunGlobalType {
  spawn: (cmd: string[], opts: BunSpawnOptions) => BunSubprocess;
}

function safeKill(proc: unknown, signal?: string): void {
  try {
    (proc as { kill: (signal?: string) => void }).kill(signal);
  } catch {}
}

async function runInSubprocess<T>(method: string, args: unknown[]): Promise<T> {
  const runnerPath = join(__dirname, "native-runner.js");
  const input = JSON.stringify({ method, args });

  const tmpDir = join(tmpdir(), "vibetracking");
  mkdirSync(tmpDir, { recursive: true });
  const inputFile = join(tmpDir, `input-${randomUUID()}.json`);
  
  writeFileSync(inputFile, input, "utf-8");

  const BunGlobal = (globalThis as Record<string, unknown>).Bun as BunGlobalType;

  let proc: BunSubprocess;
  try {
    proc = BunGlobal.spawn([process.execPath, runnerPath, inputFile], {
      stdout: "pipe",
      stderr: "pipe",
    });
  } catch (e) {
    unlinkSync(inputFile);
    throw new Error(`Failed to spawn subprocess: ${(e as Error).message}`);
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let sigkillId: ReturnType<typeof setTimeout> | null = null;
  let weInitiatedKill = false;
  let aborted = false;

  const cleanup = async () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (sigkillId) clearTimeout(sigkillId);
    try { unlinkSync(inputFile); } catch {}
    if (aborted) {
      safeKill(proc, "SIGKILL");
      await proc.exited.catch(() => {});
    }
  };

  const abort = () => {
    aborted = true;
    weInitiatedKill = true;
  };

  try {
    const stdoutChunks: Uint8Array[] = [];
    const stderrChunks: Uint8Array[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;

    const readStream = async (
      stream: BunSubprocess["stdout"],
      chunks: Uint8Array[],
      getBytesRef: () => number,
      setBytesRef: (n: number) => void
    ): Promise<string> => {
      const reader = (stream as unknown as ReadableStream<Uint8Array>).getReader();
      try {
        while (!aborted) {
          const { done, value } = await reader.read();
          if (done) break;
          const newTotal = getBytesRef() + value.length;
          if (newTotal > MAX_OUTPUT_BYTES) {
            abort();
            throw new Error(`Output exceeded ${MAX_OUTPUT_BYTES} bytes`);
          }
          setBytesRef(newTotal);
          chunks.push(value);
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      const combined = new Uint8Array(getBytesRef());
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      return new TextDecoder().decode(combined);
    };

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        abort();
        safeKill(proc, "SIGTERM");
        sigkillId = setTimeout(() => {
          safeKill(proc, "SIGKILL");
          reject(new Error(
            `Subprocess '${method}' timed out after ${NATIVE_TIMEOUT_MS}ms (hard kill)`
          ));
        }, SIGKILL_GRACE_MS);
      }, NATIVE_TIMEOUT_MS);
    });

    const workPromise = Promise.all([
      readStream(proc.stdout, stdoutChunks, () => stdoutBytes, (n) => { stdoutBytes = n; }),
      readStream(proc.stderr, stderrChunks, () => stderrBytes, (n) => { stderrBytes = n; }),
      proc.exited,
    ]);

    const [stdout, stderr, exitCode] = await Promise.race([workPromise, timeoutPromise]);

    // Note: proc.killed is always true after exit in Bun (even for normal exits), so we only check signalCode
    if (weInitiatedKill || proc.signalCode) {
      throw new Error(
        `Subprocess '${method}' was killed (signal: ${proc.signalCode || "SIGTERM"})`
      );
    }

    if (exitCode !== 0) {
      let errorMsg = stderr || `Process exited with code ${exitCode}`;
      try {
        const parsed = JSON.parse(stderr);
        if (parsed.error) errorMsg = parsed.error;
      } catch {}
      throw new Error(`Subprocess '${method}' failed: ${errorMsg}`);
    }

    try {
      return JSON.parse(stdout) as T;
    } catch (e) {
      throw new Error(
        `Failed to parse subprocess output: ${(e as Error).message}\nstdout: ${stdout.slice(0, 500)}`
      );
    }
  } finally {
    await cleanup();
  }
}

export async function parseLocalSourcesAsync(options: LocalParseOptions): Promise<ParsedMessages> {
  if (!isNativeAvailable()) {
    throw new Error("Native module not initialized. Call initNativeModule() first.");
  }

  const nativeOptions: NativeLocalParseOptions = {
    homeDir: undefined,
    sources: options.sources,
    since: options.since,
    until: options.until,
    year: options.year,
  };

  return runInSubprocess<ParsedMessages>("parseLocalSources", [nativeOptions]);
}

export async function finalizeReportAsync(options: FinalizeOptions): Promise<ModelReport> {
  if (!isNativeAvailable()) {
    throw new Error("Native module not initialized. Call initNativeModule() first.");
  }

  const nativeOptions: NativeFinalizeReportOptions = {
    homeDir: undefined,
    localMessages: options.localMessages,
    includeCursor: options.includeCursor,
    since: options.since,
    until: options.until,
    year: options.year,
  };

  return runInSubprocess<ModelReport>("finalizeReport", [nativeOptions]);
}

export async function finalizeMonthlyReportAsync(options: FinalizeOptions): Promise<MonthlyReport> {
  if (!isNativeAvailable()) {
    throw new Error("Native module not initialized. Call initNativeModule() first.");
  }

  const nativeOptions: NativeFinalizeReportOptions = {
    homeDir: undefined,
    localMessages: options.localMessages,
    includeCursor: options.includeCursor,
    since: options.since,
    until: options.until,
    year: options.year,
  };

  return runInSubprocess<MonthlyReport>("finalizeMonthlyReport", [nativeOptions]);
}

export async function finalizeGraphAsync(options: FinalizeOptions): Promise<TokenContributionData> {
  if (!isNativeAvailable()) {
    throw new Error("Native module not initialized. Call initNativeModule() first.");
  }

  const nativeOptions: NativeFinalizeReportOptions = {
    homeDir: undefined,
    localMessages: options.localMessages,
    includeCursor: options.includeCursor,
    since: options.since,
    until: options.until,
    year: options.year,
  };

  const result = await runInSubprocess<NativeGraphResult>("finalizeGraph", [nativeOptions]);
  return fromNativeResult(result);
}

export interface ReportAndGraph {
  report: ModelReport;
  graph: TokenContributionData;
}

interface NativeReportAndGraph {
  report: NativeModelReport;
  graph: NativeGraphResult;
}

export async function finalizeReportAndGraphAsync(options: FinalizeOptions): Promise<ReportAndGraph> {
  if (!isNativeAvailable()) {
    throw new Error("Native module not initialized. Call initNativeModule() first.");
  }

  const nativeOptions: NativeFinalizeReportOptions = {
    homeDir: undefined,
    localMessages: options.localMessages,
    includeCursor: options.includeCursor,
    since: options.since,
    until: options.until,
    year: options.year,
  };

  const result = await runInSubprocess<NativeReportAndGraph>("finalizeReportAndGraph", [nativeOptions]);
  return {
    report: result.report,
    graph: fromNativeResult(result.graph),
  };
}
