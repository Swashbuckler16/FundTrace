@echo off
setlocal
cd /d "%~dp0"
if exist "runtime\node.exe" (
  set "FUNDTRACE_NODE=%~dp0runtime\node.exe"
  goto ready
)
where node >nul 2>nul
if errorlevel 1 (
  echo FundTrace needs Node.js 24.14 or newer on this computer.
  echo See README.md for the offline runtime requirements.
  pause
  exit /b 1
)
set "FUNDTRACE_NODE=node"
:ready
echo Open http://127.0.0.1:3000 in your browser.
echo Keep this window open while using FundTrace. Press Ctrl+C to stop.
"%FUNDTRACE_NODE%" src/server.mjs
if errorlevel 1 pause
