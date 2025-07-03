const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Example: A function to send a message to the main process
  sendMessage: (message) => ipcRenderer.send('message-from-renderer', message),

  // Example: A function to receive a message from the main process
  onMessageFromMain: (callback) => ipcRenderer.on('message-from-main', (event, ...args) => callback(...args)),

  // You could expose system info like this (similar to Electron quick start)
  getAppVersion: () => process.versions.electron,
  getNodeVersion: () => process.versions.node,
  getChromeVersion: () => process.versions.chrome
});