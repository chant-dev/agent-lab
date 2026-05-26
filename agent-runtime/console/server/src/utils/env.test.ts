import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadKnownEnv } from "./env.js";

const ENV_KEYS = [
  "AGENTLAB_ROOT",
  "AGENTLAB_CONSOLE_HOST",
  "AGENTLAB_CONSOLE_PORT",
  "AGENTLAB_CODEX_SANDBOX",
  "AGENTLAB_HEARTBEAT_SECONDS",
  "AGENTLAB_SECRET_TOKEN",
] as const;

let previousEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

beforeEach(() => {
  previousEnv = {};
  for (const key of ENV_KEYS) {
    previousEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const previous = previousEnv[key];
    if (previous === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = previous;
    }
  }
});

describe("loadKnownEnv", () => {
  it("loads only supported console environment keys", async () => {
    const consoleDir = await fs.mkdtemp(path.join(os.tmpdir(), "agentlab-env-"));
    await fs.writeFile(
      path.join(consoleDir, ".env"),
      [
        "AGENTLAB_ROOT=\"C:\\AgentLab\"",
        "AGENTLAB_CONSOLE_PORT=8790",
        "AGENTLAB_SECRET_TOKEN=do-not-load",
      ].join("\n"),
      "utf8",
    );

    loadKnownEnv(consoleDir);

    expect(process.env.AGENTLAB_ROOT).toBe("C:\\AgentLab");
    expect(process.env.AGENTLAB_CONSOLE_PORT).toBe("8790");
    expect(process.env.AGENTLAB_SECRET_TOKEN).toBeUndefined();
  });

  it("does not override values already set by the shell", async () => {
    const consoleDir = await fs.mkdtemp(path.join(os.tmpdir(), "agentlab-env-"));
    process.env.AGENTLAB_CONSOLE_HOST = "127.0.0.1";
    await fs.writeFile(path.join(consoleDir, ".env"), "AGENTLAB_CONSOLE_HOST=localhost", "utf8");

    loadKnownEnv(consoleDir);

    expect(process.env.AGENTLAB_CONSOLE_HOST).toBe("127.0.0.1");
  });
});
