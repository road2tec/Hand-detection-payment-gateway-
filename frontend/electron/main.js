import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simple access to hardware/webcam
            enableRemoteModule: true
        },
        // Premium App Look
        backgroundColor: '#0f172a',
        titleBarStyle: 'hiddenInset',
        icon: path.join(__dirname, '../public/vite.svg')
    });

    // Load the Vite dev server URL
    win.loadURL('http://localhost:5173');

    // Open DevTools in development
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Handle webcam permissions automatically
    app.on('web-contents-created', (event, contents) => {
        contents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
            if (permission === 'media') {
                return true;
            }
            return false;
        });

        contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
            if (permission === 'media') {
                callback(true);
            } else {
                callback(false);
            }
        });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
