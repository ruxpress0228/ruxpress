#!/usr/bin/env bash
# Creates an S3 bucket in AWS_REGION and enables block public access (recommended).
# Requires: aws CLI, credentials with s3:CreateBucket, s3:PutBucketPublicAccessBlock
# Env: copy ../env.example to ../env; set AWS_REGION, S3_BUCKET_NAME
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

aws_load_env
aws_require_cli

: "${S3_BUCKET_NAME:?Set S3_BUCKET_NAME in env}"

aws_identity_check

if aws s3api head-bucket --bucket "$S3_BUCKET_NAME" 2>/dev/null >/dev/null; then
  echo "Bucket already exists: $S3_BUCKET_NAME"
  exit 0
fi

echo "Creating bucket: $S3_BUCKET_NAME (region: $AWS_DEFAULT_REGION)"

if [[ "$AWS_DEFAULT_REGION" == "us-east-1" ]]; then
  aws s3api create-bucket --bucket "$S3_BUCKET_NAME" --region "$AWS_DEFAULT_REGION"
else
  aws s3api create-bucket \
    --bucket "$S3_BUCKET_NAME" \
    --region "$AWS_DEFAULT_REGION" \
    --create-bucket-configuration "LocationConstraint=${AWS_DEFAULT_REGION}"
fi

aws s3api put-public-access-block \
  --bucket "$S3_BUCKET_NAME" \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

echo "Done. For application-prod.yml:"
echo "  S3_BUCKET=$S3_BUCKET_NAME"
echo "  S3_REGION=$AWS_DEFAULT_REGION"
