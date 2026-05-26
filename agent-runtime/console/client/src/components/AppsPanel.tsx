import { useMemo, useState } from "react";
import type { AppFolder } from "../types";
import { Button, EmptyState, Panel, StatusBadge } from "./ui";

export function AppsPanel({
  apps,
  report,
  reportTitle,
  loading,
  onLoadReport,
}: {
  apps: AppFolder[];
  report: string;
  reportTitle: string | null;
  loading: boolean;
  onLoadReport: (appName: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return apps;
    return apps.filter((app) => [app.appName, app.kind, app.path].join(" ").toLowerCase().includes(value));
  }, [apps, search]);

  return (
    <Panel title="Apps and Reports">
      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter app folders"
            className="mb-3 h-10 w-full rounded-md border border-line bg-ink px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-accent"
          />
          {apps.length === 0 ? (
            <EmptyState title="No apps or runtime tools" detail="No app folders or AgentLab runtime tools are available at the discovered paths." />
          ) : filtered.length === 0 ? (
            <EmptyState title="No matching apps" detail="No app folders or runtime tools match the current filter." />
          ) : (
            <div className="max-h-[520px] space-y-2 overflow-auto pr-1">
              {filtered.map((app) => (
                <button
                  key={app.appName}
                  onClick={() => onLoadReport(app.appName)}
                  className="w-full rounded-md border border-line bg-panelSoft p-3 text-left transition hover:border-slate-500"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-slate-100">{app.appName}</span>
                        <span className="rounded border border-line px-2 py-1 text-[11px] font-semibold uppercase text-slate-400">{app.kind}</span>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">{app.path}</div>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(app.lastModifiedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <DocBadge label="AGENTS" present={app.hasAgentsMd} />
                    <DocBadge label="README" present={app.hasReadmeMd} />
                    <DocBadge label="REPORT" present={app.hasAgentReportMd} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-md border border-line bg-ink">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="font-medium text-slate-100">{reportTitle ?? "AGENT_REPORT.md"}</h3>
            {loading && <span className="text-sm text-slate-400">Loading report</span>}
          </div>
          {report ? <MarkdownLite markdown={report} /> : <EmptyState title="No report selected" detail="Select an app with AGENT_REPORT.md to inspect the builder report." />}
        </div>
      </div>
    </Panel>
  );
}

function DocBadge({ label, present }: { label: string; present: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className="text-slate-400">{label}</span>
      <StatusBadge status={present ? "PRESENT" : "MISSING"} />
    </span>
  );
}

function MarkdownLite({ markdown }: { markdown: string }) {
  return (
    <div className="max-h-[560px] overflow-auto p-4 text-sm leading-6 text-slate-300">
      {markdown.split(/\r?\n/).map((line, index) => {
        if (line.startsWith("# ")) return <h1 key={index} className="mb-3 mt-1 text-xl font-semibold text-white">{line.slice(2)}</h1>;
        if (line.startsWith("## ")) return <h2 key={index} className="mb-2 mt-5 text-base font-semibold text-slate-100">{line.slice(3)}</h2>;
        if (line.startsWith("- ")) return <div key={index} className="pl-3 text-slate-300">- {line.slice(2)}</div>;
        if (!line.trim()) return <div key={index} className="h-3" />;
        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}
