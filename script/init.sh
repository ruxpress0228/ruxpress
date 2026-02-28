#!/usr/bin/env bash
set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
TARGET_DIR="/svc/RuxPress"

echo "Initializing RuxPress environment (first-time server setup)..."

# 1. 패키지 업데이트 및 필수 도구 설치 (git, docker)
echo "Updating packages and installing git, docker..."
sudo apt-get update
sudo apt-get install -y git docker.io docker-compose-plugin
sudo usermod -aG docker "${SUDO_USER:-$(whoami)}" 2>/dev/null || true

# 2. /svc 디렉터리 생성 (deploy-dev.yml과 동일한 경로)
if [ ! -d "/svc" ]; then
  sudo mkdir -p /svc
  OWNER="${SUDO_USER:-$(whoami)}"
  sudo chown "$OWNER:$OWNER" /svc 2>/dev/null || true
fi

# 3. /svc/RuxPress 디렉터리 생성
if [ ! -d "$TARGET_DIR" ]; then
  mkdir -p "$TARGET_DIR"
fi

# 현재 리포지토리의 origin URL 가져오기
REPO_URL="$(git -C "$PROJECT_DIR" remote get-url origin 2>/dev/null || echo "")"

# GH_TOKEN 또는 GITHUB_TOKEN이 있고, URL에 아직 토큰이 없으면 토큰 포함 URL로 변환
TOKEN="${GH_TOKEN:-$GITHUB_TOKEN}"
if [ -n "$TOKEN" ] && [ -n "$REPO_URL" ] && ! printf '%s' "$REPO_URL" | grep -q '@github.com'; then
  case "$REPO_URL" in
    git@github.com:*)
      REPO_PATH="${REPO_URL#git@github.com:}"
      REPO_URL="https://${TOKEN}@github.com/${REPO_PATH}"
      ;;
    https://github.com/*)
      REPO_PATH="${REPO_URL#https://github.com/}"
      REPO_URL="https://${TOKEN}@github.com/${REPO_PATH}"
      ;;
    https://*github.com/*)
      REPO_URL="${REPO_URL/https:\/\//https:\/\/$TOKEN@}"
      ;;
  esac
fi

# /svc/RuxPress에 리포지토리가 없으면 clone
if [ ! -d "$TARGET_DIR/.git" ]; then
  if [ -z "$REPO_URL" ]; then
    echo "Error: git remote origin URL을 찾을 수 없습니다."
    exit 1
  fi
  echo "Cloning repository into $TARGET_DIR..."
  git clone "$REPO_URL" "$TARGET_DIR"
fi

# 이후 작업은 /svc/RuxPress에서 수행
cd "$TARGET_DIR"

# 환경 파일 생성 (.env)
if [ -x "./script/setting.sh" ]; then
  ./script/setting.sh
fi

# Docker 이미지 빌드 (no-cache)
docker compose build --no-cache

echo "Init complete."
echo "  - docker 그룹 적용을 위해 새 터미널에서 다시 로그인하거나 'newgrp docker' 실행"
echo "  - Run: ./script/manage.sh start 또는 docker compose up -d"
