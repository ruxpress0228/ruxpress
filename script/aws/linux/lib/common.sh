#!/usr/bin/env bash
# Shared helpers for script/aws/linux/*.sh
# shellcheck shell=bash

# Resolves to script/aws (parent of linux/) when sourced from linux/lib/common.sh
aws_script_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd
}

aws_load_env() {
  local root
  root="$(aws_script_root)"
  local env_path="${ENV_FILE:-$root/env}"
  if [[ -f "$env_path" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$env_path"
    set +a
  fi
  export AWS_DEFAULT_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-}}"
  if [[ -z "${AWS_DEFAULT_REGION:-}" ]]; then
    echo "Error: AWS_REGION is not set (set in env file or environment)." >&2
    exit 1
  fi
}

aws_require_cli() {
  if ! command -v aws >/dev/null 2>&1; then
    echo "Error: aws CLI not found. Install AWS CLI v2 and ensure it is on PATH." >&2
    exit 1
  fi
}

aws_identity_check() {
  echo "Using AWS identity:"
  aws sts get-caller-identity
}
