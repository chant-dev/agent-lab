param(
    [Parameter(Mandatory=$true)]
    [string]$RepoPath,

    [Parameter(Mandatory=$true)]
    [string]$PromptFile,

    [Parameter(Mandatory=$true)]
    [string]$TaskText,

    [string]$Sandbox = "workspace-write",

    [switch]$SkipGitBranch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (!(Get-Command codex -ErrorAction SilentlyContinue)) {
    throw "Codex CLI was not found. Install or sign into Codex CLI before running this script."
}

if (!(Test-Path $RepoPath)) {
    New-Item -ItemType Directory -Path $RepoPath -Force | Out-Null
}

if (!(Test-Path $PromptFile)) {
    throw "PromptFile does not exist: $PromptFile"
}

$BasePrompt = Get-Content $PromptFile -Raw

$FullPrompt = @"
$BasePrompt

---

# Current Task Context

$TaskText
"@

Push-Location $RepoPath

try {
    if (!(Test-Path ".git")) {
        git init | Out-Null
    }

    if (!$SkipGitBranch) {
        $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $PromptName = [System.IO.Path]::GetFileNameWithoutExtension($PromptFile)
        $BranchName = "agent/$PromptName-$Timestamp"

        $CurrentStatus = git status --porcelain
        if ($CurrentStatus) {
            git add .
            git commit -m "Checkpoint before $PromptName pass" | Out-Null
        }

        git checkout -b $BranchName | Out-Null
    }

    $FullPrompt | codex exec --sandbox $Sandbox -

    Write-Host "Codex pass completed for:"
    Write-Host $PromptFile
}
finally {
    Pop-Location
}
