# PumpRadar Algorithm Lab (isolated)

Mini aplicație separată pentru testarea și calibrarea algoritmului de semnal.

## Unde este repo-ul acum
- Repo local în acest mediu: `/workspace/pump_radar`
- Folderul aplicației cerute: `/workspace/pump_radar/algo_lab`
- Momentan **nu există remote GitHub configurat** (`git remote -v` este gol).
- Asta înseamnă că programul este fizic în containerul curent, NU pe PC-ul tău până când îl clonezi / descarci ZIP / îl urcăm pe GitHub.

## Cum îl urci pe GitHub (dacă vrei)
```bash
cd /workspace/pump_radar
git remote add origin <URL_REPO_GITHUB>
git push -u origin work
```

## TL;DR (fix asta, acum)

### Linux / Mac (un singur command)
```bash
cd algo_lab
cp .env.example .env   # pune OPENAI_API_KEY în .env
./run_report_once.sh
```
Rezultat: `algo_lab/reports/output/latest.xlsx`

## Exact unde rulezi și exact unde găsești fișierul

### În acest mediu (serverul curent)
- Root proiect: `/workspace/pump_radar`
- Folder lab: `/workspace/pump_radar/algo_lab`
- Folder output Excel: `/workspace/pump_radar/algo_lab/reports/output`
- Fișier latest: `/workspace/pump_radar/algo_lab/reports/output/latest.xlsx`

### Comanda ta, explicit:
```bash
cd /workspace/pump_radar/algo_lab
./run_hourly_reporter.sh
```
Poți rula comanda și din alt folder, dar cel mai clar este path-ul de mai sus.

### Windows (un singur command)
```bat
cd algo_lab
copy .env.example .env
run_report_once.bat
```
Rezultat: `algo_lab/reports/output/latest.xlsx`

## Windows CMD - IMPORTANT (ca să nu mai apară erori)

În `cmd.exe` pe Windows:
- **NU** folosi `./comanda` (asta e stil Linux)
- folosești direct:
  - `comanda.bat`
  - sau `.\comanda.bat` (backslash, nu slash)

### Corect pe Windows:
```bat
cd /d C:\Users\dan.mina\pump_radar\algo_lab
run_report_once.bat
```

Sau:
```bat
cd /d C:\Users\dan.mina\pump_radar\algo_lab
.\run_report_once.bat
```

Pentru rulare rapidă (double-click): `start_here_windows.bat`

### Dacă primești: `The system cannot find the path specified`
Înseamnă că proiectul NU este în `C:\Users\dan.mina\pump_radar\algo_lab`.

1) Găsește path-ul real:
```bat
where /r C:\Users\dan.mina start_here_windows.bat
```

2) Copiază folderul găsit și rulează:
```bat
cd /d "<FOLDERUL_REAL_ALGO_LAB>"
run_report_once.bat
```

Exemplu dacă `where` returnează  
`C:\Users\dan.mina\Downloads\pump_radar\algo_lab\start_here_windows.bat`:
```bat
cd /d C:\Users\dan.mina\Downloads\pump_radar\algo_lab
run_report_once.bat
```

### Dacă `where /r C:\Users\dan.mina start_here_windows.bat` NU returnează nimic
Înseamnă că folderul `algo_lab` nu există încă pe PC-ul tău.

1) Clone repo (dacă ai URL + git):
```bat
cd /d C:\Users\dan.mina
git clone <URL_REPO> pump_radar
cd /d C:\Users\dan.mina\pump_radar\algo_lab
run_report_once.bat
```

2) Sau ZIP download / copy folder:
- descarci repo ZIP și extragi în `C:\Users\dan.mina\pump_radar`
- verifici că există fișierul:
  `C:\Users\dan.mina\pump_radar\algo_lab\run_report_once.bat`
- apoi rulezi:
```bat
cd /d C:\Users\dan.mina\pump_radar\algo_lab
run_report_once.bat
```

## Scope respectat
- Nu atinge aplicația principală (UI, auth, billing, deploy, routing etc.).
- Rulează izolat local: FastAPI + React/Vite.
- Se concentrează pe logică de scoring/clasificare.

## Backend (FastAPI)
```bash
cd algo_lab/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

## Executare program (pas cu pas)
Deschide **2 terminale**:

### Terminal 1 (backend)
```bash
cd algo_lab/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

### Terminal 2 (frontend)
```bash
cd algo_lab/frontend
npm install
npm run dev
```

## Unde apare output-ul
- În terminal (comenzi `curl`): vezi JSON direct în output-ul comenzii.
- În Swagger: `http://127.0.0.1:8001/docs` (poți testa endpoint-uri și vezi response JSON).
- În UI: `http://127.0.0.1:5179` (tabel + detalii verdict/scor pentru fixtures).

## Varianta rapidă Windows (.bat)
În folderul `algo_lab/` ai scripturi gata făcute:

- `run_backend.bat` → pornește backend-ul pe `http://127.0.0.1:8001`
- `run_frontend.bat` → pornește frontend-ul pe `http://127.0.0.1:5179`
- `run_lab.bat` → pornește ambele (două ferestre CMD)
- `run_report_once.bat` → generează imediat un raport Excel cu candidați suspecți
- `run_hourly_reporter.bat` → rulează permanent și generează Excel la fiecare oră
- `run_report_once.sh` / `run_hourly_reporter.sh` → aceleași flow-uri pentru Linux/Mac

### EXE pentru backend (opțional)
Am adăugat și `build_backend_exe.bat`, care face build cu PyInstaller:

```bat
cd algo_lab
build_backend_exe.bat
```

Executable-ul rezultat:
- `algo_lab/backend/dist/pumpradar_algo_lab_api.exe`

## Produs finit: raport Excel orar (pump / dump / rug risk)
Acum ai și un pipeline complet, separat de UI:
- colectează semnale individuale din:
  - GeckoTerminal (market + flow)
  - DefiLlama (fundamentals)
  - GoPlus (security/rug risk)
  - Telegram signals (`reporter/inputs/telegram_signals.json`)
  - X signals (`reporter/inputs/x_signals.json`)
- trece datele prin AI (OpenAI dacă există key, altfel fallback heuristic)
- scrie raport Excel în:
  - `algo_lab/reports/output/latest.xlsx`
  - `algo_lab/reports/output/suspicious_signals_YYYYMMDD_HH00.xlsx`

### Rulare imediată (o singură execuție)
```bat
cd algo_lab
run_report_once.bat
```

### Rulare permanentă (din oră în oră)
```bat
cd algo_lab
run_hourly_reporter.bat
```

### Coloana finală cu link-uri tranzacționare
Fișierul Excel include links specifice pe coin/meme:
- DEX (pool/token specific)
- CEX (pair specific, ex: `SYMBOLUSDT`)
- Swap (Uniswap/Pancake pentru tokenul respectiv)
- plus coloana agregată `trading_links`

### API key AI
1. Copiezi `algo_lab/.env.example` în `algo_lab/.env`
2. Completezi `OPENAI_API_KEY`
3. Scriptul folosește AI automat dacă key-ul există
4. Dacă vrei să oprească execuția când nu există key: rulezi cu `--require-ai`

Exemple:
```bash
python3 algo_lab/reporter/hourly_reporter.py --once --require-ai
python3 algo_lab/reporter/hourly_reporter.py --require-ai
```

### Cum testezi rapid (fără API keys)
Acest lab rulează **offline by design** pentru calibrare deterministă:
- folosește fixture-uri locale (`backend/fixtures/signals.json`) sau payload manual
- **nu face call către CoinGecko/LunarCrush/alte API-uri** în această etapă
- de aceea **nu ai nevoie de niciun API key** pentru validarea logicii algoritmului

Comenzi utile:
```bash
# 1) Health
curl http://127.0.0.1:8001/health

# 2) Ghid de testare (explică de ce nu trebuie API keys)
curl http://127.0.0.1:8001/how-to-test

# 3) Rulează scoring pe fixtures
curl http://127.0.0.1:8001/score-fixtures | jq

# 4) Test manual pe un coin custom
curl -X POST http://127.0.0.1:8001/score \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TEST","name":"Test Coin","sources":{"coingecko":{},"lunarcrush":{},"geckoterminal":{},"defillama":{},"goplus":{},"telegram":{},"x":{}}}'
```

Endpoints:
- `GET /fixtures`
- `POST /score`
- `GET /score-fixtures`

Output include câmpurile obligatorii:
- `verdict`, `direction`, `phase`, `timing`, `confidence`, `score`
- `pump_probability`, `dump_probability`, `manipulation_risk`
- `action`, `tp_pct`, `sl_pct`, `why_now`, `what_confirms_it`, `risk_note`, `red_flags`, `preferred_venue`, `execution_note`
- `source_mode` (valoare implicită: `offline_fixture_or_manual_payload`)

## Frontend (React + Vite + TS)
```bash
cd algo_lab/frontend
npm install
npm run dev
```

Frontend citește din backend la `http://127.0.0.1:8001/score-fixtures` și afișează clar:
- verdict
- direction
- phase
- timing
- confidence

## Fixtures
Fișierul `backend/fixtures/signals.json` conține exemple pentru:
- context bullish sănătos
- context clar slab / manipulabil
- context mixt / noise or watch
