import fs from "node:fs";
import { app, BrowserWindow } from "electron";
import log from "electron-log";
import path from "node:path";
import { prisma, runPrismaCommand } from "./db/prisma";
import { dbUrl, dbPath, type Migration, latestMigration } from "./db/constants";

const createWindow = async () => {
  let needsMigration;
  const dbExists = fs.existsSync(dbPath);
  if (!dbExists) {
    needsMigration = true;
    fs.closeSync(fs.openSync(dbPath, "w"));
  } else {
    try {
      const latest: Migration[] =
        await prisma.$queryRaw`select * from _prisma_migrations order by finished_at`;
      needsMigration =
        latest[latest.length - 1]?.migration_name !== latestMigration;
    } catch (e) {
      log.error(e);
      needsMigration = true;
    }
  }

  if (needsMigration) {
    try {
      const schemaPath = path.join(
        app.getAppPath().replace("app.asar", "app.asar.unpacked"),
        "prisma",
        "schema.prisma",
      );
      log.info("Schema path", schemaPath);
      await runPrismaCommand({
        command: ["migrate", "deploy", "--schema", schemaPath],
        dbUrl,
      });
      log.info("Migration done.");
    } catch (e) {
      log.error(e);
      process.exit(1);
    }
  } else {
    log.info("Does not need migration");
  }

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
