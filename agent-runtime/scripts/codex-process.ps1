function Invoke-CodexExec {
    param(
        [Parameter(Mandatory=$true)]
        [string]$InputText,

        [Parameter(Mandatory=$true)]
        [string]$Sandbox,

        [string]$Label = "codex",

        [int]$HeartbeatSeconds = 15
    )

    $Utf8NoBom = New-Object System.Text.UTF8Encoding -ArgumentList $false, $true

    $CodexCommand = Get-Command codex.cmd -ErrorAction SilentlyContinue
    if (!$CodexCommand) {
        $CodexCommand = Get-Command codex -ErrorAction SilentlyContinue
    }

    if (!$CodexCommand) {
        throw "Codex CLI was not found. Make sure Codex CLI is installed and available in PATH."
    }

    $ProcessStartInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $ProcessStartInfo.FileName = $CodexCommand.Source
    $ProcessStartInfo.UseShellExecute = $false
    $ProcessStartInfo.RedirectStandardInput = $true
    $ProcessStartInfo.RedirectStandardOutput = $true
    $ProcessStartInfo.RedirectStandardError = $true
    $ProcessStartInfo.CreateNoWindow = $true

    if ($ProcessStartInfo.GetType().GetProperty("StandardOutputEncoding")) {
        $ProcessStartInfo.StandardOutputEncoding = $Utf8NoBom
    }

    if ($ProcessStartInfo.GetType().GetProperty("StandardErrorEncoding")) {
        $ProcessStartInfo.StandardErrorEncoding = $Utf8NoBom
    }

    if ($Sandbox -notmatch '^[A-Za-z0-9_-]+$') {
        throw "Invalid sandbox value: $Sandbox"
    }

    $ProcessStartInfo.Arguments = "exec --sandbox $Sandbox --skip-git-repo-check -"

    $Process = [System.Diagnostics.Process]::Start($ProcessStartInfo)

    try {
        $InputBytes = $Utf8NoBom.GetBytes($InputText)
        $Process.StandardInput.BaseStream.Write($InputBytes, 0, $InputBytes.Length)
        $Process.StandardInput.BaseStream.Flush()
        $Process.StandardInput.Close()

        $StdoutLines = New-Object System.Collections.Generic.List[string]
        $StderrLines = New-Object System.Collections.Generic.List[string]
        $StdoutDone = $false
        $StderrDone = $false
        $StdoutTask = $Process.StandardOutput.ReadLineAsync()
        $StderrTask = $Process.StandardError.ReadLineAsync()
        $StartedAt = Get-Date
        $LastHeartbeatAt = Get-Date

        while (!$Process.HasExited -or !$StdoutDone -or !$StderrDone) {
            $Tasks = New-Object System.Collections.Generic.List[System.Threading.Tasks.Task]
            $Streams = New-Object System.Collections.Generic.List[string]

            if (!$StdoutDone) {
                $Tasks.Add($StdoutTask) | Out-Null
                $Streams.Add("stdout") | Out-Null
            }

            if (!$StderrDone) {
                $Tasks.Add($StderrTask) | Out-Null
                $Streams.Add("stderr") | Out-Null
            }

            if ($Tasks.Count -eq 0) {
                if (!$Process.HasExited) {
                    $Process.WaitForExit(1000) | Out-Null
                }
            }
            else {
                $CompletedIndex = [System.Threading.Tasks.Task]::WaitAny($Tasks.ToArray(), 1000)

                if ($CompletedIndex -ge 0) {
                    $StreamName = $Streams[$CompletedIndex]

                    if ($StreamName -eq "stdout") {
                        $Line = $StdoutTask.Result
                        if ($null -eq $Line) {
                            $StdoutDone = $true
                        }
                        else {
                            $StdoutLines.Add($Line) | Out-Null
                            Write-Host $Line
                            $StdoutTask = $Process.StandardOutput.ReadLineAsync()
                        }
                    }
                    else {
                        $Line = $StderrTask.Result
                        if ($null -eq $Line) {
                            $StderrDone = $true
                        }
                        else {
                            $StderrLines.Add($Line) | Out-Null
                            [Console]::Error.WriteLine($Line)
                            $StderrTask = $Process.StandardError.ReadLineAsync()
                        }
                    }
                }
            }

            if ($HeartbeatSeconds -gt 0) {
                $Now = Get-Date
                if (($Now - $LastHeartbeatAt).TotalSeconds -ge $HeartbeatSeconds -and !$Process.HasExited) {
                    $Elapsed = [int]($Now - $StartedAt).TotalSeconds
                    Write-Host ("[agentlab] {0} still running after {1}s..." -f $Label, $Elapsed)
                    $LastHeartbeatAt = $Now
                }
            }
        }

        $Process.WaitForExit()

        [pscustomobject]@{
            ExitCode = $Process.ExitCode
            Stdout = $StdoutLines -join [Environment]::NewLine
            Stderr = $StderrLines -join [Environment]::NewLine
        }
    }
    finally {
        $Process.Dispose()
    }
}
