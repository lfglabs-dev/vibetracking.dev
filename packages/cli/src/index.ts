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
import { getSyncToken } from "./config.js";
import type { ToolData } from "./types.js";

const APP_URL = process.env.VIBETRACKING_URL || "https://vibetracking.dev";

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
      // Check for existing sync token
      const syncToken = await getSyncToken();

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
    } catch (error) {
      spinner.fail("Error scanning data");
      console.error(chalk.red(`\n  ${error}\n`));
      process.exit(1);
    }
  });

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

program.parse();
