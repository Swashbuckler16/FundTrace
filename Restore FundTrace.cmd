@echo off
setlocal
cd /d "%~dp0"
set "FUNDTRACE_NODE=node"
if exist "runtime\node.exe" set "FUNDTRACE_NODE=%~dp0runtime\node.exe"
"%FUNDTRACE_NODE%" scripts/recovery.mjs restore
pause
