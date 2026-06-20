@echo off
setlocal
cd /d %~dp0\backend

if not exist .venv (
  py -m venv .venv
)

call .venv\Scripts\activate.bat
pip install -r requirements.txt
python run_api.py
endlocal
