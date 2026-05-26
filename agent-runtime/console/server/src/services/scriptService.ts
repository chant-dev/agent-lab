import fs from "node:fs";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { ActiveCommand, CommandRun } from "../types.js";
import { config } from "../config.js";
import { HistoryService } from "./historyService.js";

export const runModes = ["lightweight", "standard", "production"] as const;

export const addIdeaSchema = z.object({
  idea: z.string().trim().min(10).max(8000),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  appTypeHint: z.enum(["Full-stack app", "Frontend app", "Backend service", "CLI tool", "Desktop app", "Automation script", "Other"]),
  qualityLevel: z.enum(["Standard", "Production", "Experimental"]),
  buildMode: z.enum(runModes),
});

export const runNextSchema = z.object({
  mode: z.enum(runModes),
});

export const historyService = new HistoryService(config.historyFile);
type CommandSlot = "build" | "intake" | "utility";

let activeBuildCommand: ActiveCommand | null = null;
let activeIntakeCommand: ActiveCommand | null = null;
let activeUtilityCommand: ActiveCommand | null = null;
const ACTIVE_TAIL_CHARS = 12000;

export class CommandAlreadyRunningError extends Error {
  constructor(command: ActiveCommand, slot = "command") {
    super(`Another AgentLab ${slot} is already running: ${command.label}. Wait for it to finish before starting another ${slot}.`);
    this.name = "CommandAlreadyRunningError";
  }
}

export function validateRunMode(value: unknown): string {
  const parsed = z.enum(runModes).safeParse(value);
  if (!parsed.success) {
    throw new Error("Unsupported run mode. Use lightweight, standard, or production.");
  }
  return parsed.data;
}

export function getActiveCommand(): ActiveCommand | null {
  return activeBuildCommand ?? activeIntakeCommand ?? activeUtilityCommand;
}

export async function runAddIdea(input: z.infer<typeof addIdeaSchema>): Promise<CommandRun> {
  const data = addIdeaSchema.parse(input);
  return runApprovedScript("add-idea", config.scripts.addIdea, null, buildAddIdeaScriptArgs(data), "intake");
}

export function buildAddIdeaScriptArgs(data: z.infer<typeof addIdeaSchema>): string[] {
  return [
    "-Root", config.paths.root,
    "-Idea", data.idea,
    "-Sandbox", config.scriptRuntime.codexSandbox,
    "-HeartbeatSeconds", String(config.scriptRuntime.heartbeatSeconds),
    "-Priority", data.priority,
    "-AppTypeHint", data.appTypeHint,
    "-QualityLevel", data.qualityLevel,
    "-BuildMode", data.buildMode,
  ];
}

export async function runNextQueueItem(input: z.infer<typeof runNextSchema>): Promise<CommandRun> {
  const data = runNextSchema.parse(input);
  const mode = validateRunMode(data.mode);
  return runApprovedScript("run-next", config.scripts.runNext, mode, buildRunNextScriptArgs(mode), "build");
}

export function buildRunNextScriptArgs(mode: string): string[] {
  const validatedMode = validateRunMode(mode);
  return [
    "-Root", config.paths.root,
    "-Mode", validatedMode,
    "-Sandbox", config.scriptRuntime.codexSandbox,
    "-HeartbeatSeconds", String(config.scriptRuntime.heartbeatSeconds),
  ];
}

export async function runAgentLabCheck(): Promise<CommandRun> {
  return runApprovedScript("run-check", config.scripts.checkAgentLab, null, buildCheckScriptArgs(), "utility");
}

export function buildCheckScriptArgs(): string[] {
  return ["-Root", config.paths.root];
}

function runApprovedScript(
  action: CommandRun["action"],
  scriptPath: string,
  mode: string | null,
  scriptArgs: string[],
  slot: CommandSlot,
): Promise<CommandRun> {
  const activeSlotCommand = getActiveSlotCommand(slot);
  if (activeSlotCommand) {
    throw new CommandAlreadyRunningError(activeSlotCommand, slot);
  }

  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const runId = randomUUID();
  setActiveSlotCommand(slot, {
    id: runId,
    action,
    mode,
    label: mode ? `${action} (${mode})` : action,
    startedAt,
    stdoutTail: "",
    stderrTail: "",
  });

  if (!fs.existsSync(scriptPath)) {
    const endedAt = new Date().toISOString();
    const run: CommandRun = {
      id: runId,
      action,
      mode,
      stdout: "",
      stderr: `Script not found: ${scriptPath}`,
      exitCode: null,
      startedAt,
      endedAt,
      durationMs: Date.now() - started,
      success: false,
      failureDetails: "Approved script could not be found.",
    };
    setActiveSlotCommand(slot, null);
    return persistCommandRun(run).then(() => run);
  }

  return new Promise((resolve) => {
    const args = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, ...scriptArgs];
    const child = spawn("powershell.exe", args, {
      cwd: config.paths.root,
      windowsHide: true,
      env: {
        ...process.env,
        AGENTLAB_ROOT: config.paths.root,
      },
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    child.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stdout += text;
      appendActiveOutput(slot, "stdout", text);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      stderr += text;
      appendActiveOutput(slot, "stderr", text);
    });

    child.on("error", (error) => {
      finish(null, error);
    });

    child.on("close", (exitCode) => {
      finish(exitCode, null);
    });

    function finish(exitCode: number | null, processError: Error | null): void {
      if (settled) {
        return;
      }
      settled = true;

      if (processError) {
        const text = `${stderr ? "\n" : ""}${processError.message}`;
        stderr += text;
        appendActiveOutput(slot, "stderr", text);
      }

      const ended = Date.now();
      const run: CommandRun = {
        id: runId,
        action,
        mode,
        stdout,
        stderr,
        exitCode,
        startedAt,
        endedAt: new Date(ended).toISOString(),
        durationMs: ended - started,
        success: exitCode === 0 && !processError,
        failureDetails: exitCode === 0 && !processError ? null : stderr || stdout || "Command exited with a non-zero status.",
      };
      persistCommandRun(run).finally(() => {
        setActiveSlotCommand(slot, null);
        resolve(run);
      });
    }
  });
}

async function persistCommandRun(run: CommandRun): Promise<void> {
  try {
    await historyService.add(run);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown history persistence error.";
    console.warn(`Could not persist AgentLab command history for ${run.action}: ${message}`);
  }
}

function getActiveSlotCommand(slot: CommandSlot): ActiveCommand | null {
  if (slot === "build") {
    return activeBuildCommand;
  }
  if (slot === "intake") {
    return activeIntakeCommand;
  }
  return activeUtilityCommand;
}

function setActiveSlotCommand(slot: CommandSlot, command: ActiveCommand | null): void {
  if (slot === "build") {
    activeBuildCommand = command;
    return;
  }
  if (slot === "intake") {
    activeIntakeCommand = command;
    return;
  }
  activeUtilityCommand = command;
}

function appendActiveOutput(slot: CommandSlot, stream: "stdout" | "stderr", text: string): void {
  const command = getActiveSlotCommand(slot);
  if (!command) {
    return;
  }

  const key = stream === "stdout" ? "stdoutTail" : "stderrTail";
  setActiveSlotCommand(slot, {
    ...command,
    [key]: (command[key] + text).slice(-ACTIVE_TAIL_CHARS),
  });
}
