@echo off
setlocal
cd /d %~dp0

start "PumpRadar Lab Backend" cmd /k run_backend.bat
start "PumpRadar Lab Frontend" cmd /k run_frontend.bat

echo Backend:  http://127.0.0.1:8001

echo Frontend: http://127.0.0.1:5179
endlocal
