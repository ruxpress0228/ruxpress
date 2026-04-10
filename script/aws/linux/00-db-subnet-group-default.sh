#!/usr/bin/env bash
# Creates an RDS DB subnet group using the default VPC (or DEFAULT_VPC_ID) and two subnets in distinct AZs.
# Requires: ec2:DescribeVpcs, ec2:DescribeSubnets, rds:CreateDBSubnetGroup, rds:DescribeDBSubnetGroups
# Run this before 03-rds-mysql.sh if you do not already have DB_SUBNET_GROUP_NAME.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=lib/common.sh
source "$SCRIPT_DIR/lib/common.sh"

aws_load_env
aws_require_cli

: "${DB_SUBNET_GROUP_NAME:?Set DB_SUBNET_GROUP_NAME in env}"

aws_identity_check

if aws rds describe-db-subnet-groups --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" >/dev/null 2>&1; then
  echo "DB subnet group already exists: $DB_SUBNET_GROUP_NAME"
  exit 0
fi

if [[ -n "${DEFAULT_VPC_ID:-}" ]]; then
  VPC_ID="$DEFAULT_VPC_ID"
else
  VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
fi

if [[ -z "$VPC_ID" || "$VPC_ID" == "None" ]]; then
  echo "Error: no VPC found. Set DEFAULT_VPC_ID in env to a specific vpc- ID." >&2
  exit 1
fi

echo "Using VPC: $VPC_ID"

mapfile -t SUBNET_ARR < <(
  aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
    --query 'Subnets[].[SubnetId,AvailabilityZone]' --output text \
    | sort -t$'\t' -k2,2 \
    | awk -F'\t' '!seen[$2]++ {print $1}' \
    | head -2
)

if [[ "${#SUBNET_ARR[@]}" -lt 2 ]]; then
  echo "Error: need at least two subnets in different AZs in VPC $VPC_ID." >&2
  exit 1
fi

echo "Subnets: ${SUBNET_ARR[0]}, ${SUBNET_ARR[1]}"

aws rds create-db-subnet-group \
  --db-subnet-group-name "$DB_SUBNET_GROUP_NAME" \
  --db-subnet-group-description "RuxPress DB subnets (${VPC_ID})" \
  --subnet-ids "${SUBNET_ARR[0]}" "${SUBNET_ARR[1]}"

echo "Created DB subnet group: $DB_SUBNET_GROUP_NAME"
