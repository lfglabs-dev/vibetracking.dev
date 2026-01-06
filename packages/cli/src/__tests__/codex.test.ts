import { describe, test, expect } from "bun:test";
import { parseCodex } from "../parsers/codex.js";

describe("Codex Parser", () => {
  test("parses real Codex data", async () => {
    const result = await parseCodex();

    // Should find data on this machine
    expect(result).not.toBeNull();

    if (result) {
      // Verify structure
      expect(result.tool).toBe("codex");
      expect(Array.isArray(result.dailyActivity)).toBe(true);
      expect(Array.isArray(result.modelUsage)).toBe(true);
      expect(typeof result.stats).toBe("object");

      // Verify stats
      expect(result.stats.totalTokens).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalSessions).toBeGreaterThanOrEqual(0);
      expect(result.stats.totalMessages).toBeGreaterThanOrEqual(0);

      // Log summary for visibility
      console.log("\n  Codex Stats:");
      console.log(`    Total Tokens: ${result.stats.totalTokens.toLocaleString()}`);
      console.log(`    Total Sessions: ${result.stats.totalSessions}`);
      console.log(`    Total Messages: ${result.stats.totalMessages}`);
      console.log(`    Daily Activity Days: ${result.dailyActivity.length}`);
      if (result.modelUsage.length > 0) {
        console.log(`    Models: ${result.modelUsage.map((m) => m.model).join(", ")}`);
      }
    }
  });

  test("has valid date format in daily activity", async () => {
    const result = await parseCodex();

    if (result && result.dailyActivity.length > 0) {
      for (const day of result.dailyActivity) {
        // Date should be YYYY-MM-DD format
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });

  test("daily activity is sorted by date", async () => {
    const result = await parseCodex();

    if (result && result.dailyActivity.length > 1) {
      for (let i = 1; i < result.dailyActivity.length; i++) {
        const prev = result.dailyActivity[i - 1].date;
        const curr = result.dailyActivity[i].date;
        expect(prev.localeCompare(curr)).toBeLessThanOrEqual(0);
      }
    }
  });

  test("tracks session timing for longest session", async () => {
    const result = await parseCodex();

    if (result) {
      // longestSessionMs should be set if there are sessions
      expect(result.stats.longestSessionMs).toBeGreaterThanOrEqual(0);
    }
  });
});
