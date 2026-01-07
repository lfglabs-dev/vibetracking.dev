import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import type { Config } from "./types.js";

const CONFIG_DIR = join(homedir(), ".vibetracking");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<Config> {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }

  try {
    const content = await readFile(CONFIG_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function saveConfig(config: Config): Promise<void> {
  // Ensure directory exists
  if (!existsSync(CONFIG_DIR)) {
    await mkdir(CONFIG_DIR, { recursive: true });
  }

  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function getSyncToken(): Promise<string | undefined> {
  const config = await loadConfig();
  return config.syncToken;
}

export async function setSyncToken(token: string): Promise<void> {
  const config = await loadConfig();
  config.syncToken = token;
  config.lastSyncedAt = new Date().toISOString();
  await saveConfig(config);
}

export async function isAutosyncEnabled(): Promise<boolean> {
  const config = await loadConfig();
  // Default to true if not set (enabled by default)
  return config.autosyncEnabled ?? true;
}

export async function setAutosyncEnabled(enabled: boolean): Promise<void> {
  const config = await loadConfig();
  config.autosyncEnabled = enabled;
  await saveConfig(config);
}

export async function getHooksInstalledAt(): Promise<string | undefined> {
  const config = await loadConfig();
  return config.hooksInstalledAt;
}

export async function setHooksInstalledAt(timestamp: string): Promise<void> {
  const config = await loadConfig();
  config.hooksInstalledAt = timestamp;
  await saveConfig(config);
}

export async function clearHooksInstalledAt(): Promise<void> {
  const config = await loadConfig();
  delete config.hooksInstalledAt;
  await saveConfig(config);
}
