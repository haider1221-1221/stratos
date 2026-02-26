@echo off
setlocal
cd /d %~dp0

title Stratos - Build Portable EXE
color 0a

echo ==============================================================
echo               S T R A T O S   B U I L D E R
echo          Creating a Single Portable Executable
echo ==============================================================
echo.

:: 1. Build Frontend
echo [1/3] Building React Frontend...
cd frontend
if not exist "node_modules\" (
    echo    - Installing frontend dependencies...
    call npm install --quiet
)
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed.
    pause
    exit /b 1
)
cd ..
echo    - Frontend build complete.

:: 2. Build Backend
echo [2/3] Building Python Backend...
if not exist ".venv\" (
    echo    - Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
echo    - Installing backend dependencies...
python -m pip install -r backend/requirements.txt pyinstaller
echo    - Compiling Backend to EXE...
powershell -NoProfile -ExecutionPolicy Bypass -Command "& ./.venv/Scripts/python.exe -m PyInstaller --onefile --noconsole --name stratos-backend --icon backend/stratos.ico --distpath backend/bin --workpath build-temp --noconfirm --clean backend/run_server.py"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Backend build failed.
    pause
    exit /b 1
)
echo    - Backend build complete (located in backend/bin/stratos-backend.exe).

:: 3. Package Electron App
echo [3/3] Packaging Electron App (Portable)...
if not exist "node_modules\" (
    echo    - Installing root dependencies...
    call npm install --quiet
)
call npx electron-builder --win portable
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Electron packaging failed.
    pause
    exit /b 1
)

echo.
echo ==============================================================
echo [SUCCESS] Build Finished!
echo Your portable application is in the "dist" folder.
echo You can share the "Stratos.exe" file with anyone.
echo ==============================================================
echo.
pause
exit /b 0
