import { describe, test, expect } from "bun:test";
import { encodeData, decodeData } from "../encoder.js";
import type { ImportData, ToolData } from "../types.js";

describe("Encoder", () => {
  const mockToolData: ToolData = {
    tool: "claude_code",
    dailyActivity: [
      { date: "2024-01-01", messageCount: 10, sessionCount: 2, totalTokens: 5000 },
      { date: "2024-01-02", messageCount: 20, sessionCount: 3, totalTokens: 10000 },
    ],
    modelUsage: [
      { model: "claude-3-opus", inputTokens: 1000, outputTokens: 2000 },
      { model: "claude-3-sonnet", inputTokens: 500, outputTokens: 1000 },
    ],
    stats: {
      totalTokens: 15000,
      totalSessions: 5,
      totalMessages: 30,
      longestSessionMs: 3600000,
    },
  };

  const mockImportData: ImportData = {
    timestamp: Date.now(),
    version: 1,
    tools: {
      claude_code: mockToolData,
    },
  };

  test("encodes data to base64url string", () => {
    const encoded = encodeData(mockImportData);

    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);

    // Base64url should not contain +, /, or =
    expect(encoded).not.toMatch(/[+/=]/);

    console.log("\n  Encoded length:", encoded.length, "chars");
    console.log("  Original JSON size:", JSON.stringify(mockImportData).length, "chars");
    console.log("  Compression ratio:", (encoded.length / JSON.stringify(mockImportData).length * 100).toFixed(1) + "%");
  });

  test("decodes back to original data (round-trip)", () => {
    const encoded = encodeData(mockImportData);
    const decoded = decodeData(encoded);

    // Verify structure preserved
    expect(decoded.version).toBe(mockImportData.version);
    expect(decoded.timestamp).toBe(mockImportData.timestamp);
    expect(decoded.tools.claude_code).toBeDefined();

    const tool = decoded.tools.claude_code!;
    expect(tool.tool).toBe("claude_code");
    expect(tool.stats.totalTokens).toBe(15000);
    expect(tool.dailyActivity.length).toBe(2);
    expect(tool.modelUsage.length).toBe(2);
  });

  test("handles Unicode characters", () => {
    const dataWithUnicode: ImportData = {
      ...mockImportData,
      syncToken: "token-with-emoji-\u{1F600}-test",
    };

    const encoded = encodeData(dataWithUnicode);
    const decoded = decodeData(encoded);

    expect(decoded.syncToken).toBe("token-with-emoji-\u{1F600}-test");
  });

  test("handles large data sets", () => {
    // Create large daily activity array with valid dates
    const startDate = new Date("2024-01-01");
    const largeDailyActivity = Array.from({ length: 365 }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split("T")[0],
        messageCount: Math.floor(Math.random() * 100),
        sessionCount: Math.floor(Math.random() * 10),
        totalTokens: Math.floor(Math.random() * 50000),
      };
    });

    const largeData: ImportData = {
      timestamp: Date.now(),
      version: 1,
      tools: {
        claude_code: {
          ...mockToolData,
          dailyActivity: largeDailyActivity,
        },
      },
    };

    const originalSize = JSON.stringify(largeData).length;
    const encoded = encodeData(largeData);
    const decoded = decodeData(encoded);

    expect(decoded.tools.claude_code?.dailyActivity.length).toBe(365);

    console.log("\n  Large data test:");
    console.log("    Original JSON size:", originalSize, "bytes");
    console.log("    Encoded size:", encoded.length, "bytes");
    console.log("    Compression:", ((1 - encoded.length / originalSize) * 100).toFixed(1) + "% reduction");
  });

  test("handles multiple tools", () => {
    const multiToolData: ImportData = {
      timestamp: Date.now(),
      version: 1,
      tools: {
        claude_code: mockToolData,
        codex: {
          ...mockToolData,
          tool: "codex",
          stats: { ...mockToolData.stats, totalTokens: 8000 },
        },
      },
    };

    const encoded = encodeData(multiToolData);
    const decoded = decodeData(encoded);

    expect(decoded.tools.claude_code).toBeDefined();
    expect(decoded.tools.codex).toBeDefined();
    expect(decoded.tools.claude_code?.stats.totalTokens).toBe(15000);
    expect(decoded.tools.codex?.stats.totalTokens).toBe(8000);
  });

  test("handles empty tools", () => {
    const emptyData: ImportData = {
      timestamp: Date.now(),
      version: 1,
      tools: {},
    };

    const encoded = encodeData(emptyData);
    const decoded = decodeData(encoded);

    expect(decoded.tools).toEqual({});
  });
});
