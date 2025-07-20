// main.js - Electron Main Process for AI Mastery: The Doctor
const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch'); // DOCTOR'S ORDERS: ADD THIS LINE
const isDev = process.env.NODE_ENV === 'development';

// Global references
let mainWindow = null;
let serverProcess = null;
const serverPort = process.env.PORT || 3001;

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== `http://localhost:${serverPort}`) {
      event.preventDefault();
    }
  });
});

// Set up IPC handlers
function setupIPCHandlers() {
  // Window management
  ipcMain.handle('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window-open-devtools', () => {
    if (mainWindow && isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // App information
  ipcMain.handle('app-get-version', () => app.getVersion());
  ipcMain.handle('app-get-platform', () => process.platform);

  console.log('🔌 IPC handlers registered');
}

ipcMain.handle('fetch-api', async (event, endpoint, options) => {
  try {
    const fullUrl = `http://localhost:${serverPort}${endpoint}`;
    console.log(`[IPC Fetch]: Relaying request to ${fullUrl}`);
    
    const response = await fetch(fullUrl, options);
    
    // Check if the response is JSON before trying to parse it
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json(); // It's JSON, parse it
    } else {
      return await response.text(); // It's not JSON, return as text
    }

  } catch (error) {
    console.error(`[IPC Fetch Error] for endpoint ${endpoint}:`, error.message);
    // Return a structured error object that the frontend can understand
    return { success: false, error: 'IPC_FETCH_FAILED', message: error.message };
  }
});

function createWindow() {
  console.log('🖥️ Creating main window...');

  // Create the browser window
 mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    minWidth: 800,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, 'assets', 'doctor-icon.png'),
// DOCTOR'S ORDERS: Restoring correct, modern security protocols.
webPreferences: {
  nodeIntegration: false, // This must be false for security
  contextIsolation: true, // This MUST be true for the preload script to work
  preload: path.join(__dirname, 'preload.js'),
}
  });

  // Start the backend server
  startServer();

  // Wait for server to start, then load the page
  const checkServer = () => {
    const http = require('http');
    const options = {
      hostname: 'localhost',
      port: serverPort,
      path: '/health',
      timeout: 1000
    };

    const req = http.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Server is ready, loading application...');
        
        // Load the app
        mainWindow.loadURL(`http://localhost:${serverPort}`);
        
        // Show window when ready
        mainWindow.once('ready-to-show', () => {
          mainWindow.show();
          
          // Focus the window
          if (isDev) {
            mainWindow.webContents.openDevTools();
          }
        });
        
      } else {
        setTimeout(checkServer, 500);
      }
    });

    req.on('error', () => {
      setTimeout(checkServer, 500);
    });

    req.on('timeout', () => {
      req.destroy();
      setTimeout(checkServer, 500);
    });

    req.end();
  };

  // Start checking after initial delay
  setTimeout(checkServer, 2000);

  // Handle window events
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Security: Prevent external navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`http://localhost:${serverPort}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Handle failed loads
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorDescription);
    
    if (mainWindow) {
      mainWindow.loadFile(path.join(__dirname, 'frontend', 'error.html'));
    }
  });

  // Create application menu
  createMenu();

  console.log('🖥️ Main window created');
}

// DOCTOR'S ORDERS: This is the new, enhanced startServer function.

// THIS IS THE NEW BLOCK TO PASTE IN ITS PLACE
function startServer() {
  console.log('🚀 Starting backend server process...');
  const serverPath = path.join(__dirname, 'server', 'server.js');

  if (!fs.existsSync(serverPath)) {
    console.error('❌ Server file not found:', serverPath);
    dialog.showErrorBox('Server Missing', 'The Doctor\'s backend systems are missing.');
    return;
  }

  const env = { ...process.env, NODE_ENV: isDev ? 'development' : 'production', PORT: serverPort };
  serverProcess = spawn('node', [serverPath], { env, cwd: __dirname });

  // This is the new diagnostic scanner. It captures detailed crash data.
  serverProcess.stderr.on('data', (data) => {
    console.error(`❌ SERVER CRASH DATA:\n${data.toString()}`);
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server]: ${data.toString().trim()}`);
  });

  serverProcess.on('error', (err) => {
    console.error('❌ Failed to start server process:', err);
    dialog.showErrorBox('Server Startup Failed', 'Backend systems failed to initialize.');
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    if (code !== 0 && !app.isQuitting) {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Server Error',
        message: 'The Doctor\'s systems have encountered an error.',
        detail: `The backend server stopped unexpectedly (code ${code}). Check the terminal for detailed error logs.`,
        buttons: ['OK', 'Restart Application'],
        defaultId: 0
      }).then(({ response }) => {
        if (response === 1) {
          app.relaunch();
          app.quit();
        }
      });
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'Starfleet Academy',
      submenu: [
        {
          label: 'About The Doctor',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.showAboutModal();
                }
              `);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.showSettingsModal();
                }
              `);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Reset Training Progress',
          click: () => {
            const choice = dialog.showMessageBoxSync(mainWindow, {
              type: 'warning',
              title: 'Reset Progress',
              message: 'Are you sure you want to reset all training progress, Captain?',
              detail: 'This action cannot be undone. All lesson progress and scores will be permanently deleted.',
              buttons: ['Cancel', 'Reset Progress'],
              defaultId: 0,
              cancelId: 0
            });

            if (choice === 1) {
              if (mainWindow) {
                mainWindow.webContents.executeJavaScript(`
                  if (window.AIMasteryApp) {
                    window.AIMasteryApp.resetProgress();
                  }
                `);
              }
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Education',
      submenu: [
        {
          label: 'Start Next Lesson',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.startNextLesson();
                }
              `);
            }
          }
        },
        {
          label: 'Submit Answer',
          accelerator: 'CmdOrCtrl+Enter',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.submitAnswer();
                }
              `);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Request Hint',
          accelerator: 'CmdOrCtrl+H',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.requestHint();
                }
              `);
            }
          }
        },
        {
          label: 'Skip Lesson',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.skipLesson();
                }
              `);
            }
          }
        }
      ]
    },
    {
      label: 'Doctor',
      submenu: [
        {
          label: 'Adjust Humor Level',
          submenu: [
            {
              label: 'Professional (1-3)',
              click: () => adjustHumorLevel(2)
            },
            {
              label: 'Mildly Condescending (4-6)',
              click: () => adjustHumorLevel(5)
            },
            {
              label: 'Classic Doctor (7-9)',
              click: () => adjustHumorLevel(8)
            },
            {
              label: 'Maximum Arrogance (10)',
              click: () => adjustHumorLevel(10)
            }
          ]
        },
        { type: 'separator' },
        {
          label: 'Show Character Rotation Status',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.showCharacterRotationStatus();
                }
              `);
            }
          }
        },
        {
          label: 'Generate Diagnostic Report',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.showStatusModal();
                }
              `);
            }
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'User Manual',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.executeJavaScript(`
                if (window.AIMasteryApp) {
                  window.AIMasteryApp.showHelpModal();
                }
              `);
            }
          }
        },
        {
          label: 'Keyboard Shortcuts',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Keyboard Shortcuts',
              message: 'AI Mastery: The Doctor - Keyboard Shortcuts',
              detail: `
Lesson Controls:
• Ctrl/Cmd + N: Start Next Lesson
• Ctrl/Cmd + Enter: Submit Answer
• Ctrl/Cmd + H: Request Hint
• Ctrl/Cmd + S: Skip Lesson

Application:
• Ctrl/Cmd + ,: Settings
• S: Settings (when not typing)
• H: Help (when not typing)
• Space: Start Learning (when not in lesson)
• Esc: Close Modals

General:
• Ctrl/Cmd + R: Reload
• F11: Toggle Fullscreen
• Ctrl/Cmd + Q: Quit
              `,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/captain-tal/ai-mastery-doctor/issues');
          }
        },
        {
          label: 'About Star Trek',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Star Trek',
              message: 'AI Mastery: The Doctor',
              detail: `
This application features The Doctor (Emergency Medical Hologram) from Star Trek: Voyager, created by Gene Roddenberry and developed by Rick Berman, Michael Piller, and Jeri Taylor.

The Doctor character and Star Trek universe are property of Paramount Global.

This educational application is a fan creation and is not affiliated with or endorsed by Paramount Global.

"Live long and prosper." 🖖
              `,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template[0].label = app.getName();
    template[0].submenu.unshift(
      {
        label: 'About ' + app.getName(),
        role: 'about'
      },
      { type: 'separator' }
    );

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function adjustHumorLevel(level) {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(`
      if (window.AIMasteryApp) {
        const settings = window.AIMasteryApp.getSettings();
        settings.humorLevel = ${level};
        window.AIMasteryApp.updateSettings(settings);
        window.AIMasteryApp.showInfo('Doctor humor level adjusted to ${level}/10');
      }
    `);
  }
}

// Security: Set Content Security Policy
app.on('web-contents-created', (event, contents) => {
  contents.on('dom-ready', () => {
    contents.insertCSS(`
      /* Ensure no external content can be loaded */
      img[src^="http"]:not([src^="http://localhost:${serverPort}"]) {
        display: none !important;
      }
    `);
  });
});

// App event handlers
app.whenReady().then(() => {
  // Security: Set app user model ID for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.aimastery.doctor');
  }

  // Setup IPC handlers
  setupIPCHandlers();

  // Create main window
  createWindow();

  console.log('🎭 AI Mastery: The Doctor is ready for service');
});

app.on('window-all-closed', () => {
  // Kill server process
  if (serverProcess) {
    console.log('🛑 Stopping server process...');
    serverProcess.kill('SIGTERM');
    
    // Force kill after timeout
    setTimeout(() => {
      if (serverProcess) {
        serverProcess.kill('SIGKILL');
      }
    }, 5000);
  }
  
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (mainWindow === null) {
    createWindow();
  }
});

// DOCTOR'S ORDERS: Enhanced termination protocol to prevent zombie processes.
// THIS IS THE NEW BLOCK TO PASTE IN ITS PLACE
app.on('before-quit', () => {
  console.log('🛑 Application shutting down...');
  app.isQuitting = true;
  if (serverProcess && !serverProcess.killed) {
    console.log('🛑 Terminating server process...');
    serverProcess.kill('SIGTERM'); // Send a polite request to terminate
    setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
            console.log('🛑 Server process unresponsive. Forcing shutdown...');
            serverProcess.kill('SIGKILL'); // Forcefully terminate
        }
    }, 2000); // Wait 2 seconds before forcing
  }
});

// Security: Limit file access
app.on('web-contents-created', (event, contents) => {
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Prevent webview creation
    event.preventDefault();
  });
});

// Handle protocol for deep linking (if needed in future)
app.setAsDefaultProtocolClient('ai-mastery-doctor');

// Handle deep links on Windows/Linux
app.on('second-instance', (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('🚫 Another instance is already running');
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, we should focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Crash protection
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  dialog.showErrorBox(
    'Unexpected Error',
    'The Doctor has encountered an unexpected error. The application will continue running, but you may want to restart it.'
  );
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export for testing
module.exports = { createWindow, startServer };