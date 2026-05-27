param(
    [string]$Root = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$ScriptRoot = Split-Path -Parent $PSCommandPath
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = (Resolve-Path (Join-Path $ScriptRoot "..\..")).Path
} else {
    $Root = (Resolve-Path $Root).Path
}

$RequiredPaths = @(
    "README.md",
    ".gitignore",

    "queue\queue.md",
    "queue\completed.md",
    "queue\failed.md",

    "apps",

    "agent-runtime\prompts\queue-item-generator.md",
    "agent-runtime\prompts\_bmad-lifecycle.md",
    "agent-runtime\prompts\scaffolder.md",
    "agent-runtime\prompts\analyst.md",
    "agent-runtime\prompts\pm.md",
    "agent-runtime\prompts\ux-designer.md",
    "agent-runtime\prompts\architect.md",
    "agent-runtime\prompts\story-planner.md",
    "agent-runtime\prompts\dev.md",
    "agent-runtime\prompts\qa-reviewer.md",
    "agent-runtime\prompts\builder.md",
    "agent-runtime\prompts\tester.md",
    "agent-runtime\prompts\refiner.md",
    "agent-runtime\prompts\reviewer.md",
    "agent-runtime\prompts\deployer.md",
    "agent-runtime\prompts\orchestrator.md",

    "agent-runtime\docs\runbook.md",
    "agent-runtime\docs\parallel-agents.md",
    "agent-runtime\docs\bmad-integration.md",

    "agent-runtime\console\package.json",
    "agent-runtime\console\README.md",
    "agent-runtime\console\server\src\config.ts",
    "agent-runtime\console\client\src\App.tsx",

    "agent-runtime\scripts\invoke-codex.ps1",
    "agent-runtime\scripts\codex-process.ps1",
    "agent-runtime\scripts\install-bmad-method.ps1",
    "agent-runtime\scripts\add-idea-to-queue.ps1",
    "agent-runtime\scripts\run-agent-pass.ps1",
    "agent-runtime\scripts\run-next-queue-item.ps1",
    "agent-runtime\scripts\check-agentlab.ps1"
)

$Missing = @()

foreach ($RelativePath in $RequiredPaths) {
    $FullPath = Join-Path $Root $RelativePath

    if (!(Test-Path $FullPath)) {
        $Missing += $RelativePath
    }
}

Write-Host ""
Write-Host "AgentLab readiness check"
Write-Host "Root: $Root"
Write-Host ""

if ($Missing.Count -eq 0) {
    Write-Host "READY: All required files/folders exist."
} else {
    Write-Host "NOT READY: Missing items:"
    foreach ($Item in $Missing) {
        Write-Host "- $Item"
    }
}

Write-Host ""

if (Get-Command codex -ErrorAction SilentlyContinue) {
    Write-Host "Codex CLI: FOUND"
} else {
    Write-Host "Codex CLI: NOT FOUND"
}

if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "Git: FOUND"
} else {
    Write-Host "Git: NOT FOUND"
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    Write-Host "npm: FOUND"
} else {
    Write-Host "npm: NOT FOUND"
}

if (Test-Path (Join-Path $Root ".agents\skills\bmad-agent-dev\SKILL.md")) {
    Write-Host "BMAD Method skills: FOUND"
} else {
    Write-Host "BMAD Method skills: OPTIONAL - run agent-runtime\scripts\install-bmad-method.ps1 to install local BMAD skills"
}

Write-Host ""
