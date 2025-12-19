// src/database/migrate.ts
import { db } from "./index";
import { migrations } from "./migrations";

export function runMigrations() {
  const currentVersion = db.pragma("user_version", { simple: true }) as number;

  const pending = migrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    console.log(`Running migration ${migration.version}: ${migration.name}`);

    db.transaction(() => {
      migration.up(db);
      db.pragma(`user_version = ${migration.version}`);
    })();
  }
}
