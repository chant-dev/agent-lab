import { useMemo, useState } from "react";
import type { QueueDocument, QueueItem } from "../types";
import { Button, EmptyState, Panel, StatusBadge } from "./ui";

export function QueueViewer({
  queue,
  completedQueue,
  failedQueue,
  loading,
  onRefresh,
  onRunNext,
  commandBusy,
}: {
  queue: QueueDocument | null;
  completedQueue: QueueDocument | null;
  failedQueue: QueueDocument | null;
  loading: boolean;
  onRefresh: () => void;
  onRunNext: (mode: string) => Promise<boolean>;
  commandBusy: boolean;
}) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState("standard");
  const [archiveView, setArchiveView] = useState<"completed" | "failed">("completed");
  const allItems = queue?.items ?? [];
  const archiveItems = archiveView === "completed" ? (completedQueue?.items ?? []) : (failedQueue?.items ?? []);
  const archiveExists = archiveView === "completed" ? completedQueue?.exists : failedQueue?.exists;
  const items = useMemo(() => {
    return filterItems(allItems, search);
  }, [allItems, search]);
  const filteredArchiveItems = useMemo(() => filterItems(archiveItems, search), [archiveItems, search]);

  return (
    <Panel
      title="Queue Viewer"
      action={<Button variant="secondary" onClick={onRefresh} disabled={loading}>{loading ? "Loading" : "Refresh queue"}</Button>}
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter queue and archive items"
          className="h-10 flex-1 rounded-md border border-line bg-ink px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-accent"
        />
        <div className="flex gap-2">
          <select value={mode} onChange={(event) => setMode(event.target.value)} className="h-10 rounded-md border border-line bg-ink px-3 text-sm text-slate-100">
            <option value="lightweight">lightweight</option>
            <option value="standard">standard</option>
            <option value="production">production</option>
          </select>
          <Button onClick={() => onRunNext(mode)} disabled={commandBusy}>{commandBusy ? "Running" : "Run next"}</Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active work</h3>
            <span className="text-xs text-slate-500">{allItems.length} item{allItems.length === 1 ? "" : "s"}</span>
          </div>
          {!queue?.exists && <EmptyState title="Queue file not found" detail="The backend could not find the active queue markdown file at the discovered path." />}
          {queue?.exists && allItems.length === 0 && <EmptyState title="No active queue items" detail="The active queue file exists but does not contain runnable items yet." />}
          {queue?.exists && allItems.length > 0 && items.length === 0 && <EmptyState title="No matching queue items" detail="No active items match the current filter." />}
          <div className="space-y-3">
            {items.map((item) => <QueueItemCard key={item.id} item={item} />)}
          </div>
        </section>

        <section className="rounded-md border border-line bg-ink/35 p-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Archive</h3>
              <p className="mt-1 text-xs text-slate-500">Completed and failed queue records stay here after leaving active work.</p>
            </div>
            <div className="grid grid-cols-2 rounded-md border border-line bg-panelSoft p-1 text-sm">
              <button
                type="button"
                onClick={() => setArchiveView("completed")}
                className={`rounded px-3 py-1.5 transition ${archiveView === "completed" ? "bg-emerald-400/15 text-emerald-200" : "text-slate-400 hover:text-slate-200"}`}
              >
                Done {completedQueue?.summary.doneCount ?? 0}
              </button>
              <button
                type="button"
                onClick={() => setArchiveView("failed")}
                className={`rounded px-3 py-1.5 transition ${archiveView === "failed" ? "bg-danger/15 text-rose-200" : "text-slate-400 hover:text-slate-200"}`}
              >
                Failed {failedQueue?.summary.failedCount ?? 0}
              </button>
            </div>
          </div>
          {!archiveExists && (
            <EmptyState
              title={archiveView === "completed" ? "Completed queue not found" : "Failed queue not found"}
              detail="The backend could not find this archive markdown file at the discovered path."
            />
          )}
          {archiveExists && archiveItems.length === 0 && (
            <EmptyState
              title={archiveView === "completed" ? "No completed items" : "No failed items"}
              detail={archiveView === "completed" ? "Successful runs will appear here after the runner archives them." : "Failed or blocked runs will appear here when archived."}
            />
          )}
          {archiveExists && archiveItems.length > 0 && filteredArchiveItems.length === 0 && (
            <EmptyState title="No matching archive items" detail="No archived items match the current filter." />
          )}
          <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
            {filteredArchiveItems.map((item) => <QueueItemCard key={item.id} item={item} compact />)}
          </div>
        </section>
      </div>
    </Panel>
  );
}

function filterItems(items: QueueItem[], search: string): QueueItem[] {
  const value = search.trim().toLowerCase();
  if (!value) return items;
  return items.filter((item) =>
    [item.name, item.status, item.type, item.stack, item.priority, item.path].filter(Boolean).join(" ").toLowerCase().includes(value),
  );
}

function QueueItemCard({ item, compact = false }: { item: QueueItem; compact?: boolean }) {
  return (
    <article className={`rounded-md border border-line bg-panelSoft ${compact ? "p-3" : "p-4"}`}>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="break-words font-semibold text-slate-100">{item.name}</h3>
            <StatusBadge status={item.status} />
            {item.priority && <span className="rounded border border-line px-2 py-1 text-[11px] uppercase text-slate-400">{item.priority}</span>}
          </div>
          <div className="mt-2 flex flex-col gap-1 text-sm text-slate-400">
            {item.type && <span className="break-words">{item.type}</span>}
            {item.stack && !compact && <span className="break-words">{item.stack}</span>}
            {item.path && <span className="break-all text-slate-500">{item.path}</span>}
          </div>
        </div>
        <time className="shrink-0 text-xs text-slate-500">{new Date(item.parsedAt).toLocaleString()}</time>
      </div>
    </article>
  );
}
