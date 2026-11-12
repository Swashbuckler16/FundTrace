import { app, BrowserWindow, Menu, dialog, session, ipcMain } from "electron";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, mkdirSync } from "node:fs";
import { startWorkspace } from "../src/server.mjs";
import {
  restoreBackup,
  unlockWorkspace,
  verifyBackup,
} from "../src/recovery.mjs";
import { messages } from "../public/languages.js";

const here = dirname(fileURLToPath(import.meta.url));
if (process.env.FUNDTRACE_DESKTOP_PROFILE) {
  mkdirSync(process.env.FUNDTRACE_DESKTOP_PROFILE, { recursive: true });
  app.setPath("userData", process.env.FUNDTRACE_DESKTOP_PROFILE);
}
const browserData = join(app.getPath("userData"), "browser");
mkdirSync(browserData, { recursive: true });
app.setPath("sessionData", browserData);
const directory =
  process.env.FUNDTRACE_DATA_DIR || join(app.getPath("userData"), "workspace");
let workspace,
  window,
  quitting = false,
  restoring = false,
  language = "en";
const text = (key) =>
  language === "en" ? key : messages[key]?.[language === "mr" ? 0 : 1] || key;
app.setAppUserModelId("in.fundtrace.desktop");

async function restore() {
  if (restoring) return;
  restoring = true;
  try {
    const selection = await dialog.showOpenDialog(window, {
      title: text("Choose a verified backup folder"),
      properties: ["openDirectory"],
    });
    if (selection.canceled) return;
    const source = selection.filePaths[0];
    const manifest = verifyBackup(source);
    const confirmation = await dialog.showMessageBox(window, {
      type: "warning",
      title: text("Restore backup"),
      message: text("Replace this workspace with the selected backup?"),
      detail: `${text("Backup date")}: ${manifest.createdAt}\n${text("Active workspace")}: ${directory}\n\n${text("Your current workspace is retained. Changes after this backup will not be included.")}`,
      buttons: [text("Cancel"), text("Restore backup")],
      defaultId: 0,
      cancelId: 0,
    });
    if (confirmation.response !== 1) return;
    // Stop requests and close SQLite before the existing verified restore performs its swap.
    if (window) await window.loadURL("about:blank");
    await workspace?.stop();
    workspace = null;
    restoreBackup(source, directory);
    app.relaunch();
    app.quit();
  } catch (error) {
    dialog.showErrorBox(text("Could not restore backup"), text(error.message));
    // Restart through the normal startup guard, including interrupted-restore detection.
    if (!workspace) {
      app.relaunch();
      app.quit();
    }
  } finally {
    restoring = false;
  }
}

function menu() {
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: "FundTrace",
        submenu: [
          {
            label: text("Settings"),
            click: () => window.loadURL(workspace.origin + "/?page=settings"),
          },
          {
            label: text("Backup & recovery"),
            click: () => window.loadURL(workspace.origin + "/?page=recovery"),
          },
          { label: text("Restore backup"), click: restore },
          { type: "separator" },
          {
            label: text("Exit"),
            accelerator: "Alt+F4",
            click: () => app.quit(),
          },
        ],
      },
      {
        label: text("Edit"),
        submenu: [
          { role: "undo", label: text("Undo") },
          { role: "redo", label: text("Redo") },
          { type: "separator" },
          { role: "cut", label: text("Cut") },
          { role: "copy", label: text("Copy") },
          { role: "paste", label: text("Paste") },
          { role: "selectAll", label: text("Select all") },
        ],
      },
      {
        label: text("View"),
        submenu: [
          { role: "reload", label: text("Reload") },
          { role: "zoomIn", label: text("Zoom in") },
          { role: "zoomOut", label: text("Zoom out") },
          { role: "resetZoom", label: text("Actual size") },
          { role: "togglefullscreen", label: text("Full screen") },
        ],
      },
    ]),
  );
}

async function launch() {
  try {
    workspace = await startWorkspace(directory, {
      port: Number(process.env.FUNDTRACE_DESKTOP_PORT || 31764),
      desktop: true,
    });
  } catch (error) {
    const result = await dialog.showMessageBox({
      type: "error",
      title: "FundTrace",
      message: text("Could not open the workspace"),
      detail: `${text(error.message)}\n\n${directory}`,
      buttons: [
        text("Exit"),
        text("Unlock after a crash"),
        text("Restore backup"),
      ],
      defaultId: 0,
      cancelId: 0,
    });
    if (result.response === 1) {
      try {
        if (existsSync(`${directory}.lock`)) unlockWorkspace(directory);
        app.relaunch();
      } catch (unlockError) {
        dialog.showErrorBox("FundTrace", text(unlockError.message));
      }
    } else if (result.response === 2) {
      await restore();
    }
    app.quit();
    return;
  }
  const allowed = (url) => {
    try {
      return new URL(url).origin === workspace?.origin;
    } catch {
      return false;
    }
  };
  session.defaultSession.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  session.defaultSession.setPermissionCheckHandler(() => false);
  ipcMain.handle("fundtrace:save-pdf", async (event) => {
    if (
      event.sender !== window?.webContents ||
      event.senderFrame !== window.webContents.mainFrame ||
      !allowed(event.senderFrame.url)
    )
      throw new Error("Untrusted PDF request");
    const result = await dialog.showSaveDialog(window, {
      title: text("Save PDF"),
      defaultPath: "FundTrace-report.pdf",
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (result.canceled) return false;
    const pdf = await window.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
    });
    await writeFile(result.filePath, pdf);
    return true;
  });
  session.defaultSession.webRequest.onBeforeRequest((details, callback) =>
    callback({
      cancel:
        !allowed(details.url) &&
        !details.url.startsWith(`blob:${workspace?.origin}/`),
    }),
  );
  window = new BrowserWindow({
    title: "FundTrace",
    width: 1440,
    height: 960,
    minWidth: 760,
    minHeight: 600,
    show: false,
    backgroundColor: "#f5f3ec",
    icon: join(here, "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(here, "preload.cjs"),
      webviewTag: false,
      devTools: !app.isPackaged,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!allowed(url)) event.preventDefault();
  });
  window.webContents.on("will-redirect", (event, url) => {
    if (!allowed(url)) event.preventDefault();
  });
  window.webContents.on("did-finish-load", async () => {
    if (!allowed(window.webContents.getURL())) return;
    const selected = await window.webContents.executeJavaScript(
      "document.documentElement.lang",
    );
    language = ["en", "mr", "hi"].includes(selected) ? selected : "en";
    menu();
  });
  session.defaultSession.on("will-download", (_event, item) =>
    item.setSaveDialogOptions({ title: text("Save file") }),
  );
  window.once("ready-to-show", () => window.show());
  await window.loadURL(workspace.origin);
}

if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.focus();
    }
  });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", (event) => {
    if (quitting || !workspace) return;
    event.preventDefault();
    quitting = true;
    session.defaultSession.flushStorageData();
    workspace
      .stop()
      .catch((error) => dialog.showErrorBox("FundTrace", error.message))
      .finally(() => app.quit());
  });
  app
    .whenReady()
    .then(launch)
    .catch((error) => {
      dialog.showErrorBox("FundTrace", error.message);
      app.quit();
    });
}
