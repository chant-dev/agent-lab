# Parallel Agents Guide

This guide explains how to run multiple Codex agents against multiple apps without creating conflicts.

---

## Main Rule

Do not point two agents at the same app folder at the same time.

Safe:

```txt
Agent 1 -> apps\playlist-sync-desktop
Agent 2 -> apps\local-llm-discord-bot
Agent 3 -> apps\smart-calorie-tracker
```

Unsafe:

```txt
Agent 1 -> apps\playlist-sync-desktop
Agent 2 -> apps\playlist-sync-desktop
```

Two agents editing the same repo can overwrite each other, create merge conflicts, break builds, or produce confusing commits.

---

## Recommended Parallel Setup

Run one app per terminal.

Example:

```txt
Terminal 1: App A
Terminal 2: App B
Terminal 3: App C
```

Start with two apps maximum until the workflow is stable.

---

## Recommended Agent Limit

Start with:

```txt
2 parallel apps
```

Then increase to:

```txt
3 parallel apps
```

Only go higher if:

- your machine can handle the builds
- Codex CLI is stable
- logs are clear
- each app has separate folders
- you are not hitting rate limits or model usage issues

---

## Safe Parallel Layout

`<AGENTLAB_ROOT>` means the folder where this repository was cloned.

```txt
<AGENTLAB_ROOT>\apps\app-a
<AGENTLAB_ROOT>\apps\app-b
<AGENTLAB_ROOT>\apps\app-c
```

Each app should have:

```txt
AGENTS.md
README.md
AGENT_REPORT.md
.gitignore
```

Each app should be its own Git repo.

---

## Same-App Parallel Work

Only use same-app parallel work if you understand Git worktrees.

Example:

```txt
git worktree add <AGENTLAB_ROOT>\worktrees\app-feature-a feature-a
git worktree add <AGENTLAB_ROOT>\worktrees\app-feature-b feature-b
```

Then agents work in separate worktree folders.

Do not use this until the basic workflow works.

---

## Recommended Parallel Agent Roles

For multiple apps, run the full pipeline per app:

```txt
App A: Scaffolder -> Analyst -> PM -> Architect -> Story Planner -> Dev -> QA Reviewer -> Deployer -> Reviewer
App B: Scaffolder -> Analyst -> PM -> Architect -> Story Planner -> Dev -> QA Reviewer -> Deployer -> Reviewer
```

Avoid running Developer, QA Reviewer, and Refiner simultaneously on the same app.

---

## Queue Strategy

Use one shared queue file:

```txt
<AGENTLAB_ROOT>\queue\queue.md
```

But mark items clearly.

Before an agent starts:

```md
## [IN_PROGRESS] app-name
```

After completion:

```md
## [DONE] app-name
```

After failure:

```md
## [FAILED] app-name
```

After blocker:

```md
## [BLOCKED] app-name
```

---

## Branch Strategy

Each app should create branches for agent passes.

Examples:

```txt
agent/scaffolder-20260522-1015
agent/analyst-20260522-1020
agent/pm-20260522-1030
agent/architect-20260522-1045
agent/story-planner-20260522-1100
agent/dev-20260522-1115
agent/qa-reviewer-20260522-1145
agent/reviewer-20260522-1210
agent/deployer-20260522-1230
```

This makes rollback easier.

---

## Logging Strategy

Each parallel run should write logs to its own folder.

Example:

```txt
<AGENTLAB_ROOT>\agent-runtime\logs\2026-05-22\app-a
<AGENTLAB_ROOT>\agent-runtime\logs\2026-05-22\app-b
```

Logs should identify:

- app name
- agent role
- start time
- end time
- commands run
- final status

---

## Safety Rules

Agents should not:

- edit other app folders
- access unrelated user directories
- commit secrets
- delete the queue
- move files outside AgentLab
- run destructive system commands
- run deployment commands with real credentials unless explicitly configured

---

## When to Stop a Parallel Run

Stop or pause a run if:

- multiple apps fail from the same missing dependency
- Codex CLI starts producing repeated command failures
- the same queue item is picked up by two agents
- logs become unclear
- builds are fighting over shared ports
- disk usage grows too much
- a project starts writing outside its app folder

---

## Port Collision Rules

If multiple apps run local dev servers, avoid shared ports.

Common defaults that may collide:

```txt
3000
5173
8000
8080
1420
```

Agents should document port usage in README.md.

If a port is occupied, use a different port and document it.

---

## Final Principle

Parallel agents are useful only when they are isolated.

One app per folder.
One Git repo per app.
One active agent pipeline per app.
Clear logs.
Honest reports.
