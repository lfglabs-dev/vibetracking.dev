#!/usr/bin/env bun
/**
 * Native Runner - Subprocess for non-blocking native Rust calls
 *
 * This script runs in a separate process to keep the main event loop free
 * for UI rendering (e.g., spinner animation).
 *
 * Communication: file (JSON input) -> stdout (JSON output)
 */

import { createRequire } from "module";
import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { homedir } from "os";
import path from "path";

// Binary configuration - must match native.ts
const BINARY_VERSION = "0.2.0";

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

// Load the native module from the downloaded binary
const binaryPath = getBinaryPath();
if (!existsSync(binaryPath)) {
  throw new Error(`Native binary not found at ${binaryPath}. Run 'vibetracking' first to download it.`);
}
const require = createRequire(import.meta.url);
const nativeCore = require(binaryPath);

interface NativeRunnerRequest {
  method: string;
  args: unknown[];
}

async function main() {
  const inputFile = process.argv[2];
  
  if (!inputFile) {
    process.stderr.write(JSON.stringify({ error: "No input file provided" }));
    process.exit(1);
  }
  
  const input = readFileSync(inputFile, "utf-8");
  
  let request: NativeRunnerRequest;
  try {
    request = JSON.parse(input) as NativeRunnerRequest;
  } catch (e) {
    throw new Error(`Malformed JSON input: ${(e as Error).message}`);
  }
  
  const { method, args } = request;
  
  if (!Array.isArray(args) || args.length === 0) {
    throw new Error(`Invalid args for method '${method}': expected at least 1 argument`);
  }
  
  let result: unknown;
  
  switch (method) {
    case "parseLocalSources":
      result = nativeCore.parseLocalSources(args[0] as Parameters<typeof nativeCore.parseLocalSources>[0]);
      break;
    case "finalizeReport":
      result = await nativeCore.finalizeReport(args[0] as Parameters<typeof nativeCore.finalizeReport>[0]);
      break;
    case "finalizeMonthlyReport":
      result = await nativeCore.finalizeMonthlyReport(args[0] as Parameters<typeof nativeCore.finalizeMonthlyReport>[0]);
      break;
    case "finalizeGraph":
      result = await nativeCore.finalizeGraph(args[0] as Parameters<typeof nativeCore.finalizeGraph>[0]);
      break;
    case "finalizeReportAndGraph":
      result = await nativeCore.finalizeReportAndGraph(args[0] as Parameters<typeof nativeCore.finalizeReportAndGraph>[0]);
      break;
    default:
      throw new Error(`Unknown method: ${method}`);
  }
  
  // Write result to stdout (no newline - pure JSON)
  process.stdout.write(JSON.stringify(result));
}

main().catch((e) => {
  const error = e as Error;
  process.stderr.write(JSON.stringify({ 
    error: error.message,
    stack: error.stack,
  }));
  process.exit(1);
});
