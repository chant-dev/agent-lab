import express from "express";
import { ZodError } from "zod";
import { config } from "../config.js";
import { listRecentApps, readAppReport } from "../services/appService.js";
import { CommandAlreadyRunningError, getActiveCommand, historyService, runAddIdea, runAgentLabCheck, runNextQueueItem } from "../services/scriptService.js";
import { combineQueueSummaries, readQueueFile } from "../services/queueService.js";

export const apiRouter = express.Router();

apiRouter.get("/health", async (_req, res, next) => {
  try {
    const [queue, completed, failed] = await Promise.all([
      readQueueFile(config.paths.queueFile),
      readQueueFile(config.paths.completedQueueFile, "DONE"),
      readQueueFile(config.paths.failedQueueFile, "FAILED"),
    ]);
    const lastCommand = await historyService.last();
    res.json({
      ok: true,
      serverAddress: `http://${config.host}:${config.port}`,
      agentLabRoot: config.paths.root,
      queueSummary: combineQueueSummaries([queue.summary, completed.summary, failed.summary]),
      lastCommand: lastCommand ? summarizeCommandRun(lastCommand) : null,
      activeCommand: getActiveCommand(),
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/queue", async (_req, res, next) => {
  try {
    res.json(await readQueueFile(config.paths.queueFile));
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/completed", async (_req, res, next) => {
  try {
    res.json(await readQueueFile(config.paths.completedQueueFile, "DONE"));
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/failed", async (_req, res, next) => {
  try {
    res.json(await readQueueFile(config.paths.failedQueueFile, "FAILED"));
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/add-idea", async (req, res, next) => {
  try {
    const run = await runAddIdea(req.body);
    res.status(run.success ? 200 : 500).json(run);
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/run-next", async (req, res, next) => {
  try {
    const run = await runNextQueueItem(req.body);
    res.status(run.success ? 200 : 500).json(run);
  } catch (error) {
    next(error);
  }
});

apiRouter.post("/run-check", async (_req, res, next) => {
  try {
    const run = await runAgentLabCheck();
    res.status(run.success ? 200 : 500).json(run);
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/paths", (_req, res) => {
  res.json(config.paths);
});

apiRouter.get("/recent-apps", async (_req, res, next) => {
  try {
    res.json(await listRecentApps());
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/app-report/:appName", async (req, res, next) => {
  try {
    res.json(await readAppReport(req.params.appName));
  } catch (error) {
    next(error);
  }
});

apiRouter.get("/commands", async (_req, res, next) => {
  try {
    res.json(await historyService.list());
  } catch (error) {
    next(error);
  }
});

export interface ApiErrorResponse {
  status: number;
  body: { error: string; details?: unknown };
}

export function toApiErrorResponse(error: unknown): ApiErrorResponse {
  if (error instanceof ZodError) {
    return { status: 400, body: { error: "Validation failed", details: error.flatten() } };
  }

  if (isBodyParserError(error)) {
    return { status: 400, body: { error: "Malformed JSON request body." } };
  }

  if (isPayloadTooLargeError(error)) {
    return { status: 413, body: { error: "Request body is too large." } };
  }

  if (error instanceof CommandAlreadyRunningError) {
    return { status: 409, body: { error: error.message } };
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  const status = message.includes("Invalid app name") || message.includes("Unsupported run mode") ? 400 : 500;
  return { status, body: { error: message } };
}

export function apiErrorHandler(error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction): void {
  const response = toApiErrorResponse(error);
  res.status(response.status).json(response.body);
}

function isBodyParserError(error: unknown): boolean {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const details = error as SyntaxError & { status?: number; type?: string };
  return details.status === 400 && details.type === "entity.parse.failed";
}

function isPayloadTooLargeError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const details = error as { status?: number; statusCode?: number; type?: string };
  return (details.status === 413 || details.statusCode === 413) && details.type === "entity.too.large";
}

function summarizeCommandRun<T extends { stdout: string; stderr: string; failureDetails: string | null }>(run: T): T {
  return {
    ...run,
    stdout: "",
    stderr: "",
    failureDetails: run.failureDetails ? run.failureDetails.slice(0, 500) : null,
  };
}
