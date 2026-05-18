#!/usr/bin/env bash
# Creates an RDS MySQL instance (MariaDB JDBC compatible).
# Requires: rds:CreateDBInstance, rds:DescribeDBInstances; EC2/RDS subnet resources must exist.
# Env: DB_INSTANCE_IDENTIFIER, DB_INSTANCE_CLASS, ALLOCATED_STORAGE, MYSQL_ENGINE_VERSION,
#      DB_SUBNET_GROUP_NAME, VPC_SECURITY_GROUP_IDS (comma-separated),
#      MASTER_USERNAME, MASTER_USER_PASSWORD, RDS_PUBLICLY_ACCESSIBLE
# Optional: WAIT_FOR_RDS=true to block until available; STORAGE_TYPE (default gp3)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

aws_load_env
aws_require_cli

: "${DB_INSTANCE_IDENTIFIER:?Set DB_INSTANCE_IDENTIFIER in env}"
: "${DB_INSTANCE_CLASS:?Set DB_INSTANCE_CLASS in env}"
: "${ALLOCATED_STORAGE:?Set ALLOCATED_STORAGE in env}"
: "${MYSQL_ENGINE_VERSION:?Set MYSQL_ENGINE_VERSION in env}"
: "${DB_SUBNET_GROUP_NAME:?Set DB_SUBNET_GROUP_NAME in env}"
: "${VPC_SECURITY_GROUP_IDS:?Set VPC_SECURITY_GROUP_IDS in env}"
: "${MASTER_USERNAME:?Set MASTER_USERNAME in env}"
: "${MASTER_USER_PASSWORD:?Set MASTER_USER_PASSWORD in env}"

RDS_PUBLICLY_ACCESSIBLE="${RDS_PUBLICLY_ACCESSIBLE:-false}"
STORAGE_TYPE="${STORAGE_TYPE:-gp3}"
WAIT_FOR_RDS="${WAIT_FOR_RDS:-false}"

aws_identity_check

if aws rds describe-db-instances --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" >/dev/null 2>&1; then
  echo "RDS instance already exists: $DB_INSTANCE_IDENTIFIER"
  if [[ "$WAIT_FOR_RDS" == "true" ]]; then
    echo "Waiting until available..."
    aws rds wait db-instance-available --db-instance-identifier "$DB_INSTANCE_IDENTIFIER"
  fi
else
  # shellcheck disable=SC2206
  SG_ARRAY=(${VPC_SECURITY_GROUP_IDS//,/ })

  echo "Creating RDS MySQL: $DB_INSTANCE_IDENTIFIER (this may take several minutes)..."

  PUBLIC_FLAG=(--no-publicly-accessible)
  if [[ "$RDS_PUBLICLY_ACCESSIBLE" == "true" ]]; then
    PUBLIC_FLAG=(--publicly-accessible)
  fi

  aws rds create-db-instance \
    --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
    --db-instance-class "$DB_INSTANCE_CLASS" \
    --engine mysql \
    --engine-version "$MYSQL_ENGINE_VERSION" \
    --master-username "$MASTER_USERNAME" \
    --master-user-password "$MASTER_USER_PASSWORD" \
    --allocated-storage "$ALLOCATED_STORAGE" \
    --storage-type "$STORAGE_TYPE" \
    --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" \
    --vpc-security-group-ids "${SG_ARRAY[@]}" \
    --backup-retention-period "${BACKUP_RETENTION_DAYS:-7}" \
    "${PUBLIC_FLAG[@]}"

  if [[ "$WAIT_FOR_RDS" == "true" ]]; then
    echo "Waiting until available..."
    aws rds wait db-instance-available --db-instance-identifier "$DB_INSTANCE_IDENTIFIER"
  fi
fi

ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)
PORT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_INSTANCE_IDENTIFIER" \
  --query 'DBInstances[0].Endpoint.Port' \
  --output text)

echo ""
if [[ -z "$ENDPOINT" || "$ENDPOINT" == "None" ]]; then
  echo "RDS is still provisioning; endpoint not available yet."
  echo "Check: aws rds describe-db-instances --db-instance-identifier $DB_INSTANCE_IDENTIFIER"
  echo "Or set WAIT_FOR_RDS=true in env and re-run."
else
  echo "RDS endpoint:"
  echo "  DB_HOST=$ENDPOINT"
  echo "  DB_PORT=$PORT"
  echo "For application-prod.yml / env:"
  echo "  DB_HOST=$ENDPOINT"
  echo "  DB_PORT=${PORT}"
  echo "  DB_USERNAME=$MASTER_USERNAME"
  echo "  DB_PASSWORD=(value from MASTER_USER_PASSWORD)"
  echo "  DB_NAME=(create database on instance as needed)"
fi
