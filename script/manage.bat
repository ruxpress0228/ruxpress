@echo off
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
cd /d "%PROJECT_DIR%"

if "%1"=="start" (
  docker compose up -d
) else if "%1"=="stop" (
  docker compose down
) else if "%1"=="restart" (
  docker compose restart
) else (
  echo Usage: %0 {start^|stop^|restart}
  exit /b 1
)
