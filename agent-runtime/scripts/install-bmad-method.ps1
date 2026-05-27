param(
    [string]$Root = "",

    [string]$Modules = "bmm,tea",

    [string]$Tools = "codex",

    [ValidateSet("install", "update", "quick-update")]
    [string]$Action = "install",

    [string]$UserName = "",

    [string]$CommunicationLanguage = "English",

    [string]$DocumentOutputLanguage = "English",

    [string]$OutputFolder = "_bmad-output"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ScriptRoot = Split-Path -Parent $PSCommandPath
if ([string]::IsNullOrWhiteSpace($Root)) {
    $Root = (Resolve-Path (Join-Path $ScriptRoot "..\..")).Path
} else {
    $Root = (Resolve-Path $Root).Path
}

if (!(Get-Command npx -ErrorAction SilentlyContinue)) {
    throw "npx was not found. Install Node.js/npm before installing BMAD Method."
}

$CliArgs = @(
    "bmad-method",
    "install",
    "--directory", $Root,
    "--modules", $Modules,
    "--tools", $Tools,
    "--action", $Action,
    "--communication-language", $CommunicationLanguage,
    "--document-output-language", $DocumentOutputLanguage,
    "--output-folder", $OutputFolder,
    "--yes"
)

if (![string]::IsNullOrWhiteSpace($UserName)) {
    $CliArgs += @("--user-name", $UserName)
}

Write-Host "Installing BMAD Method"
Write-Host "Root: $Root"
Write-Host "Modules: $Modules"
Write-Host "Tools: $Tools"
Write-Host "Action: $Action"
Write-Host ""

& npx @CliArgs
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "BMAD Method install complete."
Write-Host "Generated local files are intentionally ignored by the AgentLab root repo:"
Write-Host "- .agents\skills"
Write-Host "- _bmad"
Write-Host "- _bmad-output"
