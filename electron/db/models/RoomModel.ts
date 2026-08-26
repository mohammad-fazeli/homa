import { db } from "../connection";
import { RoomAttributes, RoomWriteInput } from "../types";

function mapRoom(row: any): RoomAttributes {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    capacity: row.capacity,
    notes: row.notes ?? null,
  };
}

export const RoomModel = {
  list(): RoomAttributes[] {
    return db
      .prepare(`SELECT * FROM Rooms ORDER BY id ASC`)
      .all()
      .map(mapRoom);
  },

  findById(id: number): RoomAttributes | null {
    const row = db.prepare(`SELECT * FROM Rooms WHERE id = ?`).get(id);
    return row ? mapRoom(row) : null;
  },

  save(data: RoomWriteInput): RoomAttributes {
    const capacity = Math.max(1, Math.floor(Number(data.capacity) || 1));
    const color = data.color?.trim() || "#14635c";
    const name = data.name.trim();
    if (!name) throw new Error("نام کلاس را وارد کنید");

    if (data.id && data.id > 0) {
      db.prepare(
        `
        UPDATE Rooms
        SET name = ?, color = ?, capacity = ?, notes = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(name, color, capacity, data.notes ?? null, data.id);
      return this.findById(data.id)!;
    }

    const result = db
      .prepare(
        `
        INSERT INTO Rooms (name, color, capacity, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(name, color, capacity, data.notes ?? null);
    return this.findById(result.lastInsertRowid as number)!;
  },

  delete(id: number) {
    db.prepare(`UPDATE Courses SET roomId = NULL WHERE roomId = ?`).run(id);
    db.prepare(`UPDATE Sessions SET roomId = NULL WHERE roomId = ?`).run(id);
    return db.prepare(`DELETE FROM Rooms WHERE id = ?`).run(id).changes;
  },
};
