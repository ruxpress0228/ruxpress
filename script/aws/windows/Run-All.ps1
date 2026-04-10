# Runs S3 bucket, IAM user+keys, and RDS MySQL scripts in order.
# Optional: run 00-DbSubnetGroupDefault.ps1 first if the DB subnet group does not exist.
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot

Write-Host "=== 01 S3 bucket ==="
& "$dir\01-S3Bucket.ps1"

Write-Host ""
Write-Host "=== 02 IAM S3 user ==="
& "$dir\02-IamS3User.ps1"

Write-Host ""
Write-Host "=== 03 RDS MySQL ==="
& "$dir\03-RdsMysql.ps1"

Write-Host ""
Write-Host "Run-All.ps1 finished."
