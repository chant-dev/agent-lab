# Failed or Blocked Agent Queue Items

This file stores queue items that failed, became blocked, or require human review.

When a task cannot continue, move the queue item from:

```txt
<AGENTLAB_ROOT>\queue\queue.md
```

to this file.

---

## Failure Record Format

Each failed or blocked task should include:

```md
## [FAILED] app-name
Failed Date:
Path:
Failure Stage:
Final Commit:
Summary:

Failure Reason:
Explain why the task failed.

Commands or Agents Involved:
- Builder:
- Tester:
- Refiner:
- Reviewer:
- Deployer:

Original Queue Item:
Paste or preserve the failed queue item here.

Recovery Notes:
- What should be tried next
- Whether credentials are needed
- Whether the app should be retried
- Whether the queue item should be rewritten
```

---

## Failed or Blocked Items
