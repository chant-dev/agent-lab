import { useCallback, useEffect, useState } from "react";
import { api } from "./api/client";
import { resolveVisibleActiveCommand } from "./activeCommand";
import { AppsPanel } from "./components/AppsPanel";
import { CommandPanel } from "./components/CommandPanel";
import { IdeaLauncher } from "./components/IdeaLauncher";
import { PathsPanel } from "./components/PathsPanel";
import { QueueViewer } from "./components/QueueViewer";
import { StatusHeader } from "./components/StatusHeader";
import type { AgentLabPaths, AppFolder, CommandRun, HealthResponse, QueueDocument } from "./types";

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [queue, setQueue] = useState<QueueDocument | null>(null);
  const [completedQueue, setCompletedQueue] = useState<QueueDocument | null>(null);
  const [failedQueue, setFailedQueue] = useState<QueueDocument | null>(null);
  const [commands, setCommands] = useState<CommandRun[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<CommandRun | null>(null);
  const [apps, setApps] = useState<AppFolder[]>([]);
  const [paths, setPaths] = useState<AgentLabPaths | null>(null);
  const [report, setReport] = useState("");
  const [reportTitle, setReportTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ideaBusy, setIdeaBusy] = useState(false);
  const [commandBusy, setCommandBusy] = useState(false);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visibleActiveCommand = resolveVisibleActiveCommand(activeCommand, health?.activeCommand);
  const isCommandBusy = commandBusy || Boolean(health?.activeCommand);

  const refresh = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const [nextHealth, nextQueue, nextCompletedQueue, nextFailedQueue, nextCommands, nextApps, nextPaths] = await Promise.all([
        api.health(),
        api.queue(),
        api.completed(),
        api.failed(),
        api.commands(),
        api.apps(),
        api.paths(),
      ]);
      setHealth(nextHealth);
      setQueue(nextQueue);
      setCompletedQueue(nextCompletedQueue);
      setFailedQueue(nextFailedQueue);
      setCommands(nextCommands);
      setSelectedCommand((current) => current ?? nextCommands[0] ?? null);
      setApps(nextApps);
      setPaths(nextPaths);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to refresh console data.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!ideaBusy && !commandBusy && !health?.activeCommand) return;
    const interval = window.setInterval(() => {
      void refresh(false);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [ideaBusy, commandBusy, health?.activeCommand, refresh]);

  async function recordCommand(label: string, factory: () => Promise<CommandRun>): Promise<boolean> {
    setCommandBusy(true);
    setActiveCommand(label);
    setError(null);
    try {
      const run = await factory();
      setSelectedCommand(run);
      await refresh();
      if (!run.success) {
        setError(run.failureDetails ?? "Command failed.");
        return false;
      }
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Command failed.");
      return false;
    } finally {
      setCommandBusy(false);
      setActiveCommand(null);
    }
  }

  async function recordIdeaCommand(factory: () => Promise<CommandRun>): Promise<boolean> {
    setIdeaBusy(true);
    setError(null);
    try {
      const run = await factory();
      setSelectedCommand(run);
      await refresh();
      if (!run.success) {
        setError(run.failureDetails ?? "Idea submission failed.");
        return false;
      }
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Idea submission failed.");
      return false;
    } finally {
      setIdeaBusy(false);
    }
  }

  async function loadReport(appName: string) {
    setReportLoading(true);
    setError(null);
    try {
      const result = await api.report(appName);
      setReportTitle(`${appName} / AGENT_REPORT.md`);
      setReport(result.exists ? result.markdown : "AGENT_REPORT.md is not present for this app.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load report.");
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <StatusHeader health={health} loading={loading} error={error} activeCommand={visibleActiveCommand} onRefresh={() => refresh()} />
        <div className="grid gap-5 xl:grid-cols-[1fr_460px]">
          <IdeaLauncher busy={ideaBusy} onSubmit={(payload) => recordIdeaCommand(() => api.addIdea(payload))} />
          <CommandPanel
            commands={commands}
            selected={selectedCommand}
            onSelect={setSelectedCommand}
            onRunCheck={() => recordCommand("Running AgentLab health check", () => api.runCheck())}
            busy={isCommandBusy}
            activeCommand={visibleActiveCommand}
          />
        </div>
        <QueueViewer
          queue={queue}
          completedQueue={completedQueue}
          failedQueue={failedQueue}
          loading={loading}
          onRefresh={() => refresh()}
          onRunNext={(mode) => recordCommand(`Running next queue item (${mode})`, () => api.runNext(mode))}
          commandBusy={isCommandBusy}
        />
        <AppsPanel apps={apps} report={report} reportTitle={reportTitle} loading={reportLoading} onLoadReport={loadReport} />
        <PathsPanel paths={paths} />
      </div>
    </main>
  );
}
