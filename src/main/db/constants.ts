import path from "path";
import { app } from "electron";

export const isDev = !app.isPackaged;
export const dbPath = path.join(app.getPath("userData"), "llog.db");
// TODO: process.env.DTABASE_URLが存在することを検証するコードをあとで書く。
// zodやvildbotを使うと良さそう
export const dbUrl = isDev ? "file:dev.db" : "file:" + dbPath;

process.env.DATABASE_URL = dbUrl;

// CAUTION: マイグレーションを行う度に最新のマイグレーションの名前に変更すること
export const latestMigration = "";

const electronPlatFormName = {
  win32: "win32",
  linux: "linux",
  darwin: "darwin",
  darwinArm64: "darwinArm64",
} as const;
type ElectronPlatFormName = keyof typeof electronPlatFormName;
type PlatFormNameToExecutables = {
  [k in ElectronPlatFormName]: {
    schemaEngine: string;
    queryEngine: string;
  };
};
export const platformToExecutables: PlatFormNameToExecutables = {
  win32: {
    schemaEngine: "node_modules/@prisma/engines/schema-engine-windows.exe",
    queryEngine: "node_modules/@prisma/engines/query_engine-windows.dll.node",
  },
  linux: {
    schemaEngine:
      "node_modules/@prisma/engines/schema-engine-debian-openssl-1.1.x",
    queryEngine:
      "node_modules/@prisma/engines/libquery_engine-debian-openssl-1.1.x.so.node",
  },
  darwin: {
    schemaEngine: "node_modules/@prisma/engines/schema-engine-darwin",
    queryEngine:
      "node_modules/@prisma/engines/libquery_engine-darwin.dylib.node",
  },
  darwinArm64: {
    schemaEngine: "node_modules/@prisma/engines/schema-engine-darwin-arm64",
    queryEngine:
      "node_modules/@prisma/engines/libquery_engine-darwin-arm64.dylib.node",
  },
};
const extraResourcePath = app.getAppPath().replace("app.asar", "");

const getPlatformName = (): ElectronPlatFormName => {
  const platformName = process.platform;
  // ElectronはWindows、Mac OS、Linuxのみサポートしているため
  // process.platformが返す上記のプラットフォーム名以外が返ってくる可能性を排除する
  if (platformName === electronPlatFormName.darwin && process.arch === "arm64")
    return `${platformName}Arm64`;
  if (
    platformName === electronPlatFormName.win32 ||
    platformName === electronPlatFormName.linux ||
    platformName === electronPlatFormName.darwin
  )
    return platformName;

  throw new Error(`Electron never works on ${platformName}.`);
};

const platformName = getPlatformName();

export const schemaEnginePath = path.join(
  extraResourcePath,
  platformToExecutables[platformName].schemaEngine,
);
export const queryEnginePath = path.join(
  extraResourcePath,
  platformToExecutables[platformName].queryEngine,
);

export type Migration = {
  id: string;
  checksum: string;
  finished_at: string;
  migration_name: string;
  logs: string;
  rolled_back_at: string;
  started_at: string;
  applied_steps_count: string;
};
