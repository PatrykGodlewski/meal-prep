import { config } from "dotenv";
import * as path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const envPath = path.resolve(__dirname, "../.env");
config({ path: envPath }); // or .env.local

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle({ client });
