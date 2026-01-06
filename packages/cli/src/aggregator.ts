import type { ToolData, ImportData } from "./types.js";

export function aggregateToolData(tools: (ToolData | null)[]): ImportData {
  const validTools = tools.filter((t): t is ToolData => t !== null);

  const toolsMap: ImportData["tools"] = {};

  for (const tool of validTools) {
    toolsMap[tool.tool] = tool;
  }

  return {
    timestamp: Date.now(),
    version: 1,
    tools: toolsMap,
  };
}

export function getAggregatedStats(data: ImportData): {
  totalTokens: number;
  totalSessions: number;
  totalMessages: number;
  toolsFound: string[];
} {
  let totalTokens = 0;
  let totalSessions = 0;
  let totalMessages = 0;
  const toolsFound: string[] = [];

  for (const [toolName, toolData] of Object.entries(data.tools)) {
    if (toolData) {
      toolsFound.push(toolName);
      totalTokens += toolData.stats.totalTokens;
      totalSessions += toolData.stats.totalSessions;
      totalMessages += toolData.stats.totalMessages;
    }
  }

  return { totalTokens, totalSessions, totalMessages, toolsFound };
}
