@echo off
setlocal
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..
cd /d "%PROJECT_DIR%"

docker compose down
if errorlevel 1 exit /b 1

docker compose build
if errorlevel 1 exit /b 1

docker compose up -d
if errorlevel 1 exit /b 1
