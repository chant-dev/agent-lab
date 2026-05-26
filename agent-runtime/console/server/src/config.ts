import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadKnownEnv } from "./utils/env.js";
import { findFirstExisting } from "./utils/paths.js";
import type { AgentLabPaths } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const consoleDir = path.resolve(__dirname, "..", "..");

loadKnownEnv(consoleDir);

const defaultRoot = path.resolve(consoleDir, "..", "..");
const root = path.resolve(process.env.AGENTLAB_ROOT ?? defaultRoot);
const host = process.env.AGENTLAB_CONSOLE_HOST ?? "127.0.0.1";
const port = parseTcpPort(process.env.AGENTLAB_CONSOLE_PORT ?? "8787", "AGENTLAB_CONSOLE_PORT");
const heartbeatSeconds = parsePositiveIntegerEnv(process.env.AGENTLAB_HEARTBEAT_SECONDS ?? "10", "AGENTLAB_HEARTBEAT_SECONDS");
const codexSandbox = process.env.AGENTLAB_CODEX_SANDBOX ?? "danger-full-access";

if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  throw new Error("AGENTLAB_CONSOLE_HOST must be local-only. Refusing non-local bind host.");
}

const scriptsDir = findFirstExisting(
  [path.join(root, "scripts"), path.join(root, "agent-runtime", "scripts")],
  path.join(root, "scripts"),
);

const paths: AgentLabPaths = {
  root,
  queueFile: findFirstExisting(
    [
      path.join(root, "queue", "queue.md"),
      path.join(root, "queue.md"),
      path.join(root, "agent-runtime", "queue.md"),
      path.join(root, "agent-runtime", "queue", "queue.md"),
      path.join(root, "queues", "queue.md"),
    ],
    path.join(root, "queue", "queue.md"),
  ),
  completedQueueFile: findFirstExisting(
    [
      path.join(root, "queue", "completed.md"),
      path.join(root, "completed.md"),
      path.join(root, "queue-completed.md"),
      path.join(root, "agent-runtime", "completed.md"),
      path.join(root, "agent-runtime", "queue", "completed.md"),
      path.join(root, "queues", "completed.md"),
    ],
    path.join(root, "queue", "completed.md"),
  ),
  failedQueueFile: findFirstExisting(
    [
      path.join(root, "queue", "failed.md"),
      path.join(root, "failed.md"),
      path.join(root, "queue-failed.md"),
      path.join(root, "agent-runtime", "failed.md"),
      path.join(root, "agent-runtime", "queue", "failed.md"),
      path.join(root, "queues", "failed.md"),
    ],
    path.join(root, "queue", "failed.md"),
  ),
  scriptsDir,
  promptsDir: findFirstExisting([path.join(root, "prompts"), path.join(root, "agent-runtime", "prompts")], path.join(root, "prompts")),
  docsDir: findFirstExisting([path.join(root, "docs"), path.join(root, "agent-runtime", "docs")], path.join(root, "docs")),
  logsDir: findFirstExisting([path.join(root, "logs"), path.join(root, "agent-runtime", "logs")], path.join(root, "logs")),
  appsDir: findFirstExisting([path.join(root, "apps")], path.join(root, "apps")),
  consoleDir,
};

export const config = {
  host,
  port,
  paths,
  historyFile: path.join(consoleDir, "command-history.json"),
  scriptRuntime: {
    codexSandbox,
    heartbeatSeconds,
  },
  scripts: {
    addIdea: resolveApprovedScriptPath(root, scriptsDir, "add-idea-to-queue.ps1"),
    runNext: resolveApprovedScriptPath(root, scriptsDir, "run-next-queue-item.ps1"),
    checkAgentLab: resolveApprovedScriptPath(root, scriptsDir, "check-agentlab.ps1"),
  },
};

export function parseTcpPort(rawValue: string, key: string): number {
  const normalized = rawValue.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${key} must be a valid TCP port.`);
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error(`${key} must be a valid TCP port.`);
  }

  return parsed;
}

export function parsePositiveIntegerEnv(rawValue: string, key: string): number {
  const normalized = rawValue.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error(`${key} must be a positive integer.`);
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${key} must be a positive integer.`);
  }

  return parsed;
}

export function resolveApprovedScriptPath(agentLabRoot: string, selectedScriptsDir: string, fileName: string): string {
  return findFirstExisting(
    Array.from(new Set([
      path.join(selectedScriptsDir, fileName),
      path.join(agentLabRoot, "agent-runtime", "scripts", fileName),
      path.join(agentLabRoot, "scripts", fileName),
    ])),
    path.join(selectedScriptsDir, fileName),
  );
}
