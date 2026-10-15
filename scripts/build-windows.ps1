# RedLab Windows Desktop Build Script (PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  RedLab Desktop Build - Windows Package Builder" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$ROOT_DIR = (Resolve-Path "$PSScriptRoot\..").Path
Set-Location $ROOT_DIR

Write-Host "[1/5] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "Python is not installed or not in PATH. Please install Python 3.12+."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js 20+."
}

Write-Host "[2/5] Generating Desktop Icons..." -ForegroundColor Yellow
python scripts\generate_icons.py

Write-Host "[3/5] Building React Frontend..." -ForegroundColor Yellow
Set-Location "$ROOT_DIR\frontend"
npm install
npm run build

Write-Host "[4/5] Compiling Python Backend Executable with PyInstaller..." -ForegroundColor Yellow
Set-Location "$ROOT_DIR\backend"
pip install -r requirements.txt pyinstaller
python -m PyInstaller redlab-backend.spec --noconfirm

Write-Host "[5/5] Packaging Windows Application (.exe installer and portable)..." -ForegroundColor Yellow
Set-Location $ROOT_DIR
$distBackend = "$ROOT_DIR\desktop\dist-backend"
if (-not (Test-Path $distBackend)) {
    New-Item -ItemType Directory -Path $distBackend | Out-Null
}
$targetDir = "$distBackend\redlab-backend"
if (Test-Path $targetDir) {
    Remove-Item -Recurse -Force $targetDir
}
Copy-Item -Recurse -Force "$ROOT_DIR\backend\dist\redlab-backend" $targetDir

Set-Location "$ROOT_DIR\desktop"
npm install
npm run build:win

Write-Host "`n===================================================" -ForegroundColor Green
Write-Host "  RedLab Windows Desktop Build Succeeded!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
Write-Host "Installers generated in: $ROOT_DIR\desktop\dist" -ForegroundColor White
Get-ChildItem "$ROOT_DIR\desktop\dist\*.exe" | Select-Object Name, Length
