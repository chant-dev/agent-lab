param(
    [Parameter(Mandatory=$true)]
    [string]$Idea,

    [string]$Root = "C:\Users\danie\Documents\codex-tests\AgentLab",

    [string]$Sandbox = "workspace-write"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$PromptFile = Join-Path $Root "agent-runtime\prompts\queue-item-generator.md"
$QueueFile = Join-Path $Root "queue\queue.md"

if (!(Test-Path $PromptFile)) {
    throw "Missing queue item generator prompt: $PromptFile"
}

if (!(Test-Path $QueueFile)) {
    New-Item -ItemType Directory -Path (Split-Path $QueueFile) -Force | Out-Null
    "# Agent Queue`n`n---`n`n## Active Queue Items`n" | Set-Content -Path $QueueFile -Encoding UTF8
}

$Prompt = Get-Content $PromptFile -Raw

$Task = @"
$Prompt

---

# User App Idea

Take this idea and add it to the queue:

$Idea

Remember:
- Do not build the app.
- Append a complete queue item to:
  $QueueFile
- Use [READY] status.
- Make reasonable assumptions.
- Include the AGENTS.md requirement.
"@

Push-Location $Root

try {
    $Task | codex exec --sandbox $Sandbox -
    Write-Host "Idea submitted to Queue Item Generator."
    Write-Host "Check queue file:"
    Write-Host $QueueFile
}
finally {
    Pop-Location
}
