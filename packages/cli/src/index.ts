#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import ora from "ora";
import open from "open";

import { parseClaudeCode } from "./parsers/claude.js";
import { parseCodex } from "./parsers/codex.js";
import { parseCursor } from "./parsers/cursor.js";
import { aggregateToolData, getAggregatedStats } from "./aggregator.js";
import { encodeData } from "./encoder.js";
import { getSyncToken } from "./config.js";

const APP_URL = process.env.VIBETRACKING_URL || "https://vibetracking.dev";

program
  .name("vibetracking")
  .description("Track your AI coding tool usage")
  .version("0.1.0")
  .action(async () => {
    console.log(
      chalk.bold("\n  " + chalk.hex("#FEA6CC")("vibe") + chalk.hex("#AAE7C0")("tracking") + "\n")
    );

    const spinner = ora("Scanning for AI coding tool data...").start();

    try {
      // Check for existing sync token
      const syncToken = await getSyncToken();

      // Parse all tools in parallel
      const [claudeData, codexData, cursorData] = await Promise.all([
        parseClaudeCode(),
        parseCodex(),
        parseCursor(),
      ]);

      // Check if we found any data
      const hasData = claudeData || codexData || cursorData;

      if (!hasData) {
        spinner.fail("No AI coding tool data found");
        console.log(chalk.gray("\n  Looked for:"));
        console.log(chalk.gray("  - Claude Code (~/.claude/)"));
        console.log(chalk.gray("  - Codex (~/.codex/)"));
        console.log(chalk.gray("  - Cursor (~/Library/Application Support/Cursor/)"));
        console.log(
          chalk.gray("\n  Make sure you have used at least one of these tools.\n")
        );
        process.exit(1);
      }

      spinner.succeed("Found AI coding tool data!");

      // Aggregate data
      const aggregated = aggregateToolData([claudeData, codexData, cursorData]);

      // Add sync token if exists
      if (syncToken) {
        aggregated.syncToken = syncToken;
        console.log(chalk.gray("  Using existing sync token"));
      }

      // Get stats summary
      const stats = getAggregatedStats(aggregated);

      // Display summary
      console.log("");
      console.log(chalk.bold("  Tools found:"));
      for (const tool of stats.toolsFound) {
        const icon =
          tool === "claude_code"
            ? "🤖"
            : tool === "codex"
            ? "💻"
            : "📝";
        console.log(chalk.hex("#B3D8F5")(`    ${icon} ${tool.replace("_", " ")}`));
      }

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
      spinner.start("Opening browser...");

      // Open browser
      await open(importUrl);

      spinner.succeed("Browser opened!");
      console.log(
        chalk.gray(`\n  If browser didn't open, visit:\n  ${chalk.underline(APP_URL + "/import")}\n`)
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
