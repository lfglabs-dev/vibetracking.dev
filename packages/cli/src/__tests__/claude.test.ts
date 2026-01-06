import { describe, test, expect } from "bun:test";
import { parseClaudeCode } from "../parsers/claude.js";

describe("Claude Code Parser", () => {
  test("parses real Claude Code stats-cache.json", async () => {
    const result = await parseClaudeCode();

    // Should find data on this machine
    expect(result).not.toBeNull();

    if (result) {
      // Verify structure
      expect(result.tool).toBe("claude_code");
      expect(Array.isArray(result.dailyActivity)).toBe(true);
      expect(Array.isArray(result.modelUsage)).toBe(true);
      expect(typeof result.stats).toBe("object");

      // Verify stats
      expect(result.stats.totalTokens).toBeGreaterThan(0);
      expect(result.stats.totalSessions).toBeGreaterThan(0);
      expect(result.stats.totalMessages).toBeGreaterThan(0);

      // Verify daily activity structure
      if (result.dailyActivity.length > 0) {
        const day = result.dailyActivity[0];
        expect(day).toHaveProperty("date");
        expect(day).toHaveProperty("messageCount");
        expect(day).toHaveProperty("sessionCount");
      }

      // Verify model usage structure
      if (result.modelUsage.length > 0) {
        const model = result.modelUsage[0];
        expect(model).toHaveProperty("model");
        expect(model).toHaveProperty("inputTokens");
        expect(model).toHaveProperty("outputTokens");
      }

      // Log summary for visibility
      console.log("\n  Claude Code Stats:");
      console.log(`    Total Tokens: ${result.stats.totalTokens.toLocaleString()}`);
      console.log(`    Total Sessions: ${result.stats.totalSessions}`);
      console.log(`    Total Messages: ${result.stats.totalMessages}`);
      console.log(`    Models: ${result.modelUsage.map((m) => m.model).join(", ")}`);
    }
  });

  test("includes cache tokens in total calculation", async () => {
    const result = await parseClaudeCode();

    if (result) {
      // Total tokens should include cache tokens
      const calculatedTotal = result.modelUsage.reduce(
        (sum, m) =>
          sum +
          m.inputTokens +
          m.outputTokens +
          (m.cacheReadTokens || 0) +
          (m.cacheCreationTokens || 0),
        0
      );

      expect(result.stats.totalTokens).toBe(calculatedTotal);
    }
  });

  test("has valid date format in daily activity", async () => {
    const result = await parseClaudeCode();

    if (result && result.dailyActivity.length > 0) {
      for (const day of result.dailyActivity) {
        // Date should be YYYY-MM-DD format
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  test("daily activity is sorted by date", async () => {
    const result = await parseClaudeCode();

    if (result && result.dailyActivity.length > 1) {
      for (let i = 1; i < result.dailyActivity.length; i++) {
        const prev = result.dailyActivity[i - 1].date;
        const curr = result.dailyActivity[i].date;
        expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
      }
    }
  });
});
