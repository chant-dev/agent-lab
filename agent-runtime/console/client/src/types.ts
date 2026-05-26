export type QueueStatus = "READY" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "FAILED" | "UNKNOWN";

export interface QueueItem {
  id: string;
  slug: string;
  name: string;
  status: QueueStatus;
  path: string | null;
  type: string | null;
  stack: string | null;
  priority: string | null;
  rawMarkdown: string;
  parsedAt: string;
}

export interface QueueSummary {
  readyCount: number;
  inProgressCount: number;
  blockedCount: number;
  doneCount: number;
  failedCount: number;
  totalCount: number;
}

export interface QueueDocument {
  sourcePath: string;
  exists: boolean;
  items: QueueItem[];
  summary: QueueSummary;
  parsedAt: string;
}

export interface CommandRun {
  id: string;
  action: "add-idea" | "run-next" | "run-check";
  mode: string | null;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  success: boolean;
  failureDetails: string | null;
}

export interface ActiveCommand {
  id: string;
  action: CommandRun["action"];
  mode: string | null;
  label: string;
  startedAt: string;
  stdoutTail: string;
  stderrTail: string;
}

export interface AppFolder {
  appName: string;
  path: string;
  kind: "app" | "runtime";
  hasAgentsMd: boolean;
  hasReadmeMd: boolean;
  hasAgentReportMd: boolean;
  lastModifiedAt: string;
}

export interface AgentLabPaths {
  root: string;
  queueFile: string;
  completedQueueFile: string;
  failedQueueFile: string;
  scriptsDir: string;
  promptsDir: string;
  docsDir: string;
  logsDir: string;
  appsDir: string;
  consoleDir: string;
}

export interface HealthResponse {
  ok: boolean;
  serverAddress: string;
  agentLabRoot: string;
  queueSummary: QueueSummary;
  lastCommand: CommandRun | null;
  activeCommand: ActiveCommand | null;
  checkedAt: string;
}
