// Shared color palettes for charts
export const MODEL_COLORS = [
  "#D63384", // Pink
  "#198754", // Green
  "#0D6EFD", // Blue
  "#CC9A06", // Yellow
  "#6F42C1", // Purple
  "#FD7E14", // Orange
  "#20C997", // Teal
  "#DC3545", // Red
  "#6C757D", // Gray
];

export const TOOL_COLORS: Record<string, string> = {
  claude_code: "#D63384", // Pink
  cursor: "#0D6EFD", // Blue
  codex: "#198754", // Green
  opencode: "#6F42C1", // Purple
  claude: "#FD7E14", // Orange
  gemini: "#20C997", // Teal
  amp: "#CC9A06", // Yellow
  droid: "#DC3545", // Red
};

export const TOOL_LABELS: Record<string, string> = {
  claude_code: "Claude Code",
  cursor: "Cursor",
  codex: "Codex",
  opencode: "OpenCode",
  claude: "Claude",
  gemini: "Gemini",
  amp: "Amp",
  droid: "Droid",
};

// GitHub contribution colors
export const GITHUB_COLORS = {
  contributions: "#238636", // GitHub green
  commits: "#3fb950", // Bright green
  pullRequests: "#8250df", // Purple
  issues: "#f85149", // Red/Orange
  reviews: "#FD7E14", // Orange
  calendar: "#238636", // GitHub green for heatmap
  calendarEmpty: "#EEF0F2", // Empty day
} as const;

// Shared axis styling
export const AXIS_STYLE = {
  tick: { fontSize: 11, fill: "#232323", fillOpacity: 0.5 },
  tickLine: false,
  axisLine: { stroke: "#232323", strokeOpacity: 0.1 },
} as const;

// Shared grid styling
export const GRID_STYLE = {
  strokeDasharray: "3 3",
  stroke: "#232323",
  strokeOpacity: 0.1,
} as const;

// Shared tooltip container styling
export const TOOLTIP_STYLE = {
  backgroundColor: "#fff",
  border: "1px solid #232323",
  borderRadius: "8px",
  boxShadow: "2px 2px 0 #232323",
} as const;

// Generate a consistent color from a string (for dynamic model colors)
export function getColorFromString(str: string, palette: string[] = MODEL_COLORS): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
