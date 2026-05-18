# Creates an RDS DB subnet group using the default VPC (or DEFAULT_VPC_ID) and two subnets in distinct AZs.
# Run before 03-RdsMysql.ps1 if DB_SUBNET_GROUP_NAME does not exist yet.
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\Common.ps1"
$AwsRoot = Split-Path $PSScriptRoot -Parent
Import-AwsEnv $AwsRoot
Test-AwsCli
Assert-AwsRegion
if (-not $env:DB_SUBNET_GROUP_NAME) { throw "Set DB_SUBNET_GROUP_NAME in env" }

Show-AwsIdentity

$prevEa = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
aws rds describe-db-subnet-groups --db-subnet-group-name $env:DB_SUBNET_GROUP_NAME 2>$null | Out-Null
$subnetGroupExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEa
if ($subnetGroupExists) {
  Write-Host "DB subnet group already exists: $($env:DB_SUBNET_GROUP_NAME)"
  exit 0
}

if ($env:DEFAULT_VPC_ID) {
  $vpcId = $env:DEFAULT_VPC_ID
} else {
  $vpcId = aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text
}

if (-not $vpcId -or $vpcId -eq "None") {
  throw "No VPC found. Set DEFAULT_VPC_ID in env to a specific vpc- ID."
}

Write-Host "Using VPC: $vpcId"

$raw = aws ec2 describe-subnets --filters "Name=vpc-id,Values=$vpcId" `
  --query 'Subnets[].[SubnetId,AvailabilityZone]' --output text
$lines = @($raw -split "`r?`n" | Where-Object { $_.Trim() })
$sorted = $lines | Sort-Object { ($_ -split "`t")[1] }
$seen = @{}
$subnetIds = @()
foreach ($l in $sorted) {
  $p = $l -split "`t"
  if ($p.Length -lt 2) { continue }
  $az = $p[1]
  if (-not $seen.ContainsKey($az)) {
    $seen[$az] = $true
    $subnetIds += $p[0]
  }
  if ($subnetIds.Count -ge 2) { break }
}

if ($subnetIds.Count -lt 2) {
  throw "Need at least two subnets in different AZs in VPC $vpcId."
}

Write-Host "Subnets: $($subnetIds[0]), $($subnetIds[1])"

aws rds create-db-subnet-group `
  --db-subnet-group-name $env:DB_SUBNET_GROUP_NAME `
  --db-subnet-group-description "RuxPress DB subnets ($vpcId)" `
  --subnet-ids $subnetIds[0] $subnetIds[1]

Write-Host "Created DB subnet group: $($env:DB_SUBNET_GROUP_NAME)"
