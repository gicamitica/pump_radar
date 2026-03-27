@echo off
setlocal
cd /d %~dp0

echo [INFO] Current folder: %cd%
if not exist run_report_once.bat (
  echo [ERROR] run_report_once.bat not found. Open this file from inside the algo_lab folder.
  exit /b 1
)

echo [INFO] Running one-shot Excel report now...
call run_report_once.bat
endlocal
