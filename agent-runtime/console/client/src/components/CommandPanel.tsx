import { useState } from "react";
import type { CommandRun } from "../types";
import { Button, EmptyState, Panel, StatusBadge } from "./ui";

export function CommandPanel({
  commands,
  selected,
  onSelect,
  onRunCheck,
  busy,
  activeCommand,
}: {
  commands: CommandRun[];
  selected: CommandRun | null;
  onSelect: (run: CommandRun) => void;
  onRunCheck: () => Promise<boolean>;
  busy: boolean;
  activeCommand: { label: string; startedAt: string; stdoutTail: string; stderrTail: string } | null;
}) {
  const [tab, setTab] = useState<"stdout" | "stderr">("stdout");
  const [activeTab, setActiveTab] = useState<"stdout" | "stderr">("stderr");
  const [modal, setModal] = useState<null | { title: string; body: string; tone: "normal" | "danger" }>(null);
  const current = selected ?? commands[0] ?? null;
  const output = tab === "stdout" ? current?.stdout : current?.stderr;
  const activeOutput = activeTab === "stdout" ? activeCommand?.stdoutTail : activeCommand?.stderrTail;
  const hasFailure = Boolean(current?.failureDetails);
  const hasOutput = Boolean(current?.stdout?.trim() || current?.stderr?.trim());

  return (
    <Panel title="Command Output" action={<Button variant="secondary" onClick={onRunCheck} disabled={busy}>{busy ? "Running" : "Run health check"}</Button>}>
      {activeCommand && (
        <div className="mb-4 overflow-hidden rounded-md border border-gold/40 bg-gold/10 text-sm">
          <div className="flex flex-col gap-3 border-b border-gold/30 p-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="font-medium text-gold">{activeCommand.label}</div>
              <div className="mt-1 text-xs text-slate-300">
                Started {new Date(activeCommand.startedAt).toLocaleTimeString()}. Polling live output every second.
              </div>
            </div>
            <div className="grid w-full gap-2 sm:grid-cols-3 xl:w-auto">
              <Button className="w-full min-w-0" variant={activeTab === "stderr" ? "danger" : "secondary"} onClick={() => setActiveTab("stderr")}>Codex stream</Button>
              <Button className="w-full min-w-0" variant={activeTab === "stdout" ? "primary" : "secondary"} onClick={() => setActiveTab("stdout")}>Script output</Button>
              <Button
                className="w-full min-w-0"
                variant="secondary"
                onClick={() => setModal({
                  title: activeTab === "stderr" ? "Live Codex Stream" : "Live Script Output",
                  body: activeOutput?.trim() || "Waiting for live output from the running process...",
                  tone: activeTab === "stderr" ? "danger" : "normal",
                })}
              >
                Open live
              </Button>
            </div>
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre bg-ink p-4 text-xs leading-relaxed text-slate-200">
            {activeOutput?.trim() || "Waiting for live output from the running process..."}
          </pre>
        </div>
      )}
      {commands.length === 0 ? (
        <EmptyState title="No command history" detail="Run a health check, add an idea, or run the next queue item to record output." />
      ) : (
        <div className="space-y-4">
          <div className="max-h-48 space-y-2 overflow-auto rounded-md border border-line bg-ink/50 p-2">
            {commands.map((run) => (
              <button
                key={run.id}
                onClick={() => onSelect(run)}
                className={`w-full rounded-md border p-3 text-left transition ${current?.id === run.id ? "border-accent bg-accent/10" : "border-line bg-panelSoft hover:border-slate-500"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-slate-100">{run.action}</span>
                  <span className="shrink-0"><StatusBadge status={run.success ? "OK" : "ERROR"} /></span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{new Date(run.startedAt).toLocaleString()} - {run.durationMs}ms</div>
              </button>
            ))}
          </div>
          {current && (
            <div className="min-w-0 overflow-hidden rounded-md border border-line bg-ink">
              <div className="border-b border-line p-4">
                <div className="space-y-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">{current.action}</h3>
                      <StatusBadge status={current.success ? "OK" : "ERROR"} />
                    </div>
                    <div className="mt-2 grid gap-2 text-xs text-slate-400 sm:grid-cols-2 xl:grid-cols-4">
                      <span>Exit: {current.exitCode ?? "n/a"}</span>
                      <span>Mode: {current.mode ?? "n/a"}</span>
                      <span>Start: {new Date(current.startedAt).toLocaleTimeString()}</span>
                      <span>End: {new Date(current.endedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      className="w-full"
                      variant="secondary"
                      disabled={!hasOutput}
                      onClick={() => setModal({ title: "Command Output", body: formatCommandOutput(current), tone: "normal" })}
                    >
                      View full output
                    </Button>
                    {hasFailure && (
                      <Button
                        className="w-full"
                        variant="danger"
                        onClick={() => setModal({ title: "Failure Details", body: current.failureDetails ?? "", tone: "danger" })}
                      >
                        View error
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {hasFailure && (
                <div className="border-b border-danger/30 bg-danger/10 px-4 py-3 text-sm text-rose-200">
                  <div className="max-h-20 overflow-hidden whitespace-pre-wrap break-words">{current.failureDetails}</div>
                </div>
              )}
              <div className="grid gap-2 border-b border-line p-3 sm:grid-cols-2">
                <Button className="w-full" variant={tab === "stdout" ? "primary" : "secondary"} onClick={() => setTab("stdout")}>stdout preview</Button>
                <Button className="w-full" variant={tab === "stderr" ? "danger" : "secondary"} onClick={() => setTab("stderr")}>stderr preview</Button>
              </div>
              <pre className="max-h-80 overflow-auto whitespace-pre p-4 text-xs leading-relaxed text-slate-200">{output?.trim() || "No output."}</pre>
            </div>
          )}
        </div>
      )}
      {modal && <OutputModal title={modal.title} body={modal.body} tone={modal.tone} onClose={() => setModal(null)} />}
    </Panel>
  );
}

function formatCommandOutput(run: CommandRun): string {
  return [
    "## stdout",
    run.stdout.trim() || "No stdout.",
    "",
    "## stderr",
    run.stderr.trim() || "No stderr.",
  ].join("\n");
}

function OutputModal({
  title,
  body,
  tone,
  onClose,
}: {
  title: string;
  body: string;
  tone: "normal" | "danger";
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-glow">
        <div className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${tone === "danger" ? "border-danger/30" : "border-line"}`}>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">Full text is shown here so the main console stays compact.</p>
          </div>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
        <pre className="min-h-0 flex-1 overflow-auto whitespace-pre bg-ink p-4 text-xs leading-relaxed text-slate-200">
          {body.trim() || "No output."}
        </pre>
      </div>
    </div>
  );
}
