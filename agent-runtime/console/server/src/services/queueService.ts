import fs from "node:fs/promises";
import type { QueueDocument, QueueItem, QueueStatus, QueueSummary } from "../types.js";
import { slugify } from "../utils/paths.js";

const STATUS_VALUES = ["READY", "IN_PROGRESS", "BLOCKED", "DONE", "FAILED"] as const;
const STATUS_SET = new Set<string>(STATUS_VALUES);

export function parseQueueMarkdown(markdown: string, sourcePath: string, fallbackStatus: QueueStatus = "UNKNOWN"): QueueDocument {
  const parsedAt = new Date().toISOString();
  const markdownWithoutFencedCode = selectQueueItemsSection(stripFencedCodeBlocks(markdown));
  const headings = [...markdownWithoutFencedCode.matchAll(/^(#{1,6})\s+(.*)$/gm)];
  const statusHeadings = headings.filter((match) => match[1] === "##" && /^\[(READY|IN_PROGRESS|BLOCKED|DONE|FAILED)\]/i.test(match[2] ?? ""));
  const itemHeadings = statusHeadings.length > 0 ? statusHeadings : headings;
  const sections = itemHeadings.length > 0 ? itemHeadings.map((match, index) => {
    const start = match.index ?? 0;
    const next = itemHeadings[index + 1]?.index ?? markdown.length;
    return markdownWithoutFencedCode.slice(start, next).trim();
  }) : markdownWithoutFencedCode.trim() ? [markdownWithoutFencedCode.trim()] : [];

  const items = sections
    .map((section, index) => parseQueueSection(section, index, parsedAt, fallbackStatus))
    .filter((item): item is QueueItem => item !== null);

  return {
    sourcePath,
    exists: true,
    items,
    summary: summarizeQueue(items),
    parsedAt,
  };
}

function stripFencedCodeBlocks(markdown: string): string {
  return markdown.replace(/^```[\s\S]*?^```/gm, (block) => "\n".repeat(block.split(/\r?\n/).length - 1));
}

function selectQueueItemsSection(markdown: string): string {
  const queueSectionHeading = markdown.match(/^##\s+(Active Queue Items|Completed Items|Failed or Blocked Items)\s*$/im);
  if (!queueSectionHeading || queueSectionHeading.index === undefined) {
    return markdown;
  }

  return markdown.slice(queueSectionHeading.index + queueSectionHeading[0].length);
}

function parseQueueSection(section: string, index: number, parsedAt: string, fallbackStatus: QueueStatus): QueueItem | null {
  const lines = section.split(/\r?\n/);
  const heading = lines[0] ?? "";
  const title = heading.replace(/^#{1,6}\s+/, "").trim();
  const statusMatch = title.match(/\[(READY|IN_PROGRESS|BLOCKED|DONE|FAILED)\]/i);
  const status = normalizeStatus(statusMatch?.[1] ?? findField(section, "Status") ?? fallbackStatus);
  const name = title.replace(/\[(READY|IN_PROGRESS|BLOCKED|DONE|FAILED)\]\s*/i, "").trim() || `Queue Item ${index + 1}`;
  const slug = slugify(name) || `queue-item-${index + 1}`;

  if (!title && !section.trim()) {
    return null;
  }

  return {
    id: `${slug}-${index + 1}`,
    slug,
    name,
    status,
    path: findField(section, "Path"),
    type: findField(section, "Type"),
    stack: findField(section, "Stack"),
    priority: findField(section, "Priority"),
    rawMarkdown: section,
    parsedAt,
  };
}

function findField(section: string, field: string): string | null {
  const pattern = new RegExp(`^\\s*(?:[-*]\\s*)?${field}\\s*:\\s*(.+?)\\s*$`, "im");
  const match = section.match(pattern);
  return match?.[1]?.trim() ?? null;
}

export function normalizeStatus(value: string): QueueStatus {
  const normalized = value.trim().toUpperCase().replace(/[-\s]+/g, "_");
  return STATUS_SET.has(normalized) ? (normalized as QueueStatus) : "UNKNOWN";
}

export function summarizeQueue(items: QueueItem[]): QueueSummary {
  return {
    readyCount: items.filter((item) => item.status === "READY").length,
    inProgressCount: items.filter((item) => item.status === "IN_PROGRESS").length,
    blockedCount: items.filter((item) => item.status === "BLOCKED").length,
    doneCount: items.filter((item) => item.status === "DONE").length,
    failedCount: items.filter((item) => item.status === "FAILED").length,
    totalCount: items.length,
  };
}

export function combineQueueSummaries(summaries: QueueSummary[]): QueueSummary {
  return summaries.reduce<QueueSummary>(
    (combined, summary) => ({
      readyCount: combined.readyCount + summary.readyCount,
      inProgressCount: combined.inProgressCount + summary.inProgressCount,
      blockedCount: combined.blockedCount + summary.blockedCount,
      doneCount: combined.doneCount + summary.doneCount,
      failedCount: combined.failedCount + summary.failedCount,
      totalCount: combined.totalCount + summary.totalCount,
    }),
    {
      readyCount: 0,
      inProgressCount: 0,
      blockedCount: 0,
      doneCount: 0,
      failedCount: 0,
      totalCount: 0,
    },
  );
}

export async function readQueueFile(filePath: string, fallbackStatus: QueueStatus = "UNKNOWN"): Promise<QueueDocument> {
  const parsedAt = new Date().toISOString();
  try {
    const body = await fs.readFile(filePath, "utf8");
    return parseQueueMarkdown(body, filePath, fallbackStatus);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        sourcePath: filePath,
        exists: false,
        items: [],
        summary: summarizeQueue([]),
        parsedAt,
      };
    }
    throw error;
  }
}
