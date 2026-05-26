param(
    [string]$Root = "",

    [string]$Sandbox = "workspace-write",

    [int]$HeartbeatSeconds = 15,

    [ValidateSet("lightweight", "standard", "production")]
    [string]$Mode = "standard"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $PSCommandPath
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = (Resolve-Path (Join-Path $ScriptRoot "..\..")).Path
} else {
    $Root = (Resolve-Path $Root).Path
}

$QueueFile = Join-Path $Root "queue\queue.md"
$CompletedFile = Join-Path $Root "queue\completed.md"
$InvokeScript = Join-Path $Root "agent-runtime\scripts\invoke-codex.ps1"

if (!(Test-Path $QueueFile)) {
    throw "Missing queue file: $QueueFile"
}

if (!(Test-Path $InvokeScript)) {
    throw "Missing invoke script: $InvokeScript"
}

function Get-GitHead {
    param(
        [Parameter(Mandatory=$true)]
        [string]$RepoPath
    )

    try {
        $Commit = & git -C $RepoPath rev-parse --short HEAD 2>$null
        if ($LASTEXITCODE -eq 0 -and $Commit) {
            return ($Commit | Select-Object -First 1).Trim()
        }
    }
    catch {
        return "unknown"
    }

    return "unknown"
}

$QueueText = Get-Content $QueueFile -Raw

function Remove-FencedCodeBlocks {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Markdown
    )

    $Lines = $Markdown -split "\r?\n"
    $Output = New-Object System.Collections.Generic.List[string]
    $InsideFence = $false

    foreach ($Line in $Lines) {
        if ($Line -match '^\s*```') {
            $InsideFence = !$InsideFence
            $Output.Add("") | Out-Null
            continue
        }

        if ($InsideFence) {
            $Output.Add("") | Out-Null
            continue
        }

        $Output.Add($Line) | Out-Null
    }

    return ($Output -join "`n")
}

function Select-ActiveQueueItemsSection {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Markdown
    )

    $ActiveHeading = [regex]::Match($Markdown, "(?im)^##\s+Active Queue Items\s*$")
    if (!$ActiveHeading.Success) {
        return $Markdown
    }

    return $Markdown.Substring($ActiveHeading.Index + $ActiveHeading.Length)
}

function Split-ActiveQueue {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Markdown
    )

    $ActiveHeading = [regex]::Match($Markdown, "(?im)^##\s+Active Queue Items\s*$")
    if ($ActiveHeading.Success) {
        return @{
            Prefix = $Markdown.Substring(0, $ActiveHeading.Index + $ActiveHeading.Length)
            Active = $Markdown.Substring($ActiveHeading.Index + $ActiveHeading.Length)
        }
    }

    return @{
        Prefix = ""
        Active = $Markdown
    }
}

function Resolve-AgentLabQueuePath {
    param(
        [Parameter(Mandatory=$true)]
        [string]$PathText,

        [Parameter(Mandatory=$true)]
        [string]$Root
    )

    $NormalizedPath = $PathText.Trim().Trim('"')

    if ($NormalizedPath -match '^<AGENTLAB_ROOT>[\\/]*(?<Rest>.*)$') {
        return [System.IO.Path]::GetFullPath((Join-Path $Root $Matches["Rest"].Value))
    }

    if ([System.IO.Path]::IsPathRooted($NormalizedPath)) {
        return [System.IO.Path]::GetFullPath($NormalizedPath)
    }

    return [System.IO.Path]::GetFullPath((Join-Path $Root $NormalizedPath))
}

function Add-CompletedQueueItem {
    param(
        [Parameter(Mandatory=$true)]
        [string]$CompletedFile,

        [Parameter(Mandatory=$true)]
        [string]$AppName,

        [Parameter(Mandatory=$true)]
        [string]$RepoPath,

        [Parameter(Mandatory=$true)]
        [string]$Mode,

        [Parameter(Mandatory=$true)]
        [string]$OriginalItem
    )

    $CompletedDir = Split-Path -Parent $CompletedFile
    if (!(Test-Path $CompletedDir)) {
        New-Item -ItemType Directory -Force -Path $CompletedDir | Out-Null
    }

    if (!(Test-Path $CompletedFile)) {
        @"
# Completed Agent Queue Items

This file stores queue items that completed successfully.

---

## Completed Items
"@ | Set-Content -Path $CompletedFile -Encoding UTF8
    }

    $CompletedText = Get-Content $CompletedFile -Raw
    $CompletedDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $FinalCommit = Get-GitHead -RepoPath $RepoPath
    $DoneOriginalItem = $OriginalItem -replace "^## \[(READY|IN_PROGRESS)\]", "## [DONE]"
    $IndentedOriginalItem = (($DoneOriginalItem -split "\r?\n") | ForEach-Object { "    $_" }) -join "`n"

    $Record = @"

## [DONE] $AppName
Completed Date: $CompletedDate
Path: $RepoPath
Final Verdict: Completed by AgentLab pipeline
Final Commit: $FinalCommit
Mode: $Mode

Summary:
AgentLab pipeline completed successfully. Review the app AGENT_REPORT.md for detailed validation results, blockers, warnings, and known limitations.

Original Queue Item:
$IndentedOriginalItem

Final Notes:
- Archived automatically by run-next-queue-item.ps1 after all agent passes completed successfully.
- The app AGENT_REPORT.md remains the source of detailed implementation and validation notes.
"@

    $InsertHeading = [regex]::Match($CompletedText, "(?im)^##\s+Completed Items\s*$")
    if ($InsertHeading.Success) {
        $InsertAt = $InsertHeading.Index + $InsertHeading.Length
        $UpdatedCompletedText = $CompletedText.Substring(0, $InsertAt) + $Record + $CompletedText.Substring($InsertAt)
    }
    else {
        $UpdatedCompletedText = $CompletedText.TrimEnd() + "`n`n## Completed Items" + $Record + "`n"
    }

    $UpdatedCompletedText | Set-Content -Path $CompletedFile -Encoding UTF8
}

function Complete-QueueItem {
    param(
        [Parameter(Mandatory=$true)]
        [string]$QueueFile,

        [Parameter(Mandatory=$true)]
        [string]$CompletedFile,

        [Parameter(Mandatory=$true)]
        [string]$AppName,

        [Parameter(Mandatory=$true)]
        [string]$RepoPath,

        [Parameter(Mandatory=$true)]
        [string]$Mode,

        [Parameter(Mandatory=$true)]
        [string]$OriginalItem
    )

    $CurrentQueueText = Get-Content $QueueFile -Raw
    $QueueParts = Split-ActiveQueue -Markdown $CurrentQueueText
    $ItemPattern = "(?ms)^## \[IN_PROGRESS\] " + [regex]::Escape($AppName) + "\s*\r?\n.*?(?=^## \[(READY|IN_PROGRESS|BLOCKED|DONE|FAILED)\] |\z)"
    $ItemRegex = [regex]::new($ItemPattern)
    $UpdatedActiveQueueText = $ItemRegex.Replace($QueueParts.Active, "", 1)

    if ($UpdatedActiveQueueText -eq $QueueParts.Active) {
        throw "Failed to remove completed queue item from active queue: $AppName"
    }

    Add-CompletedQueueItem `
        -CompletedFile $CompletedFile `
        -AppName $AppName `
        -RepoPath $RepoPath `
        -Mode $Mode `
        -OriginalItem $OriginalItem

    ($QueueParts.Prefix + $UpdatedActiveQueueText).TrimEnd() + "`n" | Set-Content -Path $QueueFile -Encoding UTF8
}

$RunnableQueueText = Select-ActiveQueueItemsSection -Markdown (Remove-FencedCodeBlocks -Markdown $QueueText)

$Pattern = "(?ms)^## \[READY\] (?<Name>.+?)\r?\n(?<Body>.*?)(?=^## \[|\z)"
$Match = [regex]::Match($RunnableQueueText, $Pattern)

if (!$Match.Success) {
    Write-Host "No [READY] queue items found."
    if ([regex]::IsMatch($RunnableQueueText, "(?m)^## \[IN_PROGRESS\] ")) {
        Write-Host "There are [IN_PROGRESS] queue items. If no agent process is running, reset the stale item to [READY] before retrying."
    }
    exit 0
}

$AppName = $Match.Groups["Name"].Value.Trim()
$Body = $Match.Groups["Body"].Value.Trim()
$FullItem = "## [READY] $AppName`n$Body"

$PathMatch = [regex]::Match($Body, "Path:\s*(?<Path>.+)")
if (!$PathMatch.Success) {
    throw "Queue item does not contain a Path field."
}

$RepoPath = Resolve-AgentLabQueuePath -PathText $PathMatch.Groups["Path"].Value -Root $Root

Write-Host "Selected queue item:"
Write-Host $AppName
Write-Host "Repo:"
Write-Host $RepoPath

$InProgressItem = $FullItem -replace "^## \[READY\]", "## [IN_PROGRESS]"
$QueueParts = Split-ActiveQueue -Markdown $QueueText
$QueuePrefix = $QueueParts.Prefix
$ActiveQueueText = $QueueParts.Active

$HeadingPattern = "(?m)^## \[READY\] " + [regex]::Escape($AppName) + "\s*$"
$HeadingRegex = [regex]::new($HeadingPattern)
$UpdatedActiveQueueText = $HeadingRegex.Replace($ActiveQueueText, "## [IN_PROGRESS] $AppName", 1)

if ($UpdatedActiveQueueText -eq $ActiveQueueText) {
    throw "Failed to mark queue item as IN_PROGRESS: $AppName"
}

$UpdatedQueueText = $QueuePrefix + $UpdatedActiveQueueText
$UpdatedQueueText | Set-Content -Path $QueueFile -Encoding UTF8

switch ($Mode) {
    "lightweight" {
        $Agents = @("scaffolder", "analyst", "story-planner", "dev", "qa-reviewer", "reviewer")
    }
    "standard" {
        $Agents = @("scaffolder", "analyst", "pm", "architect", "story-planner", "dev", "qa-reviewer", "deployer", "reviewer")
    }
    "production" {
        $Agents = @("scaffolder", "analyst", "pm", "ux-designer", "architect", "story-planner", "dev", "qa-reviewer", "refiner", "qa-reviewer", "deployer", "reviewer")
    }
}

$TotalAgents = $Agents.Count
$AgentIndex = 0

foreach ($Agent in $Agents) {
    $AgentIndex++
    $PromptFile = Join-Path $Root "agent-runtime\prompts\$Agent.md"

    if (!(Test-Path $PromptFile)) {
        throw "Missing prompt file for ${Agent}: $PromptFile"
    }

    $BannerLine = "=" * 72
    Write-Host ""
    Write-Host $BannerLine
    Write-Host ("Running {0} ({1}/{2})" -f $Agent.ToUpperInvariant(), $AgentIndex, $TotalAgents)
    Write-Host ("Mode: {0}" -f $Mode)
    Write-Host ("Sandbox: {0}" -f $Sandbox)
    Write-Host ("Repo: {0}" -f $RepoPath)
    Write-Host ("Started: {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
    Write-Host $BannerLine

    & $InvokeScript `
        -RepoPath $RepoPath `
        -PromptFile $PromptFile `
        -TaskText $InProgressItem `
        -Sandbox $Sandbox `
        -HeartbeatSeconds $HeartbeatSeconds
}

Write-Host ""
Write-Host "Pipeline completed for:"
Write-Host $AppName
Write-Host ""
Complete-QueueItem `
    -QueueFile $QueueFile `
    -CompletedFile $CompletedFile `
    -AppName $AppName `
    -RepoPath $RepoPath `
    -Mode $Mode `
    -OriginalItem $InProgressItem

Write-Host "Archived completed queue item to:"
Write-Host $CompletedFile
