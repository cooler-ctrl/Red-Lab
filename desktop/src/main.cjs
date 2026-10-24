const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow = null;
let backendProcess = null;
let activePort = 8000;

// Test if port is available; return free port
function getFreePort(defaultPort = 8000) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(defaultPort, '127.0.0.1', () => {
      server.close(() => resolve(defaultPort));
    });
    server.on('error', () => {
      const altServer = net.createServer();
      altServer.listen(0, '127.0.0.1', () => {
        const port = altServer.address().port;
        altServer.close(() => resolve(port));
      });
    });
  });
}

// Check if backend health endpoint is up
function checkHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Wait until backend is responsive
async function waitForBackend(port, timeoutMs = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const isHealthy = await checkHealth(port);
    if (isHealthy) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

// Find backend executable path
function resolveBackendPath() {
  const isWin = process.platform === 'win32';
  const binaryName = isWin ? 'redlab-backend.exe' : 'redlab-backend';

  if (app.isPackaged) {
    // 1. Packaged app resource path
    const candidate1 = path.join(process.resourcesPath, 'backend', binaryName);
    if (fs.existsSync(candidate1)) return { type: 'binary', path: candidate1 };

    const candidate2 = path.join(process.resourcesPath, 'backend', 'redlab-backend', binaryName);
    if (fs.existsSync(candidate2)) return { type: 'binary', path: candidate2 };
  } else {
    // 2. Local desktop dist-backend
    const local1 = path.join(__dirname, '..', 'dist-backend', 'redlab-backend', binaryName);
    if (fs.existsSync(local1)) return { type: 'binary', path: local1 };

    const local2 = path.join(__dirname, '..', 'dist-backend', binaryName);
    if (fs.existsSync(local2)) return { type: 'binary', path: local2 };

    // 3. Backend dist
    const backendDist1 = path.join(__dirname, '..', '..', 'backend', 'dist', 'redlab-backend', binaryName);
    if (fs.existsSync(backendDist1)) return { type: 'binary', path: backendDist1 };

    const backendDist2 = path.join(__dirname, '..', '..', 'backend', 'dist', binaryName);
    if (fs.existsSync(backendDist2)) return { type: 'binary', path: backendDist2 };
  }

  // 4. Source fallback using python3
  const scriptPath = path.join(__dirname, '..', '..', 'backend', 'desktop_run.py');
  if (fs.existsSync(scriptPath)) {
    return { type: 'python', path: scriptPath };
  }

  return null;
}

// Resolve frontend distribution folder
function resolveFrontendDist() {
  if (app.isPackaged) {
    const candidate = path.join(process.resourcesPath, 'frontend');
    if (fs.existsSync(candidate)) return candidate;
  }
  const localCandidate = path.join(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(localCandidate)) return localCandidate;
  return null;
}

function startBackend(port) {
  const backend = resolveBackendPath();
  const dataDir = path.join(app.getPath('userData'), 'data');
  const frontendDist = resolveFrontendDist();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const env = {
    ...process.env,
    PORT: String(port),
    HOST: '127.0.0.1',
    REDLAB_DATA_DIR: dataDir,
    REDLAB_FRONTEND_DIST: frontendDist || '',
    PYTHONUNBUFFERED: '1',
  };

  if (!backend) {
    console.error('[RedLab Desktop] Could not locate backend binary or script!');
    return null;
  }

  console.log(`[RedLab Desktop] Launching backend (${backend.type}): ${backend.path}`);

  let proc;
  if (backend.type === 'binary') {
    proc = spawn(backend.path, ['--port', String(port), '--data-dir', dataDir], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else {
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    proc = spawn(pythonCmd, [backend.path, '--port', String(port), '--data-dir', dataDir], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  proc.stdout.on('data', (d) => console.log(`[Backend] ${d.toString().trim()}`));
  proc.stderr.on('data', (d) => console.error(`[Backend Error] ${d.toString().trim()}`));

  proc.on('close', (code) => {
    console.log(`[RedLab Desktop] Backend exited with code ${code}`);
  });

  return proc;
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Reload Application',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow && mainWindow.reload(),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }]),
      ],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'RedLab Documentation',
          click: async () => {
            await shell.openExternal('https://github.com');
          },
        },
        {
          label: 'Network Security Architecture Catalog',
          click: async () => {
            if (mainWindow) {
              mainWindow.loadURL(`http://127.0.0.1:${activePort}/api/docs`);
            }
          },
        },
        { type: 'separator' },
        {
          label: 'About RedLab',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About RedLab',
              message: 'RedLab — Network Attack & Defense Platform',
              detail: 'Version 1.1.1 (Desktop Edition)\nVisual packet simulation, network protocol analysis, threat modeling & deterministic network security.',
              buttons: ['OK'],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function stopBackend() {
  if (backendProcess) {
    console.log('[RedLab Desktop] Terminating backend process...');
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(backendProcess.pid), '/f', '/t']);
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (e) {
      console.error('[RedLab Desktop] Error terminating backend:', e);
    }
    backendProcess = null;
  }
}

async function initApp() {
  activePort = await getFreePort(8000);
  console.log(`[RedLab Desktop] Selected server port: ${activePort}`);

  // Create native window
  const iconPath = path.join(__dirname, '..', 'assets', process.platform === 'win32' ? 'icon.ico' : 'icon.png');

  // Explicitly set macOS Dock icon
  if (process.platform === 'darwin' && app.dock && fs.existsSync(iconPath)) {
    try {
      app.dock.setIcon(iconPath);
    } catch (e) {
      console.warn('[RedLab Desktop] Could not set dock icon:', e);
    }
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#0B0D12',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    show: false,
    title: 'RedLab — Network Attack & Defense Lab',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Load splash screen immediately
  const splashPath = path.join(__dirname, 'splash.html');
  mainWindow.loadFile(splashPath);
  mainWindow.show();

  createMenu();

  // IPC handlers
  ipcMain.handle('get-api-url', () => `http://127.0.0.1:${activePort}/api`);

  // Open external links in default system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      if (!url.includes(`127.0.0.1:${activePort}`) && !url.includes(`localhost:${activePort}`)) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    }
    return { action: 'allow' };
  });

  // Launch backend
  backendProcess = startBackend(activePort);

  // Wait for health check
  const ready = await waitForBackend(activePort, 25000);
  if (ready) {
    console.log(`[RedLab Desktop] Backend is healthy! Loading http://127.0.0.1:${activePort}/`);
    mainWindow.loadURL(`http://127.0.0.1:${activePort}/`);
  } else {
    console.error('[RedLab Desktop] Backend failed to start in time.');
    const { dialog } = require('electron');
    dialog.showErrorBox(
      'Startup Error',
      'The RedLab simulation engine took too long to start. Please restart the application.'
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(initApp);

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    initApp();
  }
});
