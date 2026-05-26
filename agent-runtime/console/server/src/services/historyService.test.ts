import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HistoryService } from "./historyService.js";
import type { CommandRun } from "../types.js";

describe("HistoryService", () => {
  it("loads only valid command runs from persisted history", async () => {
    const historyFile = await createHistoryFile([
      commandRun({ id: "valid-1" }),
      { id: "missing fields", action: "run-check" },
      commandRun({ id: "valid-2", action: "run-next", mode: "standard", success: false, exitCode: 1, failureDetails: "failed" }),
      "not an object",
    ]);

    const service = new HistoryService(historyFile);

    await expect(service.list()).resolves.toMatchObject([
      { id: "valid-1" },
      { id: "valid-2" },
    ]);
  });

  it("treats malformed history JSON as empty history", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "agentlab-history-"));
    const historyFile = path.join(dir, "command-history.json");
    await fs.writeFile(historyFile, "{not-json", "utf8");

    const service = new HistoryService(historyFile);

    await expect(service.list()).resolves.toEqual([]);
    await expect(service.last()).resolves.toBeNull();
  });

  it("truncates oversized command output when returning history", async () => {
    const longOutput = `${"a".repeat(45000)}tail-marker`;
    const historyFile = await createHistoryFile([
      commandRun({ id: "long-output", stdout: longOutput, stderr: longOutput, failureDetails: longOutput }),
    ]);

    const service = new HistoryService(historyFile);
    const [run] = await service.list();

    expect(run.stdout).toContain("[truncated ");
    expect(run.stdout).toContain("tail-marker");
    expect(run.stderr).toContain("[truncated ");
    expect(run.stderr).toContain("tail-marker");
    expect(run.failureDetails).toContain("[truncated ");
    expect(run.failureDetails).toContain("tail-marker");
  });
});

async function createHistoryFile(entries: unknown[]): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "agentlab-history-"));
  const historyFile = path.join(dir, "command-history.json");
  await fs.writeFile(historyFile, JSON.stringify(entries), "utf8");
  return historyFile;
}

function commandRun(overrides: Partial<CommandRun> = {}): CommandRun {
  return {
    id: "valid",
    action: "run-check",
    mode: null,
    stdout: "",
    stderr: "",
    exitCode: 0,
    startedAt: "2026-05-22T00:00:00.000Z",
    endedAt: "2026-05-22T00:00:01.000Z",
    durationMs: 1000,
    success: true,
    failureDetails: null,
    ...overrides,
  };
}
