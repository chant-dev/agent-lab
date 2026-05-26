# Agent Queue

This is the active work queue for autonomous Codex development.

Queue items should be created by the Queue Item Generator Agent and appended below this heading.

---

## Queue Status Meanings

### [READY]

The app or task is ready for an agent pipeline to pick up.

### [IN_PROGRESS]

An agent pipeline is currently working on the task.

### [BLOCKED]

The task cannot continue without credentials, missing software, unclear requirements, or another blocker.

### [DONE]

The task has completed its current pipeline run.

### [FAILED]

The task failed and needs human review or a later retry.

---

## Queue Item Template

`<AGENTLAB_ROOT>` means the folder where this repository was cloned. The queue generator should replace it with the actual checkout path when appending real queue items.

```md
## [READY] app-name
Path: <AGENTLAB_ROOT>\apps\app-name
Type: Desktop app / Web app / CLI tool / API service / Discord bot / Mobile app / Full-stack app
Stack: Recommended stack here
Priority: Medium
Refinement Passes: 3

Idea:
Plain-English summary of the user's original idea.

Goal:
Clear description of what the finished app should accomplish.

Target User:
Who the app is for and how they will use it.

User Experience:
Describe what using the app should feel like. Include expectations for polish, flow, speed, and usability.

Core Features:
- Feature 1
- Feature 2
- Feature 3
- Feature 4
- Feature 5

Nice-to-Have Features:
- Optional improvement 1
- Optional improvement 2
- Optional improvement 3

Non-Goals:
- Thing this app should not try to do yet
- Thing that would make the scope too large
- Thing that should be avoided

Recommended Architecture:
- Frontend:
- Backend:
- Storage:
- Auth:
- External APIs:
- Packaging/Deployment:

Data Model:
- Entity 1:
  - field
  - field
- Entity 2:
  - field
  - field

Required Screens or Interfaces:
- Screen/interface 1
- Screen/interface 2
- Screen/interface 3

Production Requirements:
- Must run locally on Windows
- Must use a scalable folder structure
- Must create an app-specific AGENTS.md before implementation begins
- Must create BMAD-style planning artifacts under docs\planning where practical
- Must include clear setup instructions
- Must include tests where practical
- Must include a build/package/deploy path
- Must not hardcode secrets
- Must include .env.example if environment variables are needed
- Must include meaningful error handling
- Must include loading, empty, success, and error states if UI exists

Validation Commands:
- install command
- lint command
- typecheck command
- test command
- build command
- package/deploy command if applicable

Secrets and Environment Variables:
- VARIABLE_NAME: what it is used for
- VARIABLE_NAME: what it is used for

Definition of Done:
- App works end-to-end for the primary use case
- Product brief, PRD, architecture, story plan, and QA review exist or are explicitly marked not applicable
- Validation commands pass or blockers are documented
- README includes setup, run, test, build, and package/deploy instructions
- .env.example exists if config is required
- No secrets are committed
- UI is polished and usable if applicable
- Core errors are handled gracefully
- App folder contains AGENTS.md with project-specific agent rules
- AGENT_REPORT.md
- Git commit is created when complete

Assumptions:
- Assumption 1
- Assumption 2
- Assumption 3

Agent Instructions:
Build this as a production-quality app, not a throwaway MVP. Prefer maintainable structure, clear boundaries, useful tests, and deployable/packageable output. Before writing application code, create or update AGENTS.md in the app folder. If implementation tradeoffs are required, document them in AGENT_REPORT.md. Do not ask for human input unless blocked by missing credentials, unavailable APIs, or impossible requirements.
```

---

## Active Queue Items
