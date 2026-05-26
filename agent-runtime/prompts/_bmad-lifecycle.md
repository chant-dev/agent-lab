# AgentLab BMAD Lifecycle Context

AgentLab adapts the BMAD Method lifecycle into a non-interactive queue runner. BMAD itself is an external MIT-licensed method and optional local skill install; AgentLab does not require vendored BMAD files to run.

When local BMAD skills exist under `.agents\skills`, use them as supporting context. If they are absent, follow the role instructions in the active prompt.

## Lifecycle

AgentLab uses these BMAD-aligned phases:

1. Analysis: clarify value, users, assumptions, risks, and feasibility.
2. Planning: turn the idea into a concrete PRD or product spine.
3. UX: define experience, screens, flows, and states when UI matters.
4. Architecture: make technical decisions explicit.
5. Story planning: break the work into implementable, testable slices.
6. Development: implement the smallest coherent release that satisfies the queue item.
7. QA and review: verify acceptance criteria, tests, risks, and regressions.
8. Release: document how to run, validate, package, and deploy.

## Artifact Locations

For each generated app, prefer this structure:

```txt
AGENTS.md
README.md
AGENT_REPORT.md
docs\
docs\planning\
docs\planning\product-brief.md
docs\planning\prd.md
docs\planning\ux.md
docs\planning\architecture.md
docs\planning\epics-and-stories.md
docs\planning\implementation-readiness.md
docs\project-context.md
docs\qa\
docs\qa\test-plan.md
docs\qa\review.md
```

Use `_bmad-output\...` only when the actual BMAD installer is present and the project already uses that convention. Otherwise, keep artifacts in `docs\` so a generated app remains simple and portable.

## Completion Standard

Do not claim success from intent. Use evidence:

- Files exist where documented.
- App runs or a concrete blocker is recorded.
- Tests/build/validation commands were run where practical.
- Failures are documented with command output and next action.
- No secrets or local runtime artifacts are committed.
- README and AGENT_REPORT reflect the current state.

## Non-Interactive Adaptation

BMAD is often collaborative and checkpoint-driven. In AgentLab batch mode:

- Make reasonable assumptions instead of stopping for ordinary product detail gaps.
- Stop only for true blockers: credentials, impossible requirements, unavailable external services, or destructive actions requiring human approval.
- Preserve tradeoffs in planning artifacts and AGENT_REPORT.
- Keep scope releasable. Prefer a smaller complete vertical slice over a broad incomplete shell.
