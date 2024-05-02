import log from "electron-log";
import { dbUrl, schemaEnginePath, queryEnginePath } from "./constants";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { fork } from "node:child_process";

log.info("DB URL", dbUrl);
log.info("Query Engine Path", queryEnginePath);

export const prisma = new PrismaClient({
  log: ["info", "warn", "error"],
  datasourceUrl: dbUrl,
  // see https://github.com/prisma/prisma/discussions/5200
  // @ts-expect-error internal prop
  __internal: {
    engine: { binaryPath: queryEnginePath },
  },
});

export const runPrismaCommand = async ({
  command,
  dbUrl,
}: {
  command: string[];
  dbUrl: string;
}): Promise<number> => {
  log.info("Schema engine path", schemaEnginePath);
  log.info("Query engine path", queryEnginePath);

  try {
    const exitCode = await new Promise((resolve) => {
      const prismaPath = path.resolve(
        __dirname,
        "..",
        "..",
        "node_modules/prisma/build/index.js",
      );

      log.info("Prisma path", prismaPath);
      const child = fork(prismaPath, command, {
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
          PRISMA_SCHEMA_ENGINE_BINARY: schemaEnginePath,
          PRISMA_QUERY_ENGINE_LIBRARY: queryEnginePath,
        },
        stdio: "pipe",
      });

      child.on("message", (msg) => {
        log.info(msg);
      });

      child.on("error", (err) => {
        log.error("Child process got error:", err);
      });

      child.on("close", (code) => {
        resolve(code);
      });

      child.stdout?.on("data", (data) => {
        log.info(`stdout: ${data}`);
      });

      child.stderr?.on("data", (data) => {
        log.error("prisma: ", data.toString());
      });
    });

    if (exitCode !== 0)
      throw Error(`command ${command} failed with exit code ${exitCode}`);
    return exitCode;
  } catch (e) {
    log.error(e);
    throw e;
  }
};
