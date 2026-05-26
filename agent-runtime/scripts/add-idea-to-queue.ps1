param(
    [Parameter(Mandatory=$true)]
    [string]$Idea,

    [string]$Root = "",

    [string]$Sandbox = "workspace-write",

    [int]$HeartbeatSeconds = 15,

    [ValidateSet("Low", "Medium", "High", "Critical")]
    [string]$Priority = "Medium",

    [string]$AppTypeHint = "Other",

    [string]$QualityLevel = "Standard",

    [ValidateSet("lightweight", "standard", "production")]
    [string]$BuildMode = "standard"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $PSCommandPath
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = (Resolve-Path (Join-Path $ScriptRoot "..\..")).Path
} else {
    $Root = (Resolve-Path $Root).Path
}

. (Join-Path $ScriptRoot "codex-process.ps1")

$PromptFile = Join-Path $Root "agent-runtime\prompts\queue-item-generator.md"
$QueueFile = Join-Path $Root "queue\queue.md"
$AppsDir = Join-Path $Root "apps"

if (!(Get-Command codex -ErrorAction SilentlyContinue)) {
    throw "Codex CLI was not found. Make sure Codex CLI is installed and available in PATH."
}

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

# Runtime Paths

Use these discovered paths for this run. They override any placeholder examples in the base prompt.

- AgentLab root: $Root
- Queue file: $QueueFile
- Apps folder: $AppsDir

---

# User App Idea

Take this idea and add it to the queue:

$Idea

Selected metadata:
- Priority: $Priority
- App type hint: $AppTypeHint
- Quality level: $QualityLevel
- Build mode: $BuildMode

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
    $Result = Invoke-CodexExec `
        -InputText $Task `
        -Sandbox $Sandbox `
        -Label "queue-item-generator" `
        -HeartbeatSeconds $HeartbeatSeconds

    if ($Result.ExitCode -ne 0) {
        Write-Host "Codex failed while generating the queue item."
        exit $Result.ExitCode
    }

    Write-Host ""
    Write-Host "Idea submitted to Queue Item Generator."
    Write-Host "Check queue file:"
    Write-Host $QueueFile
}
finally {
    Pop-Location
}
