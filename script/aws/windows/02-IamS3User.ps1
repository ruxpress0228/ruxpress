# Creates an IAM user, inline policy scoped to S3_BUCKET_NAME, and an access key pair.
# WARNING: Secret key is shown once. Do not log or commit.
# Optional: $env:ACCESS_KEY_OUTPUT_FILE = path to write JSON (keep out of git)
$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\Common.ps1"
$AwsRoot = Split-Path $PSScriptRoot -Parent
Import-AwsEnv $AwsRoot
Test-AwsCli
Assert-AwsRegion
if (-not $env:S3_BUCKET_NAME) { throw "Set S3_BUCKET_NAME in env" }
if (-not $env:IAM_USER_NAME) { throw "Set IAM_USER_NAME in env" }
if (-not $env:IAM_S3_POLICY_NAME) { $env:IAM_S3_POLICY_NAME = "RuxpressS3BucketAccess" }

Show-AwsIdentity

$prevEa = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
aws iam get-user --user-name $env:IAM_USER_NAME 2>$null | Out-Null
$userMissing = ($LASTEXITCODE -ne 0)
$ErrorActionPreference = $prevEa
if ($userMissing) {
  Write-Host "Creating IAM user: $($env:IAM_USER_NAME)"
  aws iam create-user --user-name $env:IAM_USER_NAME
} else {
  Write-Host "IAM user already exists: $($env:IAM_USER_NAME)"
}

$bucketArn = "arn:aws:s3:::$($env:S3_BUCKET_NAME)"
$objectArn = "arn:aws:s3:::$($env:S3_BUCKET_NAME)/*"
$policyDoc = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "$bucketArn"
    },
    {
      "Sid": "ObjectRW",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject", "s3:PutObject", "s3:DeleteObject",
        "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts"
      ],
      "Resource": "$objectArn"
    }
  ]
}
"@

# Use file:// + absolute path with forward slashes (file:///C:/... breaks on some Windows CLI builds)
$policyFile = [System.IO.Path]::GetTempFileName() + ".json"
try {
  [System.IO.File]::WriteAllText($policyFile, $policyDoc.Trim(), [System.Text.UTF8Encoding]::new($false))
  $policyUri = "file://" + ($policyFile -replace '\\', '/')
  aws iam put-user-policy `
    --user-name $env:IAM_USER_NAME `
    --policy-name $env:IAM_S3_POLICY_NAME `
    --policy-document $policyUri
  if ($LASTEXITCODE -ne 0) {
    throw "put-user-policy failed"
  }
} finally {
  Remove-Item -Force $policyFile -ErrorAction SilentlyContinue
}

Write-Host "Inline policy attached: $($env:IAM_S3_POLICY_NAME)"

$existing = aws iam list-access-keys --user-name $env:IAM_USER_NAME --query 'AccessKeyMetadata[].AccessKeyId' --output text 2>$null
if ($existing -and $existing.Trim()) {
  Write-Warning "user already has access key(s): $existing"
  Write-Warning "AWS allows max 2 keys per user. Create a new key only after deleting an old one in IAM console or CLI."
}

$keyJsonText = aws iam create-access-key --user-name $env:IAM_USER_NAME --output json
$keyJson = $keyJsonText | ConvertFrom-Json
$accessKeyId = $keyJson.AccessKey.AccessKeyId
$secretKey = $keyJson.AccessKey.SecretAccessKey

if ($env:ACCESS_KEY_OUTPUT_FILE) {
  Set-Content -Path $env:ACCESS_KEY_OUTPUT_FILE -Value $keyJsonText -Encoding UTF8
  Write-Host "Wrote credentials JSON to $($env:ACCESS_KEY_OUTPUT_FILE) (keep private; do not commit)"
}

Write-Host ""
Write-Host "=== Save these values; SecretAccessKey cannot be retrieved again ==="
Write-Host "set S3_ACCESS_KEY=$accessKeyId"
Write-Host "set S3_SECRET_KEY=$secretKey"
Write-Host "set S3_BUCKET=$($env:S3_BUCKET_NAME)"
Write-Host "set S3_REGION=$($env:AWS_DEFAULT_REGION)"
Write-Host "===================================================================="
