import fs from "node:fs/promises";
import type { CommandRun } from "../types.js";

const MAX_HISTORY = 25;
const MAX_OUTPUT_CHARS = 40000;
const MAX_FAILURE_CHARS = 8000;
const ACTIONS = new Set<CommandRun["action"]>(["add-idea", "run-next", "run-check"]);

export class HistoryService {
  private history: CommandRun[] = [];
  private loaded = false;

  constructor(private readonly historyFile: string) {}

  async list(): Promise<CommandRun[]> {
    await this.load();
    return this.history.map(sanitizeCommandRun);
  }

  async last(): Promise<CommandRun | null> {
    await this.load();
    return this.history[0] ? sanitizeCommandRun(this.history[0]) : null;
  }

  async add(run: CommandRun): Promise<void> {
    await this.load();
    this.history = [sanitizeCommandRun(run), ...this.history].slice(0, MAX_HISTORY);
    await fs.writeFile(this.historyFile, JSON.stringify(this.history, null, 2), "utf8");
  }

  private async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    try {
      const body = await fs.readFile(this.historyFile, "utf8");
      const parsed = JSON.parse(body) as unknown;
      this.history = Array.isArray(parsed) ? parsed.filter(isCommandRun).map(sanitizeCommandRun).slice(0, MAX_HISTORY) : [];
    } catch {
      this.history = [];
    }
    this.loaded = true;
  }
}

function sanitizeCommandRun(run: CommandRun): CommandRun {
  return {
    ...run,
    stdout: truncate(run.stdout, MAX_OUTPUT_CHARS),
    stderr: truncate(run.stderr, MAX_OUTPUT_CHARS),
    failureDetails: run.failureDetails ? truncate(run.failureDetails, MAX_FAILURE_CHARS) : null,
  };
}

function truncate(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  const omitted = value.length - maxChars;
  return `[truncated ${omitted} chars]\n${value.slice(-maxChars)}`;
}

function isCommandRun(value: unknown): value is CommandRun {
  if (!value || typeof value !== "object") {
    return false;
  }

  const run = value as Partial<CommandRun>;
  return (
    typeof run.id === "string" &&
    typeof run.action === "string" &&
    ACTIONS.has(run.action as CommandRun["action"]) &&
    (typeof run.mode === "string" || run.mode === null) &&
    typeof run.stdout === "string" &&
    typeof run.stderr === "string" &&
    (typeof run.exitCode === "number" || run.exitCode === null) &&
    typeof run.startedAt === "string" &&
    typeof run.endedAt === "string" &&
    typeof run.durationMs === "number" &&
    typeof run.success === "boolean" &&
    (typeof run.failureDetails === "string" || run.failureDetails === null)
  );
}
