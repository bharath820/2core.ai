import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../shared/schema";
import path from "path";
import fs from "fs";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), "health_wallet.db");

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Creating database at: ${dbPath}`);

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

const db = drizzle(sqlite, { schema });

// Use drizzle-kit push approach - create tables directly
async function initDatabase() {
  try {
    // Create tables using SQL directly since we don't have migrations yet
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'owner',
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        type TEXT NOT NULL,
        report_date TEXT NOT NULL,
        file_path TEXT NOT NULL,
        summary TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS vitals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        value TEXT NOT NULL,
        unit TEXT NOT NULL,
        date INTEGER NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS shares (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL REFERENCES reports(id),
        shared_by_user_id INTEGER NOT NULL REFERENCES users(id),
        shared_with_username TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );
    `);

    console.log("Database tables created successfully!");
    sqlite.close();
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    sqlite.close();
    process.exit(1);
  }
}

initDatabase();

