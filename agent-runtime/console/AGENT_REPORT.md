# Agent Report

## Current State

AgentLab Console is a local-only React/Express control panel for the AgentLab workflow. It reads queue markdown files, lists generated app folders, displays app reports, launches approved AgentLab PowerShell scripts, and records local command output.

## Runtime Model

- Backend: Node.js, TypeScript, Express
- Frontend: Vite, React, Tailwind CSS
- Script execution: controlled PowerShell child processes
- Storage: local filesystem and ignored `command-history.json`
- Network exposure: local loopback only

## Clone-Ready Notes

- The console now infers the AgentLab root from its repository location by default.
- `AGENTLAB_ROOT` remains available as an optional override.
- `AGENTLAB_CONSOLE_HOST` defaults to `127.0.0.1` and rejects non-local bind hosts.
- Runtime logs, command history, `.env`, build output, and dependencies are ignored by Git.

## Validation

Run from `agent-runtime\console`:

```powershell
npm install
npm run typecheck
npm test
npm run build
```

Run from the AgentLab root:

```powershell
.\agent-runtime\scripts\check-agentlab.ps1
```

## Known Limitations

- Mutating queue actions depend on the configured local Codex CLI and current queue state.
- Browser-level UI automation is not part of the current validation suite.
- The console is intentionally single-user and local-only, not a hosted web service.
