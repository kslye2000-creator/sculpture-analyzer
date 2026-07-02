const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let serverProcess = null;
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    title: "Sculpture & Portrait Proportional Analyzer",
    icon: path.join(__dirname, 'dist', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Remove default menu bar
  mainWindow.setMenuBarVisibility(false);

  // Load Express local url
  mainWindow.loadURL('http://localhost:3005');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure background node server is started
app.on('ready', () => {
  const serverPath = path.join(__dirname, 'dist', 'server.cjs');
  
  // Fork server child process
  serverProcess = fork(serverPath, [], {
    env: { 
      ...process.env, 
      NODE_ENV: 'production', 
      PORT: '3005' 
    }
  });

  // Wait briefly for Express port to listen, then spawn BrowserWindow
  setTimeout(createWindow, 800);
});

// Clean up background server on exit
app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
