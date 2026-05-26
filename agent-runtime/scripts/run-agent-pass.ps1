param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("scaffolder", "builder", "tester", "refiner", "reviewer", "deployer", "orchestrator")]
    [string]$Agent,

    [Parameter(Mandatory=$true)]
    [string]$AppName,

    [Parameter(Mandatory=$true)]
    [string]$TaskText,

    [string]$Root = "",

    [string]$Sandbox = "workspace-write"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $PSCommandPath
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = (Resolve-Path (Join-Path $ScriptRoot "..\..")).Path
} else {
    $Root = (Resolve-Path $Root).Path
}

$RepoPath = Join-Path $Root "apps\$AppName"
$PromptFile = Join-Path $Root "agent-runtime\prompts\$Agent.md"
$InvokeScript = Join-Path $Root "agent-runtime\scripts\invoke-codex.ps1"

if (!(Test-Path $InvokeScript)) {
    throw "Missing invoke script: $InvokeScript"
}

if (!(Test-Path $PromptFile)) {
    throw "Missing prompt file: $PromptFile"
}

& $InvokeScript `
    -RepoPath $RepoPath `
    -PromptFile $PromptFile `
    -TaskText $TaskText `
    -Sandbox $Sandbox
