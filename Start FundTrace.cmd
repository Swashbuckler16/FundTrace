@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo FundTrace needs Node.js 24.14 or newer on this computer.
  echo See README.md for the offline runtime requirements.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:3000 in your browser.
echo Keep this window open while using FundTrace. Press Ctrl+C to stop.
node src/server.mjs
if errorlevel 1 pause
