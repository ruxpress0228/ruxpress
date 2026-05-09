# Creates an S3 bucket in AWS_REGION and enables block public access (recommended).
# Requires: aws CLI, credentials with s3:CreateBucket, s3:PutBucketPublicAccessBlock
# Env: copy ..\env.example to ..\env; set AWS_REGION, S3_BUCKET_NAME
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\Common.ps1"
$AwsRoot = Split-Path $PSScriptRoot -Parent
Import-AwsEnv $AwsRoot
Test-AwsCli
Assert-AwsRegion
if (-not $env:S3_BUCKET_NAME) { throw "Set S3_BUCKET_NAME in env" }

Show-AwsIdentity

# head-bucket writes to stderr when missing; avoid terminating on stderr under Stop
$prevEa = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
aws s3api head-bucket --bucket $env:S3_BUCKET_NAME 2>$null | Out-Null
$bucketExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevEa
if ($bucketExists) {
  Write-Host "Bucket already exists: $($env:S3_BUCKET_NAME)"
  exit 0
}

Write-Host "Creating bucket: $($env:S3_BUCKET_NAME) (region: $($env:AWS_DEFAULT_REGION))"

if ($env:AWS_DEFAULT_REGION -eq "us-east-1") {
  aws s3api create-bucket --bucket $env:S3_BUCKET_NAME --region $env:AWS_DEFAULT_REGION
} else {
  aws s3api create-bucket `
    --bucket $env:S3_BUCKET_NAME `
    --region $env:AWS_DEFAULT_REGION `
    --create-bucket-configuration "LocationConstraint=$($env:AWS_DEFAULT_REGION)"
}
if ($LASTEXITCODE -ne 0) {
  throw "create-bucket failed (is S3_BUCKET_NAME globally unique?). See message above."
}

aws s3api put-public-access-block `
  --bucket $env:S3_BUCKET_NAME `
  --public-access-block-configuration `
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

Write-Host "Done. For application-prod.yml:"
Write-Host "  S3_BUCKET=$($env:S3_BUCKET_NAME)"
Write-Host "  S3_REGION=$($env:AWS_DEFAULT_REGION)"
