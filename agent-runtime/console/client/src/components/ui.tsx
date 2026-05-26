import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react";
import type { QueueStatus } from "../types";

export function Panel({ title, action, children }: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return (
    <section className="rounded-lg border border-line bg-panel/92 shadow-glow">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }>) {
  const variants = {
    primary: "border-accent/50 bg-accent/15 text-accent hover:bg-accent/20",
    secondary: "border-line bg-panelSoft text-slate-200 hover:border-slate-500",
    danger: "border-danger/60 bg-danger/15 text-rose-200 hover:bg-danger/25",
  };
  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: QueueStatus | "OK" | "ERROR" | "MISSING" | "PRESENT" }) {
  const styles: Record<string, string> = {
    READY: "border-accent/50 bg-accent/10 text-accent",
    IN_PROGRESS: "border-gold/50 bg-gold/10 text-gold",
    BLOCKED: "border-orange-400/50 bg-orange-400/10 text-orange-200",
    DONE: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
    FAILED: "border-danger/50 bg-danger/10 text-rose-200",
    UNKNOWN: "border-slate-500/50 bg-slate-500/10 text-slate-300",
    OK: "border-emerald-400/50 bg-emerald-400/10 text-emerald-200",
    ERROR: "border-danger/50 bg-danger/10 text-rose-200",
    MISSING: "border-danger/40 bg-danger/10 text-rose-200",
    PRESENT: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  };
  return <span className={`rounded border px-2 py-1 text-[11px] font-semibold uppercase ${styles[status]}`}>{status.replace("_", " ")}</span>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-md border border-dashed border-line bg-panelSoft/60 p-6 text-center">
      <div className="font-medium text-slate-200">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{detail}</div>
    </div>
  );
}

export function Field({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
