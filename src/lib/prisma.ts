import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  adapter?: PrismaBetterSqlite3;
};

function resolveDbUrl() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  if (url === ":memory:") return url;
  const bare = url.replace(/^file:/, "");
  return path.isAbsolute(bare) ? bare : path.join(/*turbopackIgnore: true*/ process.cwd(), bare);
}

const adapter =
  globalForPrisma.adapter ??
  new PrismaBetterSqlite3({ url: resolveDbUrl(), timeout: 10_000 });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adapter = adapter;
  globalForPrisma.prisma = prisma;
}
