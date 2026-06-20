#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "[INFO] Run this script from anywhere. It auto-uses ROOT_DIR=$ROOT_DIR"
echo "[INFO] Excel output folder: $ROOT_DIR/reports/output"
cd "$ROOT_DIR/backend"

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cd "$ROOT_DIR"
python3 reporter/hourly_reporter.py --require-ai
