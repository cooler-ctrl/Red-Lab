@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   RedLab Desktop Build - Windows Package Builder
echo ===================================================

cd /d "%~dp0\.."
set "ROOT_DIR=%cd%"

echo [1/5] Checking prerequisites...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH.
    echo Please install Python 3.12+ from python.org and try again.
    pause
    exit /b 1
)

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH.
    echo Please install Node.js 20+ from nodejs.org and try again.
    pause
    exit /b 1
)

echo [2/5] Generating Desktop Icons...
python scripts\generate_icons.py

echo [3/5] Building React Frontend...
cd /d "%ROOT_DIR%\frontend"
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed.
    pause
    exit /b 1
)

echo [4/5] Compiling Python Backend Executable with PyInstaller...
cd /d "%ROOT_DIR%\backend"
pip install -r requirements.txt pyinstaller
python -m PyInstaller redlab-backend.spec --noconfirm
if %errorlevel% neq 0 (
    echo Error: PyInstaller build failed.
    pause
    exit /b 1
)

echo [5/5] Packaging Windows Application (.exe installer & portable)...
cd /d "%ROOT_DIR%"
if not exist "desktop\dist-backend" mkdir "desktop\dist-backend"
if exist "desktop\dist-backend\redlab-backend" rmdir /s /q "desktop\dist-backend\redlab-backend"
xcopy /E /I /Y "backend\dist\redlab-backend" "desktop\dist-backend\redlab-backend"

cd /d "%ROOT_DIR%\desktop"
call npm install
call npm run build:win

echo.
echo ===================================================
echo   RedLab Windows Desktop Build Succeeded!
echo ===================================================
echo Check "%ROOT_DIR%\desktop\dist" for:
echo   - RedLab Setup 1.0.0.exe (NSIS Installer)
echo   - RedLab 1.0.0.exe (Standalone Portable)
echo.
pause
