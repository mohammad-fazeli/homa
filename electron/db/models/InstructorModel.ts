import { db } from "../connection";
import { InstructorAttributes, InstructorWriteInput } from "../types";

function mapInstructor(row: any): InstructorAttributes {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone ?? null,
    color: row.color,
    notes: row.notes ?? null,
  };
}

export const InstructorModel = {
  list(): InstructorAttributes[] {
    return db
      .prepare(`SELECT * FROM Instructors ORDER BY id DESC`)
      .all()
      .map(mapInstructor);
  },

  findById(id: number): InstructorAttributes | null {
    const row = db.prepare(`SELECT * FROM Instructors WHERE id = ?`).get(id);
    return row ? mapInstructor(row) : null;
  },

  save(data: InstructorWriteInput): InstructorAttributes {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    if (!firstName || !lastName) throw new Error("نام مربی را وارد کنید");
    const color = data.color?.trim() || "#c4893a";

    if (data.id && data.id > 0) {
      db.prepare(
        `
        UPDATE Instructors
        SET firstName = ?, lastName = ?, phone = ?, color = ?, notes = ?,
            updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      ).run(
        firstName,
        lastName,
        data.phone?.trim() || null,
        color,
        data.notes ?? null,
        data.id
      );
      return this.findById(data.id)!;
    }

    const result = db
      .prepare(
        `
        INSERT INTO Instructors (firstName, lastName, phone, color, notes, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(
        firstName,
        lastName,
        data.phone?.trim() || null,
        color,
        data.notes ?? null
      );
    return this.findById(result.lastInsertRowid as number)!;
  },

  delete(id: number) {
    db.prepare(`UPDATE Courses SET instructorId = NULL WHERE instructorId = ?`).run(
      id
    );
    db.prepare(
      `UPDATE Sessions SET instructorId = NULL WHERE instructorId = ?`
    ).run(id);
    return db.prepare(`DELETE FROM Instructors WHERE id = ?`).run(id).changes;
  },
};
