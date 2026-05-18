#!/usr/bin/env bash
# Creates an IAM user, inline policy scoped to S3_BUCKET_NAME, and an access key pair.
# Requires: iam:CreateUser, iam:PutUserPolicy, iam:CreateAccessKey (and GetUser if user exists)
# WARNING: Secret key is shown once. Do not log or commit.
# Optional: set ACCESS_KEY_OUTPUT_FILE to write JSON (add that path to .gitignore)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

aws_load_env
aws_require_cli

: "${S3_BUCKET_NAME:?Set S3_BUCKET_NAME in env}"
: "${IAM_USER_NAME:?Set IAM_USER_NAME in env}"
IAM_S3_POLICY_NAME="${IAM_S3_POLICY_NAME:-RuxpressS3BucketAccess}"

aws_identity_check

if ! aws iam get-user --user-name "$IAM_USER_NAME" >/dev/null 2>&1; then
  echo "Creating IAM user: $IAM_USER_NAME"
  aws iam create-user --user-name "$IAM_USER_NAME"
else
  echo "IAM user already exists: $IAM_USER_NAME"
fi

BUCKET_ARN="arn:aws:s3:::${S3_BUCKET_NAME}"
OBJECT_ARN="arn:aws:s3:::${S3_BUCKET_NAME}/*"

POLICY_DOC=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetBucketLocation"],
      "Resource": "${BUCKET_ARN}"
    },
    {
      "Sid": "ObjectRW",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject", "s3:PutObject", "s3:DeleteObject",
        "s3:AbortMultipartUpload", "s3:ListMultipartUploadParts"
      ],
      "Resource": "${OBJECT_ARN}"
    }
  ]
}
EOF
)

aws iam put-user-policy \
  --user-name "$IAM_USER_NAME" \
  --policy-name "$IAM_S3_POLICY_NAME" \
  --policy-document "$POLICY_DOC"

echo "Inline policy attached: $IAM_S3_POLICY_NAME"

EXISTING_KEYS=$(aws iam list-access-keys --user-name "$IAM_USER_NAME" --query 'AccessKeyMetadata[].AccessKeyId' --output text 2>/dev/null || true)
if [[ -n "${EXISTING_KEYS// }" ]]; then
  echo "Warning: user already has access key(s): $EXISTING_KEYS" >&2
  echo "AWS allows max 2 keys per user. Create a new key only after deleting an old one in IAM console or CLI." >&2
fi

KEY_JSON=$(aws iam create-access-key --user-name "$IAM_USER_NAME" --output json)

if [[ -n "${ACCESS_KEY_OUTPUT_FILE:-}" ]]; then
  printf '%s\n' "$KEY_JSON" >"$ACCESS_KEY_OUTPUT_FILE"
  echo "Wrote credentials JSON to $ACCESS_KEY_OUTPUT_FILE (keep private; do not commit)"
fi

if command -v jq >/dev/null 2>&1; then
  ACCESS_KEY_ID=$(echo "$KEY_JSON" | jq -r '.AccessKey.AccessKeyId')
  SECRET_KEY=$(echo "$KEY_JSON" | jq -r '.AccessKey.SecretAccessKey')
elif command -v python3 >/dev/null 2>&1; then
  ACCESS_KEY_ID=$(echo "$KEY_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKey']['AccessKeyId'])")
  SECRET_KEY=$(echo "$KEY_JSON" | python3 -c "import sys,json; print(json.load(sys.stdin)['AccessKey']['SecretAccessKey'])")
else
  ACCESS_KEY_ID=$(printf '%s' "$KEY_JSON" | sed -n 's/.*"AccessKeyId": "\([^"]*\)".*/\1/p' | head -1)
  SECRET_KEY=$(printf '%s' "$KEY_JSON" | sed -n 's/.*"SecretAccessKey": "\([^"]*\)".*/\1/p' | head -1)
fi

echo ""
echo "=== Save these values; SecretAccessKey cannot be retrieved again ==="
echo "export S3_ACCESS_KEY=$ACCESS_KEY_ID"
echo "export S3_SECRET_KEY=$SECRET_KEY"
echo "export S3_BUCKET=$S3_BUCKET_NAME"
echo "export S3_REGION=$AWS_DEFAULT_REGION"
echo "===================================================================="
