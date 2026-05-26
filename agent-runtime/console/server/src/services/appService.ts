import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import type { AppFolder } from "../types.js";
import { isPathInside } from "../utils/paths.js";

const SAFE_APP_NAME = /^[a-zA-Z0-9._ -]+$/;
const WINDOWS_RESERVED_APP_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;

export function assertSafeAppName(appName: string): void {
  if (
    appName.trim().length === 0 ||
    appName.trim() !== appName ||
    appName === "." ||
    appName.endsWith(".") ||
    WINDOWS_RESERVED_APP_NAME.test(appName) ||
    !SAFE_APP_NAME.test(appName) ||
    appName.includes("..") ||
    appName.includes("/") ||
    appName.includes("\\")
  ) {
    throw new Error("Invalid app name.");
  }
}

export async function listRecentApps(): Promise<AppFolder[]> {
  let entries;
  try {
    entries = await fs.readdir(config.paths.appsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const folders = (await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && entry.name !== "app-name")
      .map((entry) => readAppFolder(entry.name)),
  )).filter((folder): folder is AppFolder => folder !== null);

  const runtimeTools = await listRuntimeTools();
  return [...runtimeTools, ...folders].sort((a, b) => Date.parse(b.lastModifiedAt) - Date.parse(a.lastModifiedAt));
}

export async function readAppReport(appName: string): Promise<{ appName: string; path: string; exists: boolean; markdown: string }> {
  assertSafeAppName(appName);
  const baseDir = appName === "agentlab-console" ? config.paths.consoleDir : path.join(config.paths.appsDir, appName);
  const allowedRoot = appName === "agentlab-console" ? config.paths.consoleDir : config.paths.appsDir;
  const reportPath = path.join(baseDir, "AGENT_REPORT.md");

  if (reportPath !== path.join(allowedRoot, "AGENT_REPORT.md") && !isPathInside(allowedRoot, reportPath)) {
    throw new Error("Invalid report path.");
  }

  try {
    return {
      appName,
      path: reportPath,
      exists: true,
      markdown: await fs.readFile(reportPath, "utf8"),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { appName, path: reportPath, exists: false, markdown: "" };
    }
    throw error;
  }
}

async function readAppFolder(appName: string): Promise<AppFolder | null> {
  const appPath = path.join(config.paths.appsDir, appName);
  try {
    const stat = await fs.stat(appPath);
    return {
      appName,
      path: appPath,
      kind: "app",
      hasAgentsMd: await exists(path.join(appPath, "AGENTS.md")),
      hasReadmeMd: await exists(path.join(appPath, "README.md")),
      hasAgentReportMd: await exists(path.join(appPath, "AGENT_REPORT.md")),
      lastModifiedAt: stat.mtime.toISOString(),
    };
  } catch {
    return null;
  }
}

async function listRuntimeTools(): Promise<AppFolder[]> {
  const consoleDir = config.paths.consoleDir;
  try {
    const stat = await fs.stat(consoleDir);
    return [{
      appName: "agentlab-console",
      path: consoleDir,
      kind: "runtime",
      hasAgentsMd: await exists(path.join(consoleDir, "AGENTS.md")),
      hasReadmeMd: await exists(path.join(consoleDir, "README.md")),
      hasAgentReportMd: await exists(path.join(consoleDir, "AGENT_REPORT.md")),
      lastModifiedAt: stat.mtime.toISOString(),
    }];
  } catch {
    return [];
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
