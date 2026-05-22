param(
    [string]$Root = "C:\Users\danie\Documents\codex-tests\AgentLab",

    [string]$Sandbox = "workspace-write",

    [ValidateSet("lightweight", "standard", "production")]
    [string]$Mode = "standard"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$QueueFile = Join-Path $Root "queue\queue.md"
$InvokeScript = Join-Path $Root "agent-runtime\scripts\invoke-codex.ps1"

if (!(Test-Path $QueueFile)) {
    throw "Missing queue file: $QueueFile"
}

if (!(Test-Path $InvokeScript)) {
    throw "Missing invoke script: $InvokeScript"
}

$QueueText = Get-Content $QueueFile -Raw

$Pattern = "(?ms)^## \[READY\] (?<Name>.+?)\r?\n(?<Body>.*?)(?=^## \[|\z)"
$Match = [regex]::Match($QueueText, $Pattern)

if (!$Match.Success) {
    Write-Host "No [READY] queue items found."
    exit 0
}

$AppName = $Match.Groups["Name"].Value.Trim()
$Body = $Match.Groups["Body"].Value.Trim()
$FullItem = "## [READY] $AppName`n$Body"

$PathMatch = [regex]::Match($Body, "Path:\s*(?<Path>.+)")
if (!$PathMatch.Success) {
    throw "Queue item does not contain a Path field."
}

$RepoPath = $PathMatch.Groups["Path"].Value.Trim()

Write-Host "Selected queue item:"
Write-Host $AppName
Write-Host "Repo:"
Write-Host $RepoPath

$InProgressItem = $FullItem -replace "^## \[READY\]", "## [IN_PROGRESS]"
$UpdatedQueueText = $QueueText.Replace($FullItem, $InProgressItem)
$UpdatedQueueText | Set-Content -Path $QueueFile -Encoding UTF8

switch ($Mode) {
    "lightweight" {
        $Agents = @("scaffolder", "builder", "tester", "reviewer")
    }
    "standard" {
        $Agents = @("scaffolder", "builder", "tester", "refiner", "tester", "reviewer", "deployer", "reviewer")
    }
    "production" {
        $Agents = @("scaffolder", "builder", "tester", "refiner", "tester", "refiner", "tester", "reviewer", "deployer", "reviewer")
    }
}

foreach ($Agent in $Agents) {
    $PromptFile = Join-Path $Root "agent-runtime\prompts\$Agent.md"

    if (!(Test-Path $PromptFile)) {
        throw "Missing prompt file for $Agent: $PromptFile"
    }

    Write-Host ""
    Write-Host "Running agent pass:"
    Write-Host $Agent

    & $InvokeScript `
        -RepoPath $RepoPath `
        -PromptFile $PromptFile `
        -TaskText $InProgressItem `
        -Sandbox $Sandbox
}

Write-Host ""
Write-Host "Pipeline completed for:"
Write-Host $AppName
Write-Host ""
Write-Host "Review the app AGENT_REPORT.md before moving the item to completed.md."
