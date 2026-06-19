import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { ensureDirectory, contractsRoot, invoicesRoot, repairOrdersRoot } from "./utils/paths.js";
import { startReminderDaemon } from "./jobs/reminderDaemon.js";
import os from "node:os";

const getLanUrls = () =>
  Object.values(os.networkInterfaces())
    .flatMap((items) => items ?? [])
    .filter((item) => item.family === "IPv4" && !item.internal)
    .map((item) => `http://${item.address}:${env.PORT}`);

const getDatabaseTarget = () => {
  try {
    const url = new URL(env.DATABASE_URL);
    const database = url.pathname.replace(/^\//, "") || "postgres";
    return `${url.hostname}:${url.port || "5432"}/${database}`;
  } catch {
    return "unknown";
  }
};

const start = async () => {
  await ensureDirectory(contractsRoot);
  await ensureDirectory(repairOrdersRoot);
  await ensureDirectory(invoicesRoot);

  try {
    await prisma.$connect();
    if (process.env.NODE_ENV !== "production") {
      console.log("[db] Connected to PostgreSQL");
      console.log(`[db] Target: ${getDatabaseTarget()}`);
    }
  } catch (error) {
    console.error("[db] Failed to connect to PostgreSQL. Check DATABASE_URL and that the database is running.");
    console.error(error);
    process.exit(1);
  }

  startReminderDaemon();

  const server = app.listen(env.PORT, env.HOST, () => {
    console.log(`Backend API listening on ${env.HOST}:${env.PORT}`);
    console.log(`  Local:   http://localhost:${env.PORT}`);
    for (const url of getLanUrls()) {
      console.log(`  Network: ${url}`);
    }
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
