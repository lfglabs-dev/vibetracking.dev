import { describe, test, expect } from "bun:test";
import { aggregateToolData, getAggregatedStats } from "../aggregator.js";
import type { ToolData } from "../types.js";

describe("Aggregator", () => {
  const mockClaudeData: ToolData = {
    tool: "claude_code",
    dailyActivity: [
      { date: "2024-01-01", messageCount: 100, sessionCount: 5, totalTokens: 50000 },
    ],
    modelUsage: [
      { model: "claude-3-opus", inputTokens: 10000, outputTokens: 20000 },
    ],
    stats: {
      totalTokens: 30000,
      totalSessions: 5,
      totalMessages: 100,
      longestSessionMs: 3600000,
    },
  };

  const mockCodexData: ToolData = {
    tool: "codex",
    dailyActivity: [
      { date: "2024-01-01", messageCount: 50, sessionCount: 3, totalTokens: 25000 },
    ],
    modelUsage: [
      { model: "gpt-4", inputTokens: 5000, outputTokens: 10000 },
    ],
    stats: {
      totalTokens: 15000,
      totalSessions: 3,
      totalMessages: 50,
      longestSessionMs: 1800000,
    },
  };

  test("aggregates multiple tool data", () => {
    const result = aggregateToolData([mockClaudeData, mockCodexData]);

    expect(result.tools.claude_code).toBeDefined();
    expect(result.tools.codex).toBeDefined();
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.version).toBe(1);
  });

  test("filters out null tools", () => {
    const result = aggregateToolData([mockClaudeData, null, mockCodexData, null]);

    expect(Object.keys(result.tools).length).toBe(2);
    expect(result.tools.claude_code).toBeDefined();
    expect(result.tools.codex).toBeDefined();
  });

  test("handles empty input", () => {
    const result = aggregateToolData([]);

    expect(Object.keys(result.tools).length).toBe(0);
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.version).toBe(1);
  });

  test("handles all null input", () => {
    const result = aggregateToolData([null, null, null]);

    expect(Object.keys(result.tools).length).toBe(0);
  });

  describe("getAggregatedStats", () => {
    test("calculates correct totals", () => {
      const data = aggregateToolData([mockClaudeData, mockCodexData]);
      const stats = getAggregatedStats(data);

      expect(stats.totalTokens).toBe(30000 + 15000);
      expect(stats.totalSessions).toBe(5 + 3);
      expect(stats.totalMessages).toBe(100 + 50);
      expect(stats.toolsFound).toContain("claude_code");
      expect(stats.toolsFound).toContain("codex");
    });

    test("handles single tool", () => {
      const data = aggregateToolData([mockClaudeData]);
      const stats = getAggregatedStats(data);

      expect(stats.totalTokens).toBe(30000);
      expect(stats.totalSessions).toBe(5);
      expect(stats.totalMessages).toBe(100);
      expect(stats.toolsFound).toEqual(["claude_code"]);
    });

    test("handles empty data", () => {
      const data = aggregateToolData([]);
      const stats = getAggregatedStats(data);

      expect(stats.totalTokens).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.totalMessages).toBe(0);
      expect(stats.toolsFound).toEqual([]);
    });
  });
});
