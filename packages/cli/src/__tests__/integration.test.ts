import { describe, test, expect } from "bun:test";
import { parseClaudeCode } from "../parsers/claude.js";
import { parseCodex } from "../parsers/codex.js";
import { parseCursor } from "../parsers/cursor.js";
import { aggregateToolData, getAggregatedStats } from "../aggregator.js";
import { encodeData, decodeData } from "../encoder.js";

describe("Integration Tests", () => {
  test("full CLI flow with real data", async () => {
    console.log("\n  === Full Integration Test ===\n");

    // Step 1: Parse all tools
    console.log("  Step 1: Parsing tool data...");
    const [claudeData, codexData, cursorData] = await Promise.all([
      parseClaudeCode(),
      parseCodex(),
      parseCursor(),
    ]);

    const foundTools: string[] = [];
    if (claudeData) foundTools.push("Claude Code");
    if (codexData) foundTools.push("Codex");
    if (cursorData) foundTools.push("Cursor");

    console.log(`    Found ${foundTools.length} tools: ${foundTools.join(", ") || "none"}`);

    // Should have at least one tool on this machine
    expect(claudeData !== null || codexData !== null || cursorData !== null).toBe(true);

    // Step 2: Aggregate data
    console.log("  Step 2: Aggregating data...");
    const aggregated = aggregateToolData([claudeData, codexData, cursorData]);
    const stats = getAggregatedStats(aggregated);

    console.log(`    Total Tokens: ${stats.totalTokens.toLocaleString()}`);
    console.log(`    Total Sessions: ${stats.totalSessions}`);
    console.log(`    Total Messages: ${stats.totalMessages}`);

    expect(stats.totalTokens).toBeGreaterThan(0);

    // Step 3: Encode data
    console.log("  Step 3: Encoding data...");
    const encoded = encodeData(aggregated);

    console.log(`    Encoded length: ${encoded.length} chars`);

    expect(encoded.length).toBeGreaterThan(0);
    // Base64url should not contain +, /, or =
    expect(encoded).not.toMatch(/[+/=]/);

    // Step 4: Decode and verify
    console.log("  Step 4: Decoding and verifying...");
    const decoded = decodeData(encoded);

    expect(decoded.version).toBe(aggregated.version);
    expect(decoded.timestamp).toBe(aggregated.timestamp);
    expect(Object.keys(decoded.tools).length).toBe(Object.keys(aggregated.tools).length);

    // Verify stats match after round-trip
    const decodedStats = getAggregatedStats(decoded);
    expect(decodedStats.totalTokens).toBe(stats.totalTokens);
    expect(decodedStats.totalSessions).toBe(stats.totalSessions);
    expect(decodedStats.totalMessages).toBe(stats.totalMessages);

    console.log("    Round-trip verification: PASSED");

    // Step 5: Generate URL
    console.log("  Step 5: Generating import URL...");
    const appUrl = "https://vibetracking.dev";
    const importUrl = `${appUrl}/import#${encoded}`;

    console.log(`    URL length: ${importUrl.length} chars`);

    // URL should be reasonable length for browser
    expect(importUrl.length).toBeLessThan(100000); // Most browsers support ~2MB URLs

    console.log("\n  === Integration Test Complete ===\n");
  });

  test("handles missing tool data gracefully", async () => {
    // Simulate missing tools
    const aggregated = aggregateToolData([null, null, null]);
    const stats = getAggregatedStats(aggregated);

    expect(stats.totalTokens).toBe(0);
    expect(stats.toolsFound.length).toBe(0);

    // Should still encode/decode
    const encoded = encodeData(aggregated);
    const decoded = decodeData(encoded);

    expect(decoded.tools).toEqual({});
  });

  test("daily activity data integrity", async () => {
    const claudeData = await parseClaudeCode();

    if (claudeData && claudeData.dailyActivity.length > 0) {
      // All dates should be valid
      for (const day of claudeData.dailyActivity) {
        const date = new Date(day.date);
        expect(date.toString()).not.toBe("Invalid Date");

        // Counts should be non-negative
        expect(day.messageCount).toBeGreaterThanOrEqual(0);
        expect(day.sessionCount).toBeGreaterThanOrEqual(0);
      }

      // Encode and decode
      const aggregated = aggregateToolData([claudeData]);
      const encoded = encodeData(aggregated);
      const decoded = decodeData(encoded);

      // Verify daily activity preserved
      expect(decoded.tools.claude_code?.dailyActivity.length).toBe(
        claudeData.dailyActivity.length
      );
    }
  });

  test("model usage data integrity", async () => {
    const claudeData = await parseClaudeCode();

    if (claudeData && claudeData.modelUsage.length > 0) {
      for (const model of claudeData.modelUsage) {
        // Model name should be non-empty
        expect(model.model.length).toBeGreaterThan(0);

        // Token counts should be non-negative
        expect(model.inputTokens).toBeGreaterThanOrEqual(0);
        expect(model.outputTokens).toBeGreaterThanOrEqual(0);
      }

      // Verify after encode/decode
      const aggregated = aggregateToolData([claudeData]);
      const encoded = encodeData(aggregated);
      const decoded = decodeData(encoded);

      expect(decoded.tools.claude_code?.modelUsage.length).toBe(
        claudeData.modelUsage.length
      );
    }
  });
});
