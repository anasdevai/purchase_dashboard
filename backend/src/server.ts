import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { ensureDirectory, contractsRoot } from "./utils/paths.js";

const start = async () => {
  await ensureDirectory(contractsRoot);

  const server = app.listen(env.PORT, env.HOST, () => {
    console.log(`Backend API listening on ${env.HOST}:${env.PORT}`);
    console.log(`  Local:   http://localhost:${env.PORT}`);
    console.log(`  Network: http://192.168.100.29:${env.PORT} (use your machine LAN IP if different)`);
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

