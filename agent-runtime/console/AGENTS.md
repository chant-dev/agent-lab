# AGENTS.md

## Project Goal

Build a production-quality local AgentLab Console for the Windows AgentLab workflow. The console is the owner-facing control panel for submitting rough app ideas, inspecting queue state, launching approved AgentLab PowerShell workflows, viewing command output, browsing generated app folders, reading reports, and finding important local paths.

The console must preserve the existing queue markdown and PowerShell script workflow. It is a control surface over local files and approved scripts, not a replacement orchestration system.

## Stack

- Runtime: Node.js with TypeScript
- Backend: Express, bound to `127.0.0.1` by default
- Frontend: Vite, React, TypeScript, Tailwind CSS
- Script integration: controlled PowerShell child processes only
- Storage: local filesystem reads plus optional JSON command history in this console folder
- External services: none

## Quality Bar

- Build maintainable production-oriented code, not a throwaway prototype.
- Keep frontend, backend, domain logic, services, types, and tests separated.
- Favor explicit schemas, validation, clear error responses, and typed API contracts.
- Provide polished loading, empty, success, and error states.
- Keep local runtime behavior repeatable through documented npm scripts.
- Document limitations and validation results in `AGENT_REPORT.md`.

## Agent Rules

- Build this as a production-quality app, not a throwaway MVP.
- Prefer maintainable architecture over single-file prototypes.
- Do not hardcode secrets, tokens, API keys, or credentials.
- Use environment variables and keep `.env.example` updated when configuration changes.
- Run validation commands before claiming completion.
- Update `README.md` when setup, usage, scripts, or behavior changes.
- Update `AGENT_REPORT.md` with implementation details, commands run, results, blockers, and next steps.

## Architecture Expectations

- Centralize configuration in `server/src/config.ts`, including AgentLab root, host, port, queue paths, scripts, and app paths.
- Backend route modules should delegate filesystem, parsing, script execution, app inspection, report reading, and path discovery to service modules.
- Never expose arbitrary file reads or arbitrary command execution.
- Frontend code should be organized into API clients, layout, feature panels, reusable UI components, and styles.
- Production `npm start` must serve the built frontend from Express.
- Shared data models should stay aligned with the queue item: `QueueItem`, `QueueSummary`, `CommandRun`, `AppFolder`, and `AgentLabPaths`.

## UI Expectations

- The first screen must immediately show API health, AgentLab root, queue counts, last command status, and primary actions.
- Use a dark, readable, responsive developer-console interface with clear hierarchy and restrained visual polish.
- Provide controlled actions for add idea, run next queue item, and health check.
- Show command stdout, stderr, exit code, start/end time, duration, success/failure, and failure details.
- Show app folder documentation badges for `AGENTS.md`, `README.md`, and `AGENT_REPORT.md`.
- Provide empty, loading, success, and error states for queue, commands, reports, and app lists.

## Testing Expectations

- Add meaningful tests for backend parsing, validation, path safety, and service logic where practical.
- Do not fake integration success for PowerShell scripts.
- If a command cannot run in the current environment, record the exact blocker and retry status in `AGENT_REPORT.md`.
- Never claim a validation command passed unless it actually ran and exited successfully.

## Validation Commands

Use these commands unless the package scripts define a stricter equivalent:

```powershell
npm install
npm run validate
npm run typecheck
npm run build
npm test
```

`npm run validate` is the release check and expands to typecheck, tests, and production build. `npm test` is required when tests are added. If a validation command cannot run because of the local environment, document that blocker in `AGENT_REPORT.md`.

## Security Rules

- Bind only to `127.0.0.1` by default. Reject `0.0.0.0` in normal operation.
- Do not add authentication or remote access.
- Never hardcode or commit secrets, tokens, credentials, or `.env`.
- Provide `.env.example` for supported environment variables.
- Do not expose `.env` contents or other secret-bearing files through the API.
- Validate all POST request payloads and reject unsupported run modes.
- Prevent path traversal when reading app reports or resolving app names.
- Only call approved local PowerShell scripts through controlled service methods: `add-idea-to-queue.ps1`, `run-next-queue-item.ps1`, and `check-agentlab.ps1`.
- Do not log sensitive environment values.

## Documentation Expectations

`README.md` must include:

- project overview
- stack
- setup instructions
- environment variables
- run, dev, test, typecheck, and build commands
- production start/package guidance
- known limitations

`AGENT_REPORT.md` must include:

- summary of changes
- files changed
- commands run and results
- test/build status
- blockers
- known limitations
- next recommended improvements

## Completion Requirements

- Console app exists under `agent-runtime/console`.
- `AGENTS.md`, `README.md`, `.env.example`, and `AGENT_REPORT.md` are present and project-specific.
- Backend exposes all required local API routes.
- Frontend connects to the backend and implements the required panels.
- Queue parsing, app folder inspection, path discovery, report reading, and command history are implemented.
- PowerShell integration calls approved scripts only and validates modes.
- Core errors are handled gracefully.
- Validation commands are run where possible and results are documented.
- A Git commit is created when the work is complete, unless the environment prevents git execution; any blocker must be recorded.
