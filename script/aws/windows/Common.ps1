# Shared helpers for script/aws/windows/*.ps1
$ErrorActionPreference = 'Stop'

function Import-AwsEnv {
  param([string]$AwsRoot)
  $path = if ($env:ENV_FILE) { $env:ENV_FILE } else { Join-Path $AwsRoot "env" }
  if (-not (Test-Path $path)) { return }
  Get-Content $path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^\s*#' -or $line -eq '') { return }
    $i = $line.IndexOf('=')
    if ($i -gt 0) {
      $k = $line.Substring(0, $i).Trim()
      $v = $line.Substring($i + 1).Trim()
      Set-Item -Path "Env:$k" -Value $v
    }
  }
}

function Test-AwsCli {
  if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    throw "aws CLI not found. Install AWS CLI v2 and ensure it is on PATH."
  }
}

function Assert-AwsRegion {
  if (-not $env:AWS_REGION -and -not $env:AWS_DEFAULT_REGION) {
    throw "AWS_REGION is not set (set in env file or environment)."
  }
  if ($env:AWS_REGION -and -not $env:AWS_DEFAULT_REGION) {
    $env:AWS_DEFAULT_REGION = $env:AWS_REGION
  }
}

function Show-AwsIdentity {
  Write-Host "Using AWS identity:"
  aws sts get-caller-identity
}
