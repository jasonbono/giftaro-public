import { defineConfig } from "drizzle-kit";
import path from "path";

// Tour-only drizzle config: pushes to a local SQLite file with the `sqlite`
// dialect (no Turso auth needed). The main drizzle.config.ts uses `turso`
// for prod, which requires an authToken.
const dbFile = path.join(__dirname, ".tour.db");

export default defineConfig({
  schema: "./src/lib/drizzle-schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: { url: `file:${dbFile}` },
});
