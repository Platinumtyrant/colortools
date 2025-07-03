const { app, BrowserWindow } = require('electron');
const path = require('path');

// Helper to check if we're in development mode
const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_ELECTRON;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // Ensure this path is correct
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000'); // Load your Next.js dev server
    mainWindow.webContents.openDevTools(); // Open DevTools in dev mode
  } else {
    // For production, load the built Next.js app
    // Next.js static export typically outputs to 'out' or '.next/static'
    const indexPath = path.join(__dirname, '../out', 'index.html'); // Adjust 'out' if your build output is different
    mainWindow.loadFile(indexPath);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});