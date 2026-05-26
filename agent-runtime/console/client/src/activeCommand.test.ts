import { describe, expect, it } from "vitest";
import { resolveVisibleActiveCommand } from "./activeCommand";
import type { ActiveCommand } from "./types";

describe("resolveVisibleActiveCommand", () => {
  it("keeps live server output while using the local action label", () => {
    expect(resolveVisibleActiveCommand("Running health check", activeCommand())).toEqual({
      label: "Running health check",
      startedAt: "2026-05-22T00:00:00.000Z",
      stdoutTail: "live stdout",
      stderrTail: "live stderr",
    });
  });

  it("falls back to a local placeholder before the server reports the command", () => {
    expect(resolveVisibleActiveCommand("Adding idea", null)).toMatchObject({
      label: "Adding idea",
      stdoutTail: "",
      stderrTail: "",
    });
  });

  it("uses the server command label when there is no local action", () => {
    expect(resolveVisibleActiveCommand(null, activeCommand({ label: "run-next (standard)" }))).toMatchObject({
      label: "run-next (standard)",
      stdoutTail: "live stdout",
      stderrTail: "live stderr",
    });
  });
});

function activeCommand(overrides: Partial<ActiveCommand> = {}): ActiveCommand {
  return {
    id: "active-1",
    action: "run-check",
    mode: null,
    label: "run-check",
    startedAt: "2026-05-22T00:00:00.000Z",
    stdoutTail: "live stdout",
    stderrTail: "live stderr",
    ...overrides,
  };
}
