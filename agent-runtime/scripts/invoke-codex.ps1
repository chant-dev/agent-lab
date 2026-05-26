param(
    [Parameter(Mandatory=$true)]
    [string]$RepoPath,

    [Parameter(Mandatory=$true)]
    [string]$PromptFile,

    [Parameter(Mandatory=$true)]
    [string]$TaskText,

    [string]$Sandbox = "workspace-write",

    [int]$HeartbeatSeconds = 15,

    [switch]$SkipGitBranch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $PSCommandPath
. (Join-Path $ScriptRoot "codex-process.ps1")

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

    $PromptName = [System.IO.Path]::GetFileNameWithoutExtension($PromptFile)

    if (!$SkipGitBranch) {
        $Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $BranchName = "agent/$PromptName-$Timestamp"

        $CurrentStatus = git status --porcelain
        if ($CurrentStatus) {
            git add .
            git commit -m "Checkpoint before $PromptName pass" | Out-Null
        }

        git checkout -b $BranchName | Out-Null
    }

    $Result = Invoke-CodexExec `
        -InputText $FullPrompt `
        -Sandbox $Sandbox `
        -Label $PromptName `
        -HeartbeatSeconds $HeartbeatSeconds

    if ($Result.ExitCode -ne 0) {
        Write-Host ""
        Write-Host "Codex pass failed for:"
        Write-Host $PromptFile
        exit $Result.ExitCode
    }

    Write-Host ""
    Write-Host "Codex pass completed for:"
    Write-Host $PromptFile
}
finally {
    Pop-Location
}
