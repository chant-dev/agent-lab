import type { HealthResponse } from "../types";
import { Button, StatusBadge } from "./ui";

export function StatusHeader({
  health,
  loading,
  error,
  activeCommand,
  onRefresh,
}: {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  activeCommand: { label: string } | null;
  onRefresh: () => void;
}) {
  const summary = health?.queueSummary;
  return (
    <header className="rounded-lg border border-line bg-panel/95 p-5 shadow-glow">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">AgentLab Console</h1>
            <StatusBadge status={error ? "ERROR" : health?.ok ? "OK" : "UNKNOWN"} />
          </div>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Local control panel for queue intake, script execution, app reports, and AgentLab runtime paths.
          </p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
            <span className="truncate">Server: {health?.serverAddress ?? "checking..."}</span>
            <span className="truncate">Root: {health?.agentLabRoot ?? "checking..."}</span>
            <span className="truncate">
              Last command: {health?.lastCommand ? `${health.lastCommand.action} (${health.lastCommand.success ? "success" : "failed"})` : "none"}
            </span>
            <span className="truncate">Checked: {health?.checkedAt ? new Date(health.checkedAt).toLocaleString() : "pending"}</span>
          </div>
          {error && <div className="mt-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-rose-200">{error}</div>}
          {activeCommand && (
            <div className="mt-3 rounded-md border border-gold/40 bg-gold/10 px-3 py-2 text-sm text-gold">
              {activeCommand.label}. Auto-refreshing queue and Codex output every second.
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={onRefresh} disabled={loading}>{loading ? "Refreshing" : "Refresh"}</Button>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Metric label="Ready" value={summary?.readyCount ?? 0} />
        <Metric label="In progress" value={summary?.inProgressCount ?? 0} />
        <Metric label="Blocked" value={summary?.blockedCount ?? 0} />
        <Metric label="Done" value={summary?.doneCount ?? 0} />
        <Metric label="Failed" value={summary?.failedCount ?? 0} />
        <Metric label="Total" value={summary?.totalCount ?? 0} />
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-panelSoft p-3">
      <div className="text-xs uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
