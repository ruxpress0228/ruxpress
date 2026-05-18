#!/usr/bin/env bash
# Runs S3 bucket, IAM user+keys, and RDS MySQL scripts in order.
# Optional: run 00-db-subnet-group-default.sh first if DB subnet group does not exist.
# Env: same as individual scripts (see ../env.example).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== 01 S3 bucket ==="
"$SCRIPT_DIR/01-s3-bucket.sh"

echo ""
echo "=== 02 IAM S3 user ==="
"$SCRIPT_DIR/02-iam-s3-user.sh"

echo ""
echo "=== 03 RDS MySQL ==="
"$SCRIPT_DIR/03-rds-mysql.sh"

echo ""
echo "run-all.sh finished."
