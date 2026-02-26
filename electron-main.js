const { app, BrowserWindow, shell, Menu, Tray, nativeImage, dialog } = require("electron");
const path = require("path");
const { spawn, execSync } = require("child_process");
const http = require("http");
const fs = require("fs");

// ── Configuration ──────────────────────────────────────────────────────────────
const BACKEND_PORT = 8000;
const BACKEND_HOST = "127.0.0.1";
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const POLL_INTERVAL_MS = 1000;
const MAX_WAIT_MS = 60_000;

let backendProcess = null;
let mainWindow = null;

const logPath = path.join(app.getPath("userData"), "app.log");
function log(msg) {
    const entry = `[${new Date().toISOString()}] ${msg}\n`;
    fs.appendFileSync(logPath, entry);
    console.log(msg);
}

function isDev() {
    return !app.isPackaged;
}

// ── Backend Management ─────────────────────────────────────────────────────────

/**
 * Kill any process currently listening on the backend port.
 * This ensures we don't get "Not Found" because of a zombie process.
 */
function cleanupPort() {
    try {
        if (process.platform === 'win32') {
            const output = execSync(`netstat -ano | findstr :${BACKEND_PORT}`).toString();
            const lines = output.trim().split('\n');
            for (const line of lines) {
                if (line.includes('LISTENING')) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    log(`Killing ghost process ${pid} on port ${BACKEND_PORT}`);
                    execSync(`taskkill /F /PID ${pid} /T`);
                }
            }
        }
    } catch (err) {
        // Ignored if no process found
    }
}

function startBackend() {
    cleanupPort();

    const env = {
        ...process.env,
        PORT: String(BACKEND_PORT),
        HOST: BACKEND_HOST,
        PYTHONUNBUFFERED: "1"
    };

    let exePath = null;
    let spawnArgs = [];
    let spawnCwd = __dirname;

    if (!isDev()) {
        const exeName = "stratos-backend.exe";
        const possiblePaths = [
            path.join(process.resourcesPath, exeName), // Most likely for portable
            path.join(path.dirname(app.getPath("exe")), exeName), // For regular installs
            path.join(process.resourcesPath, "app", "backend", "bin", exeName),
            path.join(__dirname, "backend", "bin", exeName),
        ];

        exePath = possiblePaths.find(p => fs.existsSync(p));
        log(`Production mode. Searching for backend...`);
        possiblePaths.forEach(p => log(` - Checking: ${p} [${fs.existsSync(p) ? 'FOUND' : 'MISSING'}]`));

        if (!exePath) {
            log("CRITICAL ERROR: Could not find backend executable.");
            dialog.showErrorBox("Startup Error", "Could not find backend executable. Path searching failed.");
            app.quit();
            return;
        }
        log(`Starting production backend: ${exePath}`);
    } else {
        const venvPython = path.join(__dirname, ".venv", "Scripts", "python.exe");
        exePath = fs.existsSync(venvPython) ? venvPython : "python";
        const runServerPath = path.join(__dirname, "backend", "run_server.py");
        spawnArgs = [runServerPath];
        log(`Dev mode. Using python: ${exePath}, script: ${runServerPath}`);
    }

    try {
        backendProcess = spawn(exePath, spawnArgs, {
            cwd: spawnCwd,
            env,
            stdio: ["ignore", "pipe", "pipe"],
            windowsHide: true
        });

        backendProcess.stdout.on("data", (data) => log(`[Backend] ${data.toString().trim()}`));
        backendProcess.stderr.on("data", (data) => log(`[Backend Error] ${data.toString().trim()}`));

        backendProcess.on("exit", (code) => {
            log(`Backend process exited with code ${code}`);
            if (code !== 0 && code !== null && mainWindow) {
                log("Backend crashed unexpectedly.");
            }
        });
    } catch (err) {
        log(`Failed to spawn backend: ${err.message}`);
        dialog.showErrorBox("Launch Error", `Failed to start backend process: ${err.message}`);
    }
}

function killBackend() {
    if (backendProcess) {
        log("Shutting down backend...");
        try {
            if (process.platform === 'win32') {
                execSync(`taskkill /F /PID ${backendProcess.pid} /T`);
            } else {
                backendProcess.kill();
            }
        } catch (e) { }
        backendProcess = null;
    }
}

// ── App Logic ──────────────────────────────────────────────────────────────────

function waitForBackend() {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + MAX_WAIT_MS;
        const poll = () => {
            if (Date.now() > deadline) return reject(new Error("Timeout waiting for backend"));

            http.get(`${BACKEND_URL}/api/`, (res) => {
                if (res.statusCode < 400) resolve();
                else setTimeout(poll, POLL_INTERVAL_MS);
            }).on("error", () => setTimeout(poll, POLL_INTERVAL_MS));
        };
        poll();
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 1000,
        minHeight: 700,
        title: "Stratos",
        backgroundColor: "#0f172a",
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    Menu.setApplicationMenu(null);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: "deny" };
    });

    mainWindow.on("closed", () => { mainWindow = null; });
}

async function init() {
    log("App starting...");
    startBackend();
    createWindow();

    log("Connecting to backend...");
    try {
        await waitForBackend();
        log("Backend connected. Loading frontend...");
        mainWindow.loadURL(BACKEND_URL);
        mainWindow.once("ready-to-show", () => {
            log("Main window ready to show.");
            mainWindow.show();
        });
    } catch (err) {
        log(`Backend connection error: ${err.message}`);
        dialog.showMessageBoxSync({
            type: 'error',
            title: 'Connection Error',
            message: 'Could not connect to the Stratos backend. Please check the log file for details.',
            buttons: ['Quit']
        });
        app.quit();
    }
}

app.whenReady().then(init);

app.on("window-all-closed", () => {
    killBackend();
    if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", killBackend);
