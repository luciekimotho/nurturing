import { PrismaClient } from "@prisma/client";

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export const prisma = hasDatabaseUrl
  ? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
  : null;

export const isPersistenceEnabled = hasDatabaseUrl;

export const DB_UNAVAILABLE_ERROR = {
  error: "Database is not configured. Set DATABASE_URL and run Prisma migrations.",
};
