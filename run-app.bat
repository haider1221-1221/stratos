@echo off
setlocal
cd /d %~dp0

:: Set console title and colors for a premium feel
title Stratos - Desktop Launcher
color 0b

echo ==============================================================
echo               S T R A T O S   D E S K T O P
echo          Elevate Your Language Skills - Launcher
echo ==============================================================
echo.

:: 1. Environment Check (Node.js and Python)
echo [1/4] Checking environment requirements...
where node >nul 2>&1 || (
    echo [ERROR] Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)
where python >nul 2>&1 || (
    echo [ERROR] Python is not installed. Please install Python 3.9+ from https://python.org/
    pause
    exit /b 1
)
echo    - Environment OK.

:: 2. Dependencies Check (Electron/Node)
echo [2/4] Verifying Node dependencies...
if not exist "node_modules\" (
    echo    - Missing node_modules in root. Installing...
    call npm install --quiet
) else (
    echo    - Node dependencies OK.
)

:: 3. Backend Environment Check (Python Venv)
echo [3/4] Verifying Python virtual environment...
if not exist ".venv\" (
    echo    - Creating virtual environment in .venv...
    python -m venv .venv
    echo    - Installing backend requirements...
    call .venv\Scripts\activate.bat
    python -m pip install -r backend/requirements.txt
) else (
    echo    - Virtual environment OK.
)

:: 4. Frontend Build Check
:: The backend serves the frontend build files, so we must ensure they exist.
if not exist "frontend\build\index.html" (
    echo [4/4] Frontend build missing. Generating build...
    cd frontend
    if not exist "node_modules\" (
        echo    - Installing frontend dependencies...
        call npm install --quiet
    )
    echo    - Building React application...
    call npm run build
    cd ..
) else (
    echo [4/4] Frontend build files OK.
)

:: Final Launch
echo(
echo ==============================================================
echo [SUCCESS] Everything is ready! 
echo(

:: Check if MongoDB is running
netstat -ano | findstr :27017 >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] MongoDB does not seem to be running on port 27017.
    echo           Please start MongoDB (MongoDB Compass or Service).
    echo           The app will show a connection error if it can't reach the DB.
    echo(
)

echo Launching Stratos Desktop...
echo --------------------------------------------------------------
echo(

:: Run the app
call npm start

if %ERRORLEVEL% NEQ 0 (
    echo(
    echo [ERROR] The application exited with an error (Code: %ERRORLEVEL%).
    echo Please check the console output above for details.
    pause
)

exit /b 0
