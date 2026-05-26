import fs from "node:fs";
import path from "node:path";

const ALLOWED_ENV_KEYS = new Set([
  "AGENTLAB_ROOT",
  "AGENTLAB_CONSOLE_HOST",
  "AGENTLAB_CONSOLE_PORT",
  "AGENTLAB_CODEX_SANDBOX",
  "AGENTLAB_HEARTBEAT_SECONDS",
]);

export function loadKnownEnv(consoleDir: string): void {
  const envPath = path.join(consoleDir, ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const body = fs.readFileSync(envPath, "utf8");
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [rawKey, ...rawValue] = line.split("=");
    const key = rawKey.trim();
    if (!ALLOWED_ENV_KEYS.has(key) || process.env[key]) {
      continue;
    }

    const value = rawValue.join("=").trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
}
