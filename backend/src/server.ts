import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { ensureDirectory, contractsRoot, invoicesRoot, repairOrdersRoot } from "./utils/paths.js";
import os from "node:os";

const getLanUrls = () =>
  Object.values(os.networkInterfaces())
    .flatMap((items) => items ?? [])
    .filter((item) => item.family === "IPv4" && !item.internal)
    .map((item) => `http://${item.address}:${env.PORT}`);

const start = async () => {
  await ensureDirectory(contractsRoot);
  await ensureDirectory(repairOrdersRoot);
  await ensureDirectory(invoicesRoot);

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
