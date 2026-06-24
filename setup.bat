@echo off
echo.
echo ============================================================
echo   CLARION Setup Script
echo   CLARION Threat Intelligence Platform
echo ============================================================
echo.

REM Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Download from https://python.org
    pause & exit /b 1
)
echo [OK] Python found

REM Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Download from https://nodejs.org
    pause & exit /b 1
)
echo [OK] Node.js found

echo.
echo --- Setting up Backend ---
python -m venv venv
call venv\Scripts\activate
cd backend
pip install --upgrade pip -q
pip install -r requirements.txt
if not exist .env copy .env.example .env
cd ..
echo [OK] Backend dependencies installed

echo.
echo --- Setting up Frontend ---
cd ..\frontend
call npm install
echo [OK] Frontend dependencies installed

echo.
echo ============================================================
echo   Setup Complete!
echo ============================================================
echo.
echo   To start CLARION:
echo.
echo   Terminal 1 (Backend):
echo     venv\Scripts\activate
echo     cd backend
echo     uvicorn main:app --host 0.0.0.0 --port 8000 --reload
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend
echo     npm run dev
echo.
echo   Then open: http://localhost:5173
echo   API docs:  http://localhost:8000/docs
echo.
echo   Helpline: 1930  |  cybercrime.gov.in
echo ============================================================
cd ..
pause
