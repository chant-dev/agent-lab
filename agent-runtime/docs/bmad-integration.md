# BMAD Method Integration

AgentLab now uses a BMAD-aligned lifecycle for its automated queue runner while keeping BMAD Method itself as an optional local install.

BMAD Method is an external MIT-licensed project by BMad Code, LLC. AgentLab does not vendor the full BMAD installer output by default. Run the install script when you want local `.agents\skills` and `_bmad` files available to Codex and other supported tools.

## Install BMAD Locally

From the AgentLab root:

```powershell
.\agent-runtime\scripts\install-bmad-method.ps1
```

Default install settings:

```txt
Modules: bmm,tea
Tools: codex
Output: _bmad-output
```

Generated BMAD files are ignored by the root repository:

```txt
.agents\
_bmad\
_bmad-output\
```

This keeps AgentLab clone-ready without committing generated third-party installer output.

## AgentLab Pipeline Mapping

| AgentLab prompt | BMAD-aligned role |
| --- | --- |
| `scaffolder` | Project initializer |
| `analyst` | Analysis and product brief |
| `pm` | Product manager and PRD |
| `ux-designer` | UX planning |
| `architect` | Architecture and project context |
| `story-planner` | Epics, stories, and readiness |
| `dev` | Story implementation |
| `qa-reviewer` | Code review, QA, and test architecture |
| `refiner` | Correct-course and quality hardening |
| `deployer` | Release planning |
| `reviewer` | Final release verdict |

## Run Modes

Lightweight:

```txt
scaffolder -> analyst -> story-planner -> dev -> qa-reviewer -> reviewer
```

Standard:

```txt
scaffolder -> analyst -> pm -> architect -> story-planner -> dev -> qa-reviewer -> deployer -> reviewer
```

Production:

```txt
scaffolder -> analyst -> pm -> ux-designer -> architect -> story-planner -> dev -> qa-reviewer -> refiner -> qa-reviewer -> deployer -> reviewer
```

## Generated App Artifacts

AgentLab prompts ask generated apps to keep durable planning and QA artifacts under `docs\`:

```txt
docs\planning\product-brief.md
docs\planning\prd.md
docs\planning\ux.md
docs\planning\architecture.md
docs\planning\epics-and-stories.md
docs\planning\implementation-readiness.md
docs\project-context.md
docs\qa\test-plan.md
docs\qa\review.md
```

If a generated app has BMAD installed and already uses `_bmad-output`, agents may use that convention instead.
