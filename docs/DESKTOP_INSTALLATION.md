# RedLab Desktop Edition — macOS & Windows Installation Guide

RedLab is packaged as a standalone, downloadable desktop software for **macOS** and **Windows PC**. The desktop edition bundles both the visual React 19 frontend and the deterministic Python security engine into a native desktop application with zero external prerequisites.

---

## 1. Downloads & Installers

### macOS (Apple Silicon M1/M2/M3/M4 & Intel x86_64)
- **Disk Image (`.dmg`):** `RedLab-1.0.0.dmg`
  - Double-click the DMG and drag **RedLab** into your `/Applications` folder.
- **Standalone Archive (`.zip`):** `RedLab-1.0.0-mac.zip`
  - Unzip and launch `RedLab.app` directly.

> **macOS Security Gatekeeper Note:**  
> Because RedLab is built as an open-source educational laboratory without an Apple Developer subscription certificate, macOS may prompt:  
> *"RedLab cannot be opened because the developer cannot be verified."*  
> To launch:
> 1. Right-click (or Control-click) `RedLab.app` in `/Applications` and select **Open**.
> 2. Click **Open** in the confirmation dialog. (You only need to do this once).
> 3. Alternatively, run: `xattr -cr /Applications/RedLab.app` in Terminal.

---

### Windows PC (Windows 10 & Windows 11 64-bit)
- **Standard Installer (`.exe`):** `RedLab Setup 1.0.0.exe`
  - Graphical NSIS setup wizard with desktop icon and Start Menu shortcuts.
  - Automatically installs for current user or all users.
- **Portable Edition (`.exe`):** `RedLab 1.0.0.exe`
  - Fully self-contained portable executable.
  - Run directly from any folder or USB drive with zero installation.

> **Windows SmartScreen Note:**  
> On first launch of self-built Windows binaries, Windows Defender SmartScreen may display:  
> *"Windows protected your PC."*  
> Click **More info** → **Run anyway**.

---

## 2. Desktop Architecture & Data Persistence

RedLab Desktop operates 100% locally on your machine with no external network calls:

```
┌────────────────────────────────────────────────────────┐
│  RedLab Desktop Application (Electron)                 │
│  - Dark Cybersecurity Aesthetic (#0B0D12)              │
│  - Native Window Controls & Menu Bar                   │
│  - Auto-port Selection (Port 8000 or Dynamic Fallback) │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            ▼ (Internal Loopback)            ▼ (Local SPA)
┌───────────────────────────┐    ┌───────────────────────┐
│  Bundled Python Engine    │    │  React 19 Visual Lab  │
│  - Fast deterministic     │    │  - @xyflow/react      │
│    vulnerability scanner  │    │  - Interactive Canvas │
│  - Attack path heuristic  │    │  - Rule Inspector     │
│  - SQLite Database        │    │  - Dark Theme         │
└───────────────────────────┘    └───────────────────────┘
```

### Data Storage Locations
Your cloud laboratories, custom nodes, configurations, and security scan audit history are preserved across application updates in standard operating system directories:
- **macOS:** `~/Library/Application Support/RedLab/data/redlab.db`
- **Windows:** `%APPDATA%\RedLab\data\redlab.db`

---

## 3. Building From Source

### Building on macOS
To compile and package the macOS desktop app on your Mac:

```bash
# Clone the repository
git clone https://github.com/your-org/redlab.git
cd redlab

# Run the single-step packaging script
chmod +x scripts/package-mac.sh
./scripts/package-mac.sh
```

The output installers will be generated in `desktop/dist/`:
- `desktop/dist/RedLab-1.0.0.dmg`
- `desktop/dist/RedLab-1.0.0-mac.zip`

---

### Building on Windows PC
To compile and package the Windows desktop installer on a Windows machine:

#### Option A: Command Prompt (Batch)
```cmd
cd redlab
scripts\build-windows.bat
```

#### Option B: PowerShell
```powershell
cd redlab
.\scripts\build-windows.ps1
```

The output installers will be generated in `desktop\dist\`:
- `desktop\dist\RedLab Setup 1.0.0.exe` (NSIS Installer)
- `desktop\dist\RedLab 1.0.0.exe` (Standalone Portable)

---

## 4. Automated CI/CD (GitHub Actions)

RedLab includes a turnkey GitHub Actions workflow at `.github/workflows/build-desktop.yml`.

### How to Trigger Builds via GitHub:
1. **Push a Release Tag:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. **Manual Dispatch (One-Click):**
   - Go to your repository on GitHub.
   - Click **Actions** → **Build Desktop Applications (macOS & Windows)**.
   - Click **Run workflow**.

GitHub's cloud runners will automatically build both the macOS `.dmg`/`.zip` and Windows `.exe` installers, and publish them directly to **GitHub Releases** for one-click downloading!
