const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('redlabDesktop', {
  isDesktop: true,
  platform: process.platform,
  getApiUrl: () => ipcRenderer.invoke('get-api-url'),
  onBackendStatus: (callback) => {
    ipcRenderer.on('backend-status', (_event, data) => callback(data));
  },
});
