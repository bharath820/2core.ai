import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Use SQLite database file in project root
const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), "health_wallet.db");

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL"); // Better performance

export const db = drizzle(sqlite, { schema });
