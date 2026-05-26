# AgentLab Console

AgentLab Console is a local-only control panel for the Windows AgentLab workflow. It lets the AgentLab owner submit app ideas through the existing PowerShell queue workflow, inspect queue state, run health checks, launch the next queued item, review command output, browse generated apps, read `AGENT_REPORT.md` files, and copy important local paths.

## Stack

- Node.js, TypeScript, Express
- Vite, React, Tailwind CSS
- Controlled PowerShell child processes
- Local filesystem reads and local JSON command history

## Setup

Requirements:

- Node.js 20, 22, or 24+
- npm
- Windows PowerShell for approved AgentLab script actions

```powershell
npm install
```

Optional environment overrides can be placed in `.env` or set in the shell. Do not commit `.env`.

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `AGENTLAB_ROOT` | inferred checkout root | AgentLab root folder |
| `AGENTLAB_CONSOLE_HOST` | `127.0.0.1` | Bind host. `0.0.0.0` is rejected. |
| `AGENTLAB_CONSOLE_PORT` | `8787` | Local console port. Must be a plain integer from 1 to 65535. |
| `AGENTLAB_CODEX_SANDBOX` | `danger-full-access` | Sandbox passed to the approved Codex PowerShell scripts. |
| `AGENTLAB_HEARTBEAT_SECONDS` | `10` | Heartbeat interval for long-running agent passes. Must be a positive integer. |

## Run

```powershell
npm run dev
```

The Express API runs on `http://127.0.0.1:8787` by default. The Vite client runs on its local dev server and proxies `/api` to the configured `AGENTLAB_CONSOLE_HOST` and `AGENTLAB_CONSOLE_PORT`.

## Test

```powershell
npm test
```

## Build

```powershell
npm run build
npm start
```

`npm start` serves the compiled React app from the Express server.

## Validation

```powershell
npm run validate
```

The validation script runs the release checks in this order:

```powershell
npm run typecheck
npm test
npm run build
```

## Release / Deployment

This console is packaged for local Windows use. It is not designed for cloud hosting or remote network exposure.

### Prerequisites

- Windows with PowerShell available on `PATH`
- Node.js 20, 22, or 24+
- npm
- Existing AgentLab checkout with `queue\queue.md` and the approved PowerShell scripts

### Environment Variables

Copy `.env.example` to `.env` when local overrides are needed. Keep `.env` untracked.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AGENTLAB_ROOT` | No | Overrides the inferred AgentLab checkout root folder. |
| `AGENTLAB_CONSOLE_HOST` | No | Local bind host. Use `127.0.0.1`, `localhost`, or `::1`; `0.0.0.0` is rejected. |
| `AGENTLAB_CONSOLE_PORT` | No | Local console port. Defaults to `8787`; invalid numeric text is rejected at startup. |
| `AGENTLAB_CODEX_SANDBOX` | No | Sandbox value passed to approved AgentLab scripts. |
| `AGENTLAB_HEARTBEAT_SECONDS` | No | Positive integer heartbeat interval passed to long-running agent workflows. |

### Install

```powershell
npm install
```

### Development

```powershell
npm run dev
```

### Test

```powershell
npm run typecheck
npm test
```

### Release Validation

```powershell
npm run validate
```

### Build

```powershell
npm run build
```

### Package or Deploy

There is no separate cloud deploy command. Build the app, then run the local production server:

```powershell
npm run build
npm start
```

Open the console at:

```txt
http://127.0.0.1:8787
```

### Artifacts

Generated build artifacts are located at:

```txt
dist/server
dist/client
```

The production server entry point is:

```txt
dist/server/index.js
```

Runtime command history is stored locally in `command-history.json` and is intentionally ignored by Git.

### Known Deployment Limitations

- The server must remain local-only; do not bind it to `0.0.0.0`.
- PowerShell actions depend on the existing AgentLab scripts and active queue state.
- `POST /api/add-idea`, `POST /api/run-next`, and `POST /api/run-check` can mutate local AgentLab state or launch long-running workflows.
- Browser-level release validation is not currently automated.

### Troubleshooting

- If startup fails with a host error, unset `AGENTLAB_CONSOLE_HOST` or set it to `127.0.0.1`.
- If startup fails with a port or heartbeat error, set `AGENTLAB_CONSOLE_PORT` to an unused numeric local port and `AGENTLAB_HEARTBEAT_SECONDS` to a positive integer.
- If script actions fail, verify the AgentLab root and approved script paths exposed by `GET /api/paths`.
- If the UI loads but API calls fail in development, confirm both `npm run dev:server` and `npm run dev:client` are running through `npm run dev`.

## API

- `GET /api/health`
- `GET /api/queue`
- `GET /api/completed`
- `GET /api/failed`
- `POST /api/add-idea`
- `POST /api/run-next`
- `POST /api/run-check`
- `GET /api/paths`
- `GET /api/recent-apps`
- `GET /api/app-report/:appName`

Unknown `/api/*` routes return a JSON 404 response. Non-API routes fall back to the built React app in production.

## Security Model

This is a single-user local tool. The server binds to `127.0.0.1` by default, rejects `0.0.0.0`, exposes only explicit local API routes, prevents report path traversal, avoids secret-bearing files, and only runs approved AgentLab PowerShell scripts.

Approved script actions are serialized by the backend. If a script is already running, additional command requests return HTTP 409 until the active command finishes.

## Runtime Tools

The Apps / Reports panel lists normal generated apps from `AgentLab\apps` and also includes the console itself as the `agentlab-console` runtime tool from `agent-runtime\console`. The template artifact `apps\app-name` is ignored by the panel.

## Known Limitations

- The console depends on the existing AgentLab PowerShell scripts and queue markdown files.
- Script argument compatibility is best-effort because the scripts remain the source of truth.
- Queue parsing starts at `## Active Queue Items` and ignores queue examples in fenced code blocks.
