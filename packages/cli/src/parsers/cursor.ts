import { readFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { ToolData } from "../types.js";

// Cursor stores data in ~/Library/Application Support/Cursor/
// The exact format varies by version, so we try multiple approaches

export async function parseCursor(): Promise<ToolData | null> {
  const platform = process.platform;

  let cursorDir: string;
  if (platform === "darwin") {
    cursorDir = join(
      homedir(),
      "Library",
      "Application Support",
      "Cursor"
    );
  } else if (platform === "win32") {
    cursorDir = join(
      process.env.APPDATA || join(homedir(), "AppData", "Roaming"),
      "Cursor"
    );
  } else {
    cursorDir = join(homedir(), ".config", "Cursor");
  }

  if (!existsSync(cursorDir)) {
    return null;
  }

  try {
    // Look for User/globalStorage or similar locations
    const userDir = join(cursorDir, "User");
    const globalStorageDir = join(userDir, "globalStorage");

    if (!existsSync(globalStorageDir)) {
      return null;
    }

    // Cursor stores conversation data in SQLite databases
    // We'll look for common patterns but this may need adjustment
    // based on actual Cursor data structure

    // For now, return null if we can't find recognizable data
    // This is a placeholder - would need actual Cursor data samples
    // to implement proper parsing

    // Check for state.vscdb or similar
    const stateDbPath = join(userDir, "state.vscdb");
    const workspaceStorageDir = join(userDir, "workspaceStorage");

    // List what's available for future implementation
    const availablePaths: string[] = [];
    if (existsSync(stateDbPath)) availablePaths.push("state.vscdb");
    if (existsSync(workspaceStorageDir)) availablePaths.push("workspaceStorage");

    // TODO: Implement actual Cursor parsing when we have sample data
    // Cursor uses different storage formats across versions

    return null;
  } catch (error) {
    console.error("Error parsing Cursor data:", error);
    return null;
  }
}
