@echo off
setlocal
cd /d %~dp0\backend

if not exist .venv (
  py -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -r requirements.txt pyinstaller

pyinstaller --onefile --name pumpradar_algo_lab_api run_api.py

echo EXE generated in: %cd%\dist\pumpradar_algo_lab_api.exe
endlocal
