import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePositiveIntegerEnv, parseTcpPort, resolveApprovedScriptPath } from "./config.js";

describe("environment parsing", () => {
  it("requires TCP ports to be plain integers in range", () => {
    expect(parseTcpPort("8787", "AGENTLAB_CONSOLE_PORT")).toBe(8787);
    expect(parseTcpPort(" 8790 ", "AGENTLAB_CONSOLE_PORT")).toBe(8790);
    expect(() => parseTcpPort("8787abc", "AGENTLAB_CONSOLE_PORT")).toThrow(/valid TCP port/);
    expect(() => parseTcpPort("0", "AGENTLAB_CONSOLE_PORT")).toThrow(/valid TCP port/);
    expect(() => parseTcpPort("65536", "AGENTLAB_CONSOLE_PORT")).toThrow(/valid TCP port/);
  });

  it("requires positive integer runtime values", () => {
    expect(parsePositiveIntegerEnv("10", "AGENTLAB_HEARTBEAT_SECONDS")).toBe(10);
    expect(parsePositiveIntegerEnv(" 15 ", "AGENTLAB_HEARTBEAT_SECONDS")).toBe(15);
    expect(() => parsePositiveIntegerEnv("1.5", "AGENTLAB_HEARTBEAT_SECONDS")).toThrow(/positive integer/);
    expect(() => parsePositiveIntegerEnv("0", "AGENTLAB_HEARTBEAT_SECONDS")).toThrow(/positive integer/);
  });
});

describe("resolveApprovedScriptPath", () => {
  it("resolves scripts only from approved script directories", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agentlab-config-"));
    const runtimeScriptsDir = path.join(root, "agent-runtime", "scripts");
    const appDir = path.join(root, "apps", "untrusted-app");
    const fileName = "add-idea-to-queue.ps1";

    await fs.mkdir(runtimeScriptsDir, { recursive: true });
    await fs.mkdir(appDir, { recursive: true });
    await fs.writeFile(path.join(appDir, fileName), "Write-Host 'untrusted'", "utf8");
    await fs.writeFile(path.join(runtimeScriptsDir, fileName), "Write-Host 'approved'", "utf8");

    expect(resolveApprovedScriptPath(root, runtimeScriptsDir, fileName)).toBe(path.join(runtimeScriptsDir, fileName));
  });

  it("falls back to the selected scripts directory path when a script is missing", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agentlab-config-"));
    const scriptsDir = path.join(root, "agent-runtime", "scripts");
    const fileName = "check-agentlab.ps1";

    expect(resolveApprovedScriptPath(root, scriptsDir, fileName)).toBe(path.join(scriptsDir, fileName));
  });
});
