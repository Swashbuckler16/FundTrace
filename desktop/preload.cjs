const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "fundtraceDesktop",
  Object.freeze({
    savePDF: () => ipcRenderer.invoke("fundtrace:save-pdf"),
  }),
);
