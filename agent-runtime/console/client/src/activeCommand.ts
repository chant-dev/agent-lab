import type { ActiveCommand } from "./types";

export type VisibleActiveCommand = Pick<ActiveCommand, "label" | "startedAt" | "stdoutTail" | "stderrTail">;

export function resolveVisibleActiveCommand(
  localLabel: string | null,
  serverCommand: ActiveCommand | null | undefined,
): VisibleActiveCommand | null {
  if (serverCommand) {
    return {
      label: localLabel ?? serverCommand.label,
      startedAt: serverCommand.startedAt,
      stdoutTail: serverCommand.stdoutTail,
      stderrTail: serverCommand.stderrTail,
    };
  }

  if (localLabel) {
    return {
      label: localLabel,
      startedAt: new Date().toISOString(),
      stdoutTail: "",
      stderrTail: "",
    };
  }

  return null;
}
