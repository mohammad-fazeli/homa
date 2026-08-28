import { Migration } from "../types";

export const migration006: Migration = {
  version: 6,
  name: "finance_ledger",
  up: (db) => {
    const addColumn = (table: string, column: string, ddl: string) => {
      const columns = db
        .prepare(`PRAGMA table_info(${table})`)
        .all() as Array<{ name: string }>;
      if (columns.some((item) => item.name === column)) return;
      db.prepare(`ALTER TABLE ${table} ADD COLUMN ${ddl}`).run();
    };

    addColumn("Payments", "kind", "kind TEXT NOT NULL DEFAULT 'payment'");
    addColumn("Payments", "reference", "reference TEXT");

    db.prepare(
      `UPDATE Payments SET kind = 'payment' WHERE kind IS NULL OR TRIM(kind) = ''`
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_payments_paidAt ON Payments(paidAt)`
    ).run();
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_payments_kind ON Payments(kind)`
    ).run();
    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_payments_course ON Payments(courseId)`
    ).run();
  },
};
