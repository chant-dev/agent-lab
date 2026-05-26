import { useEffect, useState } from "react";
import type { AgentLabPaths } from "../types";
import { Button, EmptyState, Panel } from "./ui";

const labels: Array<[keyof AgentLabPaths, string]> = [
  ["root", "AgentLab root"],
  ["queueFile", "Active queue"],
  ["completedQueueFile", "Completed queue"],
  ["failedQueueFile", "Failed queue"],
  ["scriptsDir", "Scripts"],
  ["promptsDir", "Prompts"],
  ["docsDir", "Docs"],
  ["logsDir", "Logs"],
  ["appsDir", "Apps"],
  ["consoleDir", "Console"],
];

export function PathsPanel({ paths }: { paths: AgentLabPaths | null }) {
  const [copiedKey, setCopiedKey] = useState<keyof AgentLabPaths | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedKey && !copyError) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCopiedKey(null);
      setCopyError(null);
    }, 1600);
    return () => window.clearTimeout(timeout);
  }, [copiedKey, copyError]);

  async function copy(key: keyof AgentLabPaths, value: string) {
    try {
      if (!navigator.clipboard) {
        throw new Error("Clipboard API unavailable.");
      }
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setCopyError(null);
    } catch {
      setCopiedKey(null);
      setCopyError(`Could not copy ${labelFor(key)}.`);
    }
  }

  return (
    <Panel title="Paths and Docs">
      {!paths ? (
        <EmptyState title="Paths unavailable" detail="The backend has not returned AgentLab path discovery yet." />
      ) : (
        <>
          {copyError && <div className="mb-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-rose-200" role="status">{copyError}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            {labels.map(([key, label]) => (
              <div key={key} className="rounded-md border border-line bg-panelSoft p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
                  <Button className="w-20" variant="secondary" onClick={() => copy(key, paths[key])}>{copiedKey === key ? "Copied" : "Copy"}</Button>
                </div>
                <code className="block break-all rounded bg-ink px-2 py-2 text-xs text-slate-300">{paths[key]}</code>
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

function labelFor(key: keyof AgentLabPaths): string {
  return labels.find(([candidate]) => candidate === key)?.[1].toLowerCase() ?? "path";
}
