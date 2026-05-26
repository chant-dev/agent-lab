import type { AgentLabPaths, AppFolder, CommandRun, HealthResponse, QueueDocument } from "../types";

async function request<T extends object>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const body = await response.json().catch(() => null) as unknown;
  const hasBody = body !== null && typeof body === "object";
  if (!response.ok && !(hasBody && "id" in body)) {
    const message = hasBody && "error" in body && typeof body.error === "string"
      ? body.error
      : `Request failed with ${response.status}`;
    throw new Error(message);
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),
  queue: () => request<QueueDocument>("/api/queue"),
  completed: () => request<QueueDocument>("/api/completed"),
  failed: () => request<QueueDocument>("/api/failed"),
  paths: () => request<AgentLabPaths>("/api/paths"),
  commands: () => request<CommandRun[]>("/api/commands"),
  apps: () => request<AppFolder[]>("/api/recent-apps"),
  report: (appName: string) => request<{ appName: string; path: string; exists: boolean; markdown: string }>(`/api/app-report/${encodeURIComponent(appName)}`),
  addIdea: (payload: {
    idea: string;
    priority: string;
    appTypeHint: string;
    qualityLevel: string;
    buildMode: string;
  }) => request<CommandRun>("/api/add-idea", { method: "POST", body: JSON.stringify(payload) }),
  runNext: (mode: string) => request<CommandRun>("/api/run-next", { method: "POST", body: JSON.stringify({ mode }) }),
  runCheck: () => request<CommandRun>("/api/run-check", { method: "POST", body: JSON.stringify({}) }),
};
