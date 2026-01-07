#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
import open from "open";
import * as readline from "readline";

import { parseClaudeCode } from "./parsers/claude.js";
import { parseCodex } from "./parsers/codex.js";
import {
  parseCursor,
  parseCursorCSV,
  isCursorInstalled,
  getCursorExportUrl,
  waitForCursorCSV,
} from "./parsers/cursor.js";
import { aggregateToolData, getAggregatedStats } from "./aggregator.js";
import { encodeData } from "./encoder.js";
import {
  getSyncToken,
  isAutosyncEnabled,
  setAutosyncEnabled,
  getHooksInstalledAt,
  setHooksInstalledAt,
  clearHooksInstalledAt,
} from "./config.js";
import {
  installAllHooks,
  removeAllHooks,
  getHookStatus,
} from "./hooks.js";
import type { ToolData, ImportData } from "./types.js";

const APP_URL = process.env.VIBETRACKING_URL || "https://vibetracking.dev";

/**
 * Result of scanning for tool data
 */
interface ScanResult {
  aggregated: ImportData;
  claudeFound: boolean;
  codexFound: boolean;
  cursorFound: boolean;
}

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Handle interactive Cursor CSV export
 */
async function handleCursorExport(): Promise<ToolData | null> {
  console.log("");
  console.log(chalk.hex("#B3D8F5")("  📊 Cursor detected - requires manual export"));
  console.log(chalk.gray("     Opening browser to download your usage data..."));

  // Open browser to export URL
  const exportUrl = getCursorExportUrl();
  await open(exportUrl);

  console.log(chalk.gray("     Waiting for download... (checking ~/Downloads)"));

  // Wait for CSV file to appear in Downloads
  const csvPath = await waitForCursorCSV(30000); // 30 second timeout

  if (csvPath) {
    console.log(chalk.green(`     ✓ Found: ${csvPath.split("/").pop()}`));

    const cursorData = await parseCursorCSV(csvPath);
    if (cursorData) {
      console.log(
        chalk.green(
          `     ✓ Parsed ${cursorData.stats.totalMessages} usage events`
        )
      );
      return cursorData;
    } else {
      console.log(chalk.yellow("     ⚠ Could not parse the CSV file"));
    }
  } else {
    console.log(chalk.yellow("     ⚠ Could not find CSV in ~/Downloads"));
  }

  // Ask user for path manually
  console.log("");
  const userPath = await prompt(
    chalk.hex("#B3D8F5")("  Enter the path to your downloaded CSV (or press Enter to skip): ")
  );

  if (userPath) {
    const cursorData = await parseCursorCSV(userPath);
    if (cursorData) {
      console.log(
        chalk.green(
          `     ✓ Parsed ${cursorData.stats.totalMessages} usage events`
        )
      );
      return cursorData;
    } else {
      console.log(chalk.yellow("     ⚠ Could not parse the CSV file"));
    }
  }

  return null;
}

/**
 * Scan for AI tool data and aggregate it
 */
async function scanAndAggregate(options?: {
  quiet?: boolean;
  skipCursor?: boolean;
  tool?: string;
}): Promise<ScanResult | null> {
  const quiet = options?.quiet ?? false;
  const skipCursor = options?.skipCursor ?? false;
  const toolFilter = options?.tool;

  // Parse data based on tool filter
  let claudeData: ToolData | null = null;
  let codexData: ToolData | null = null;
  let cursorData: ToolData | null = null;

  if (!toolFilter || toolFilter === "claude") {
    claudeData = await parseClaudeCode();
  }

  if (!toolFilter || toolFilter === "codex") {
    codexData = await parseCodex();
  }

  // Cursor handling (only in interactive mode, not quiet)
  if (!skipCursor && !quiet && (!toolFilter || toolFilter === "cursor")) {
    const cursorInstalled = isCursorInstalled();
    if (cursorInstalled) {
      cursorData = await handleCursorExport();
    }
  }

  // Check if we found any data
  const hasData = claudeData || codexData || cursorData;
  if (!hasData) {
    return null;
  }

  // Get sync token
  const syncToken = await getSyncToken();

  // Aggregate data
  const aggregated = aggregateToolData([claudeData, codexData, cursorData]);

  // Add sync token if exists
  if (syncToken) {
    aggregated.syncToken = syncToken;
  }

  return {
    aggregated,
    claudeFound: !!claudeData,
    codexFound: !!codexData,
    cursorFound: !!cursorData,
  };
}

/**
 * Sync data to the server
 * Returns true on success, false on failure
 */
async function syncToServer(
  aggregated: ImportData,
  options?: { quiet?: boolean }
): Promise<boolean> {
  const quiet = options?.quiet ?? false;

  // If we have a sync token, try to sync directly via API
  if (aggregated.syncToken) {
    try {
      const response = await fetch(`${APP_URL}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aggregated.syncToken}`,
        },
        body: JSON.stringify({ data: aggregated }),
      });

      if (response.ok) {
        return true;
      }

      // If sync token is invalid, fall through to browser flow
      if (response.status === 401) {
        if (!quiet) {
          console.log(chalk.yellow("  Sync token expired, opening browser..."));
        }
      }
    } catch {
      // Network error, fail silently in quiet mode
      if (quiet) {
        return false;
      }
    }
  }

  // Fall back to browser-based import (only in interactive mode)
  if (!quiet) {
    const encodedData = encodeData(aggregated);
    const importUrl = `${APP_URL}/import#${encodedData}`;
    await open(importUrl);
    return true;
  }

  return false;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}

// ============================================
// Main command (default action)
// ============================================
program
  .name("vibetracking")
  .description("Track your AI coding tool usage")
  .version("0.1.0")
  .action(async () => {
    console.log(
      chalk.bold(
        "\n  " +
          chalk.hex("#FEA6CC")("vibe") +
          chalk.hex("#AAE7C0")("tracking") +
          "\n"
      )
    );

    const spinner = ora("Scanning for AI coding tool data...").start();

    try {
      // Parse Claude Code and Codex in parallel
      const [claudeData, codexData] = await Promise.all([
        parseClaudeCode(),
        parseCodex(),
      ]);

      // Check if Cursor is installed
      const cursorInstalled = isCursorInstalled();

      spinner.stop();

      // Display what we found
      if (claudeData) {
        console.log(chalk.green("  ✓ Claude Code"));
      }
      if (codexData) {
        console.log(chalk.green("  ✓ Codex"));
      }
      if (cursorInstalled) {
        console.log(chalk.hex("#B3D8F5")("  ○ Cursor (requires export)"));
      }

      // Handle Cursor interactively if installed
      let cursorData: ToolData | null = null;
      if (cursorInstalled) {
        cursorData = await handleCursorExport();
      }

      // Check if we found any data
      const hasData = claudeData || codexData || cursorData;

      if (!hasData) {
        console.log(chalk.red("\n  ✗ No AI coding tool data found"));
        console.log(chalk.gray("\n  Looked for:"));
        console.log(chalk.gray("  - Claude Code (~/.claude/)"));
        console.log(chalk.gray("  - Codex (~/.codex/)"));
        console.log(
          chalk.gray("  - Cursor (~/Library/Application Support/Cursor/)")
        );
        console.log(
          chalk.gray("\n  Make sure you have used at least one of these tools.\n")
        );
        process.exit(1);
      }

      // Check for existing sync token
      const syncToken = await getSyncToken();

      // Aggregate data
      const aggregated = aggregateToolData([claudeData, codexData, cursorData]);

      // Add sync token if exists
      if (syncToken) {
        aggregated.syncToken = syncToken;
        console.log(chalk.gray("\n  Using existing sync token"));
      }

      // Get stats summary
      const stats = getAggregatedStats(aggregated);

      // Display summary
      console.log("");
      console.log(chalk.bold("  Stats:"));
      console.log(
        chalk.hex("#AAE7C0")(`    📊 ${formatNumber(stats.totalTokens)} tokens`)
      );
      console.log(
        chalk.hex("#FEA6CC")(`    📁 ${stats.totalSessions} sessions`)
      );
      console.log(
        chalk.hex("#F0F69B")(`    💬 ${stats.totalMessages} messages`)
      );

      // Encode data
      const encodedData = encodeData(aggregated);

      // Build URL
      const importUrl = `${APP_URL}/import#${encodedData}`;

      console.log("");
      const openSpinner = ora("Opening browser...").start();

      // Open browser
      await open(importUrl);

      openSpinner.succeed("Browser opened!");
      console.log(
        chalk.gray(
          `\n  If browser didn't open, visit:\n  ${chalk.underline(APP_URL + "/import")}\n`
        )
      );

      // Auto-enable hooks on first run
      const hooksInstalledAt = await getHooksInstalledAt();
      if (!hooksInstalledAt) {
        const result = await installAllHooks();

        if (result.claudeCode || result.codex) {
          await setHooksInstalledAt(new Date().toISOString());
          await setAutosyncEnabled(true);

          console.log(chalk.green("  ✓ Auto-sync enabled"));
          console.log(
            chalk.gray(
              "    Your stats will sync automatically when you exit Claude Code or Codex."
            )
          );
          console.log(chalk.gray("    To disable: vibetracking autosync off\n"));

          // Note about Claude Code hook approval
          if (result.claudeCode) {
            console.log(
              chalk.yellow(
                "  Note: Run /hooks in Claude Code to approve the sync hook.\n"
              )
            );
          }
        }
      }
    } catch (error) {
      spinner.fail("Error scanning data");
      console.error(chalk.red(`\n  ${error}\n`));
      process.exit(1);
    }
  });

// ============================================
// sync command
// ============================================
program
  .command("sync")
  .description("Sync your stats to vibetracking.dev")
  .option("--quiet", "Suppress all output (for hooks)")
  .option("--tool <tool>", "Only sync specific tool (claude, codex)")
  .action(async (options: { quiet?: boolean; tool?: string }) => {
    const quiet = options.quiet ?? false;

    try {
      // In quiet mode, check if autosync is enabled
      if (quiet) {
        const enabled = await isAutosyncEnabled();
        if (!enabled) {
          process.exit(0); // Silently exit if disabled
        }
      }

      const result = await scanAndAggregate({
        quiet,
        skipCursor: true, // Always skip Cursor in sync command (requires interaction)
        tool: options.tool,
      });

      if (!result) {
        if (!quiet) {
          console.log(chalk.red("No data found to sync"));
        }
        process.exit(quiet ? 0 : 1);
      }

      const success = await syncToServer(result.aggregated, { quiet });

      if (!quiet) {
        if (success) {
          console.log(chalk.green("✓ Synced successfully"));
        } else {
          console.log(chalk.red("✗ Sync failed"));
        }
      }

      process.exit(success ? 0 : 1);
    } catch (error) {
      if (!quiet) {
        console.error(chalk.red(`Error: ${error}`));
      }
      process.exit(quiet ? 0 : 1);
    }
  });

// ============================================
// autosync command
// ============================================
program
  .command("autosync <action>")
  .description("Manage automatic syncing (on, off, status)")
  .action(async (action: string) => {
    switch (action.toLowerCase()) {
      case "on": {
        const result = await installAllHooks();
        await setAutosyncEnabled(true);
        await setHooksInstalledAt(new Date().toISOString());

        console.log(chalk.green("\n  ✓ Auto-sync enabled\n"));

        if (result.claudeCode) {
          console.log(chalk.gray("    • Claude Code hook installed"));
        }
        if (result.codex) {
          console.log(chalk.gray("    • Codex hook installed"));
        }

        console.log(
          chalk.gray(
            "\n  Your stats will sync automatically when you exit Claude Code or Codex.\n"
          )
        );

        if (result.claudeCode) {
          console.log(
            chalk.yellow("  Note: Run /hooks in Claude Code to approve the sync hook.\n")
          );
        }
        break;
      }

      case "off": {
        await removeAllHooks();
        await setAutosyncEnabled(false);
        await clearHooksInstalledAt();

        console.log(chalk.yellow("\n  ✗ Auto-sync disabled\n"));
        console.log(chalk.gray("    Hooks have been removed."));
        console.log(chalk.gray("    To re-enable: vibetracking autosync on\n"));
        break;
      }

      case "status": {
        const enabled = await isAutosyncEnabled();
        const hookStatus = await getHookStatus();
        const installedAt = await getHooksInstalledAt();

        console.log(
          chalk.bold(
            "\n  " +
              chalk.hex("#FEA6CC")("vibe") +
              chalk.hex("#AAE7C0")("tracking") +
              " auto-sync status\n"
          )
        );

        if (enabled) {
          console.log(chalk.green("  Status: Enabled"));
        } else {
          console.log(chalk.yellow("  Status: Disabled"));
        }

        console.log("");
        console.log(chalk.bold("  Hooks:"));

        if (hookStatus.claudeCode) {
          console.log(chalk.green("    ✓ Claude Code (~/.claude/settings.json)"));
        } else {
          console.log(chalk.gray("    ○ Claude Code (not installed)"));
        }

        if (hookStatus.codex) {
          console.log(chalk.green("    ✓ Codex (~/.codex/config.toml)"));
        } else {
          console.log(chalk.gray("    ○ Codex (not installed)"));
        }

        if (installedAt) {
          console.log(
            chalk.gray(`\n  Installed: ${new Date(installedAt).toLocaleString()}`)
          );
        }

        console.log("");
        break;
      }

      default:
        console.log(chalk.red(`\n  Unknown action: ${action}`));
        console.log(chalk.gray("  Valid actions: on, off, status\n"));
        process.exit(1);
    }
  });

program.parse();
