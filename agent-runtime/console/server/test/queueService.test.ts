import { describe, expect, it } from "vitest";
import { normalizeStatus, parseQueueMarkdown } from "../src/services/queueService.js";
import { runNextSchema, validateRunMode } from "../src/services/scriptService.js";
import { assertSafeAppName } from "../src/services/appService.js";

describe("queue parsing", () => {
  it("extracts queue items, fields, and summary counts", () => {
    const parsed = parseQueueMarkdown(
      [
        "## [READY] local-tool",
        "Path: C:\\apps\\local-tool",
        "Type: Full-stack app",
        "Stack: Node + React",
        "Priority: High",
        "",
        "## [BLOCKED] missing-api",
        "Type: Backend service",
      ].join("\n"),
      "queue.md",
    );

    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0].name).toBe("local-tool");
    expect(parsed.items[0].priority).toBe("High");
    expect(parsed.summary.readyCount).toBe(1);
    expect(parsed.summary.blockedCount).toBe(1);
  });

  it("normalizes loose status values", () => {
    expect(normalizeStatus("in progress")).toBe("IN_PROGRESS");
    expect(normalizeStatus("unknown")).toBe("UNKNOWN");
  });
});

describe("input safety", () => {
  it("rejects unsupported run modes", () => {
    expect(() => validateRunMode("remote")).toThrow(/Unsupported run mode/);
  });

  it("rejects missing run-next payloads through schema validation", () => {
    const result = runNextSchema.safeParse(undefined);

    expect(result.success).toBe(false);
  });

  it("rejects unsafe app names", () => {
    expect(() => assertSafeAppName("..\\secret")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("normal-app")).not.toThrow();
  });
});
