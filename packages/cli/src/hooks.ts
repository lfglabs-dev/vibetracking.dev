import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import TOML from "@iarna/toml";

// Hook command that will be installed
const VIBETRACKING_HOOK_COMMAND = "vibetracking sync --quiet 2>/dev/null || true";
const VIBETRACKING_HOOK_MARKER = "vibetracking";

// Claude Code settings path
const CLAUDE_SETTINGS_PATH = join(homedir(), ".claude", "settings.json");

// Codex config path
const CODEX_CONFIG_PATH = join(homedir(), ".codex", "config.toml");

interface ClaudeHook {
  type: string;
  command: string;
  timeout?: number;
}

interface ClaudeHookEntry {
  matcher?: string;
  hooks: ClaudeHook[];
}

interface ClaudeSettings {
  hooks?: {
    Stop?: ClaudeHookEntry[];
    [key: string]: ClaudeHookEntry[] | undefined;
  };
  [key: string]: unknown;
}

interface CodexConfig {
  notify?: string[];
  [key: string]: unknown;
}

/**
 * Install the vibetracking hook into Claude Code settings
 */
export async function installClaudeCodeHook(): Promise<boolean> {
  try {
    let settings: ClaudeSettings = {};

    // Load existing settings if they exist
    if (existsSync(CLAUDE_SETTINGS_PATH)) {
      const content = await readFile(CLAUDE_SETTINGS_PATH, "utf-8");
      try {
        settings = JSON.parse(content);
      } catch {
        // If parse fails, start fresh
        settings = {};
      }
    }

    // Initialize hooks structure if needed
    if (!settings.hooks) {
      settings.hooks = {};
    }
    if (!settings.hooks.Stop) {
      settings.hooks.Stop = [];
    }

    // Check if our hook already exists
    const existingHook = settings.hooks.Stop.find((entry) =>
      entry.hooks?.some((h) => h.command?.includes(VIBETRACKING_HOOK_MARKER))
    );

    if (existingHook) {
      // Hook already installed
      return true;
    }

    // Add our hook
    settings.hooks.Stop.push({
      hooks: [
        {
          type: "command",
          command: VIBETRACKING_HOOK_COMMAND,
          timeout: 30,
        },
      ],
    });

    // Ensure directory exists
    const claudeDir = join(homedir(), ".claude");
    if (!existsSync(claudeDir)) {
      await mkdir(claudeDir, { recursive: true });
    }

    // Write settings
    await writeFile(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to install Claude Code hook:", error);
    return false;
  }
}

/**
 * Remove the vibetracking hook from Claude Code settings
 */
export async function removeClaudeCodeHook(): Promise<boolean> {
  try {
    if (!existsSync(CLAUDE_SETTINGS_PATH)) {
      return true; // Nothing to remove
    }

    const content = await readFile(CLAUDE_SETTINGS_PATH, "utf-8");
    let settings: ClaudeSettings;

    try {
      settings = JSON.parse(content);
    } catch {
      return true; // Can't parse, nothing to remove
    }

    if (!settings.hooks?.Stop) {
      return true; // No hooks to remove
    }

    // Filter out our hook
    settings.hooks.Stop = settings.hooks.Stop.filter(
      (entry) =>
        !entry.hooks?.some((h) => h.command?.includes(VIBETRACKING_HOOK_MARKER))
    );

    // Clean up empty arrays
    if (settings.hooks.Stop.length === 0) {
      delete settings.hooks.Stop;
    }
    if (Object.keys(settings.hooks).length === 0) {
      delete settings.hooks;
    }

    await writeFile(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to remove Claude Code hook:", error);
    return false;
  }
}

/**
 * Install the vibetracking hook into Codex config
 */
export async function installCodexHook(): Promise<boolean> {
  try {
    let config: CodexConfig = {};

    // Load existing config if it exists
    if (existsSync(CODEX_CONFIG_PATH)) {
      const content = await readFile(CODEX_CONFIG_PATH, "utf-8");
      try {
        config = TOML.parse(content) as CodexConfig;
      } catch {
        // If parse fails, start fresh
        config = {};
      }
    }

    // Check if our hook already exists
    if (
      config.notify &&
      Array.isArray(config.notify) &&
      config.notify.some((cmd) => cmd.includes(VIBETRACKING_HOOK_MARKER))
    ) {
      return true; // Already installed
    }

    // Set our notify command
    // Note: Codex notify is a single command array, so we replace it
    // If user had a different notify, we'll overwrite it - this is a limitation
    config.notify = ["vibetracking", "sync", "--quiet"];

    // Ensure directory exists
    const codexDir = join(homedir(), ".codex");
    if (!existsSync(codexDir)) {
      await mkdir(codexDir, { recursive: true });
    }

    // Write config
    await writeFile(CODEX_CONFIG_PATH, TOML.stringify(config as TOML.JsonMap));
    return true;
  } catch (error) {
    console.error("Failed to install Codex hook:", error);
    return false;
  }
}

/**
 * Remove the vibetracking hook from Codex config
 */
export async function removeCodexHook(): Promise<boolean> {
  try {
    if (!existsSync(CODEX_CONFIG_PATH)) {
      return true; // Nothing to remove
    }

    const content = await readFile(CODEX_CONFIG_PATH, "utf-8");
    let config: CodexConfig;

    try {
      config = TOML.parse(content) as CodexConfig;
    } catch {
      return true; // Can't parse, nothing to remove
    }

    // Check if it's our notify command
    if (
      config.notify &&
      Array.isArray(config.notify) &&
      config.notify.some((cmd) => cmd.includes(VIBETRACKING_HOOK_MARKER))
    ) {
      delete config.notify;
      await writeFile(CODEX_CONFIG_PATH, TOML.stringify(config as TOML.JsonMap));
    }

    return true;
  } catch (error) {
    console.error("Failed to remove Codex hook:", error);
    return false;
  }
}

/**
 * Check the status of installed hooks
 */
export async function getHookStatus(): Promise<{
  claudeCode: boolean;
  codex: boolean;
}> {
  let claudeCode = false;
  let codex = false;

  // Check Claude Code
  try {
    if (existsSync(CLAUDE_SETTINGS_PATH)) {
      const content = await readFile(CLAUDE_SETTINGS_PATH, "utf-8");
      const settings: ClaudeSettings = JSON.parse(content);
      claudeCode = settings.hooks?.Stop?.some((entry) =>
        entry.hooks?.some((h) => h.command?.includes(VIBETRACKING_HOOK_MARKER))
      ) ?? false;
    }
  } catch {
    // Ignore errors
  }

  // Check Codex
  try {
    if (existsSync(CODEX_CONFIG_PATH)) {
      const content = await readFile(CODEX_CONFIG_PATH, "utf-8");
      const config = TOML.parse(content) as CodexConfig;
      codex =
        config.notify?.some((cmd) => cmd.includes(VIBETRACKING_HOOK_MARKER)) ??
        false;
    }
  } catch {
    // Ignore errors
  }

  return { claudeCode, codex };
}

/**
 * Install hooks for all detected tools
 */
export async function installAllHooks(): Promise<{
  claudeCode: boolean;
  codex: boolean;
}> {
  const claudeCode = await installClaudeCodeHook();
  const codex = await installCodexHook();
  return { claudeCode, codex };
}

/**
 * Remove hooks from all tools
 */
export async function removeAllHooks(): Promise<{
  claudeCode: boolean;
  codex: boolean;
}> {
  const claudeCode = await removeClaudeCodeHook();
  const codex = await removeCodexHook();
  return { claudeCode, codex };
}
