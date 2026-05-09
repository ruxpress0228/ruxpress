# Creates an RDS MySQL instance (MariaDB JDBC compatible).
# Env: same variables as linux/03-rds-mysql.sh (see ..\env.example)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\Common.ps1"
$AwsRoot = Split-Path $PSScriptRoot -Parent
Import-AwsEnv $AwsRoot
Test-AwsCli
Assert-AwsRegion

$required = @(
  "DB_INSTANCE_IDENTIFIER", "DB_INSTANCE_CLASS", "ALLOCATED_STORAGE", "MYSQL_ENGINE_VERSION",
  "DB_SUBNET_GROUP_NAME", "VPC_SECURITY_GROUP_IDS", "MASTER_USERNAME", "MASTER_USER_PASSWORD"
)
foreach ($r in $required) {
  $v = [Environment]::GetEnvironmentVariable($r, "Process")
  if ([string]::IsNullOrWhiteSpace($v)) { throw "Set $r in env" }
}

$storageType = if ($env:STORAGE_TYPE) { $env:STORAGE_TYPE } else { "gp3" }
$backupDays = if ($env:BACKUP_RETENTION_DAYS) { $env:BACKUP_RETENTION_DAYS } else { "7" }
$waitForRds = ($env:WAIT_FOR_RDS -eq "true")
$publicAccess = ($env:RDS_PUBLICLY_ACCESSIBLE -eq "true")

Show-AwsIdentity

$prevEa = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
aws rds describe-db-instances --db-instance-identifier $env:DB_INSTANCE_IDENTIFIER 2>$null | Out-Null
$rdsExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEa
if ($rdsExists) {
  Write-Host "RDS instance already exists: $($env:DB_INSTANCE_IDENTIFIER)"
  if ($waitForRds) {
    Write-Host "Waiting until available..."
    aws rds wait db-instance-available --db-instance-identifier $env:DB_INSTANCE_IDENTIFIER
  }
} else {
  $sgIds = @($env:VPC_SECURITY_GROUP_IDS -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
  Write-Host "Creating RDS MySQL: $($env:DB_INSTANCE_IDENTIFIER) (this may take several minutes)..."

  $publicFlag = if ($publicAccess) { "--publicly-accessible" } else { "--no-publicly-accessible" }

  $argList = @(
    "rds", "create-db-instance",
    "--db-instance-identifier", $env:DB_INSTANCE_IDENTIFIER,
    "--db-instance-class", $env:DB_INSTANCE_CLASS,
    "--engine", "mysql",
    "--engine-version", $env:MYSQL_ENGINE_VERSION,
    "--master-username", $env:MASTER_USERNAME,
    "--master-user-password", $env:MASTER_USER_PASSWORD,
    "--allocated-storage", $env:ALLOCATED_STORAGE,
    "--storage-type", $storageType,
    "--db-subnet-group-name", $env:DB_SUBNET_GROUP_NAME,
    "--backup-retention-period", $backupDays,
    $publicFlag,
    "--vpc-security-group-ids"
  ) + $sgIds

  & aws @argList

  if ($waitForRds) {
    Write-Host "Waiting until available..."
    aws rds wait db-instance-available --db-instance-identifier $env:DB_INSTANCE_IDENTIFIER
  }
}

$endpoint = aws rds describe-db-instances `
  --db-instance-identifier $env:DB_INSTANCE_IDENTIFIER `
  --query 'DBInstances[0].Endpoint.Address' `
  --output text
$port = aws rds describe-db-instances `
  --db-instance-identifier $env:DB_INSTANCE_IDENTIFIER `
  --query 'DBInstances[0].Endpoint.Port' `
  --output text

Write-Host ""
if (-not $endpoint -or $endpoint -eq "None") {
  Write-Host "RDS is still provisioning; endpoint not available yet."
  Write-Host "Check: aws rds describe-db-instances --db-instance-identifier $($env:DB_INSTANCE_IDENTIFIER)"
  Write-Host "Or set WAIT_FOR_RDS=true in env and re-run."
} else {
  Write-Host "RDS endpoint:"
  Write-Host "  DB_HOST=$endpoint"
  Write-Host "  DB_PORT=$port"
  Write-Host "For application-prod.yml / env:"
  Write-Host "  DB_HOST=$endpoint"
  Write-Host "  DB_PORT=$port"
  Write-Host "  DB_USERNAME=$($env:MASTER_USERNAME)"
  Write-Host "  DB_PASSWORD=(value from MASTER_USER_PASSWORD)"
  Write-Host "  DB_NAME=(create database on instance as needed)"
}
