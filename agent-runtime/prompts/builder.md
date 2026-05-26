# Legacy Builder Alias

This prompt is retained for backward compatibility. AgentLab's preferred BMAD-aligned implementation pass is `dev.md`.

Follow `dev.md` if it exists. If it cannot be read, act as the Developer pass:

- Read the queue item, AGENTS.md, README, AGENT_REPORT, and planning artifacts.
- Implement the first releasable version.
- Add tests where practical.
- Update README and AGENT_REPORT.
- Run validation commands where practical.
- Document blockers honestly.
