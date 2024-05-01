import { app, BrowserWindow } from "electron";
import path from "node:path";

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, "../preload/preload.js"),
      sandbox: true,
    },
  });

  win.loadFile(path.resolve(__dirname, "../renderer/index.html"));
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
