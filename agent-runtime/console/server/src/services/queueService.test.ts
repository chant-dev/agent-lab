import { describe, expect, it } from "vitest";
import { combineQueueSummaries, parseQueueMarkdown, summarizeQueue } from "./queueService.js";

describe("parseQueueMarkdown", () => {
  it("ignores queue item examples inside fenced code blocks", () => {
    const response = parseQueueMarkdown(`# Queue

\`\`\`md
## [READY] app-name
Path: C:\\AgentLab\\apps\\app-name
\`\`\`

## Active Queue Items

## [READY] agentlab-console
Path: C:\\AgentLab\\agent-runtime\\console
Type: Full-stack app
Priority: Medium
`, "queue.md");

    expect(response.summary.totalCount).toBe(1);
    expect(response.summary.readyCount).toBe(1);
    expect(response.items[0]?.name).toBe("agentlab-console");
    expect(response.items[0]?.path).toBe("C:\\AgentLab\\agent-runtime\\console");
  });

  it("summarizes real queue statuses", () => {
    const response = parseQueueMarkdown(`## [READY] one
Path: C:\\one

## [BLOCKED] two
Path: C:\\two
`, "queue.md");

    expect(response.summary.readyCount).toBe(1);
    expect(response.summary.blockedCount).toBe(1);
    expect(response.summary.totalCount).toBe(2);
  });

  it("does not parse completed queue documentation headings as completed items", () => {
    const response = parseQueueMarkdown(`# Completed Agent Queue Items

This file stores queue items that completed successfully.

## Completion Record Format

\`\`\`md
## [DONE] app-name
Path: C:\\AgentLab\\apps\\app-name
\`\`\`

## Completed Items
`, "completed.md", "DONE");

    expect(response.items).toEqual([]);
    expect(response.summary.totalCount).toBe(0);
    expect(response.summary.doneCount).toBe(0);
  });

  it("parses archived items after the completed items heading", () => {
    const response = parseQueueMarkdown(`# Completed Agent Queue Items

## Completion Record Format

Reference text.

## Completed Items

## [DONE] shipped-app
Path: C:\\AgentLab\\apps\\shipped-app
Priority: High
`, "completed.md", "DONE");

    expect(response.items).toHaveLength(1);
    expect(response.items[0]?.name).toBe("shipped-app");
    expect(response.items[0]?.path).toBe("C:\\AgentLab\\apps\\shipped-app");
    expect(response.summary.doneCount).toBe(1);
  });

  it("combines active, completed, and failed queue summaries", () => {
    const active = summarizeQueue([
      item("READY"),
      item("IN_PROGRESS"),
      item("BLOCKED"),
    ]);
    const completed = summarizeQueue([item("DONE"), item("DONE")]);
    const failed = summarizeQueue([item("FAILED")]);

    expect(combineQueueSummaries([active, completed, failed])).toEqual({
      readyCount: 1,
      inProgressCount: 1,
      blockedCount: 1,
      doneCount: 2,
      failedCount: 1,
      totalCount: 6,
    });
  });
});

function item(status: "READY" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "FAILED") {
  return {
    id: status,
    slug: status.toLowerCase(),
    name: status,
    status,
    path: null,
    type: null,
    stack: null,
    priority: null,
    rawMarkdown: "",
    parsedAt: "2026-05-22T00:00:00.000Z",
  };
}
