const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onNavigate: (callback) => ipcRenderer.on('navigate-to', (event, path) => callback(path)),
    getVersion: () => process.versions.electron
});
