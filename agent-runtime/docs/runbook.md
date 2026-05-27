# AgentLab Runbook

This runbook explains how to use the AgentLab folder to run autonomous Codex development on Windows.

---

## Root Folder

```txt
<AGENTLAB_ROOT>
```

`<AGENTLAB_ROOT>` means the folder where this repository was cloned. The runtime scripts infer it automatically when they are run from `agent-runtime\scripts`.

---

## Main Folders

```txt
queue
apps
agent-runtime
```

### queue

Stores work items.

```txt
queue.md
completed.md
failed.md
```

### apps

Stores app repositories.

Each app should live in its own folder.

Example:

```txt
<AGENTLAB_ROOT>\apps\playlist-sync-desktop
```

### agent-runtime

Stores prompts, scripts, docs, and logs.

```txt
agent-runtime\prompts
agent-runtime\scripts
agent-runtime\docs
agent-runtime\logs
```

---

## Prompt Files

Expected prompt files:

```txt
queue-item-generator.md
scaffolder.md
builder.md
tester.md
refiner.md
reviewer.md
deployer.md
orchestrator.md
```

---

## Normal Workflow

Use this workflow for most apps:

1. Give rough app idea to Queue Item Generator Agent.
2. Queue Item Generator appends a `[READY]` item to `queue.md`.
3. Orchestrator selects a ready queue item.
4. Scaffolder prepares the app folder and BMAD-style artifact structure.
5. Analyst creates product context and assumptions.
6. Product Manager creates the PRD.
7. Architect creates architecture and project context.
8. Story Planner creates epics, stories, and implementation readiness.
9. Developer implements the first releasable version.
10. QA Reviewer validates and fixes issues.
11. Release Planner prepares release/package/deployment path.
12. Final Reviewer gives a release-readiness verdict.
13. Orchestrator moves task to `completed.md` or `failed.md`.

---

## Recommended Agent Sequence

```txt
Scaffolder
Analyst
Product Manager
Architect
Story Planner
Developer
QA Reviewer
Release Planner
Final Reviewer
```

---

## Full Production Agent Sequence

Use this for more serious apps:

```txt
Scaffolder
Analyst
Product Manager
UX Designer
Architect
Story Planner
Developer
QA Reviewer
Refiner
QA Reviewer
Release Planner
Final Reviewer
```

---

## Queue Item Lifecycle

### Ready

```md
## [READY] app-name
```

### In Progress

```md
## [IN_PROGRESS] app-name
```

### Done

```md
## [DONE] app-name
```

### Failed

```md
## [FAILED] app-name
```

### Blocked

```md
## [BLOCKED] app-name
```

---

## Completion Standard

An app is not considered complete unless:

- app folder exists
- Git repo exists
- AGENTS.md exists
- README.md exists
- AGENT_REPORT.md exists
- planning artifacts exist where practical
- primary feature is implemented or blocker documented
- validation commands were run where practical
- build/package path is documented
- secrets are not committed
- final Reviewer verdict is PASS or PASS WITH WARNINGS

---

## Safety Rules

Do not give agents access to unrelated folders.

Keep work inside:

```txt
<AGENTLAB_ROOT>
```

Do not commit:

```txt
.env
.env.*
real API keys
tokens
credentials
local secrets
```

Use `.env.example` for placeholder config names only.

---

## Git Rules

Each app should be a Git repo.

Useful commands:

```txt
git init
git status
git add .
git commit -m "message"
git checkout -b branch-name
```

Agents should commit meaningful checkpoints.

Do not force empty commits.

---

## Logs

Runtime logs should go under:

```txt
<AGENTLAB_ROOT>\agent-runtime\logs
```

Use dated folders where practical.

Example:

```txt
logs\2026-05-22
```

---

## Human Review Points

Even in zero-human-in-the-loop mode, these are good points to inspect later:

- AGENT_REPORT.md
- README.md
- final Reviewer verdict
- failed validation commands
- committed Git history
- .env.example
- package/deployment instructions

---

## Recovery

If an app run goes badly:

1. Open the app folder.
2. Read AGENT_REPORT.md.
3. Run `git status`.
4. Inspect latest commits.
5. Reset or branch if needed.
6. Move the queue item to failed.md if it cannot continue.
7. Rewrite the queue item if the task was too vague.

---

## Final Principle

The system should optimize for autonomous progress with honest reporting, not fake success.
