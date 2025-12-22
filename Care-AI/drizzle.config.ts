import { defineConfig } from "drizzle-kit";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_URL || path.resolve(__dirname, "health_wallet.db");

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (dbDir && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export default defineConfig({
  out: path.resolve(__dirname, "migrations"),
  schema: path.resolve(__dirname, "shared", "schema.ts"),
  dialect: "sqlite",
  dbCredentials: {
    url: dbPath,
  },
});
