import { describe, test, expect } from "bun:test";
import { parseCursor } from "../parsers/cursor.js";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

describe("Cursor Parser", () => {
  test("detects Cursor installation", async () => {
    const cursorDir = join(
      homedir(),
      "Library",
      "Application Support",
      "Cursor"
    );

    // On this machine, Cursor is installed
    if (existsSync(cursorDir)) {
      console.log("\n  Cursor installation detected at:", cursorDir);

      // Check what user data exists
      const userDir = join(cursorDir, "User");
      const globalStorageDir = join(userDir, "globalStorage");

      if (existsSync(userDir)) {
        console.log("    User directory: EXISTS");
      }
      if (existsSync(globalStorageDir)) {
        console.log("    globalStorage directory: EXISTS");
      }
    } else {
      console.log("\n  Cursor not installed on this machine");
    }
  });

  test("returns null (placeholder implementation)", async () => {
    const result = await parseCursor();

    // Current implementation is a placeholder
    // It should return null even if Cursor is installed
    expect(result).toBeNull();

    console.log("\n  Note: Cursor parser is a placeholder implementation");
    console.log("  It returns null until actual Cursor data parsing is implemented");
  });

  test("documents required data locations", () => {
    // This test documents where Cursor stores data for future implementation
    const platform = process.platform;

    let expectedPaths: string[];
    if (platform === "darwin") {
      expectedPaths = [
        "~/Library/Application Support/Cursor/User/globalStorage",
        "~/Library/Application Support/Cursor/User/state.vscdb",
        "~/Library/Application Support/Cursor/User/workspaceStorage",
      ];
    } else if (platform === "win32") {
      expectedPaths = [
        "%APPDATA%/Cursor/User/globalStorage",
        "%APPDATA%/Cursor/User/state.vscdb",
      ];
    } else {
      expectedPaths = [
        "~/.config/Cursor/User/globalStorage",
        "~/.config/Cursor/User/state.vscdb",
      ];
    }

    console.log("\n  Expected Cursor data paths for", platform + ":");
    for (const path of expectedPaths) {
      console.log("    -", path);
    }

    expect(expectedPaths.length).toBeGreaterThan(0);
  });
});
