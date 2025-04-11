import * as path from "node:path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const envPath = path.resolve(__dirname, "../.env");
config({ path: envPath }); // or .env.local

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env");
}

function singleton<Value>(name: string, value: () => Value): Value {
  const globalAny: any = global;
  globalAny.__singletons = globalAny.__singletons || {};

  if (!globalAny.__singletons[name]) {
    globalAny.__singletons[name] = value();
  }

  return globalAny.__singletons[name];
}

function createDatabaseConnection() {
  const client = postgres(process.env.DATABASE_URL ?? "");
  return drizzle({ client });
}

export const db = singleton("db", createDatabaseConnection);
