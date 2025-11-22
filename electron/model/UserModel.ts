import { db } from "./db";

export type User = {
  id?: number;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  sessions: number;
};

export const UserModel = {
  findAll() {
    return db.prepare("SELECT * FROM Users ORDER BY id DESC").all();
  },

  findById(id: number) {
    return db.prepare("SELECT * FROM Users WHERE id = ?").get(id);
  },

  create(user: User) {
    const stmt = db.prepare(`
      INSERT INTO Users (firstName, lastName, phone, nationalId, sessions)
      VALUES (@firstName, @lastName, @phone, @nationalId, @sessions)
    `);
    stmt.run(user);
  },

  update(user: User) {
    const stmt = db.prepare(`
      UPDATE Users
      SET firstName=@firstName, lastName=@lastName, phone=@phone,
          nationalId=@nationalId, sessions=@sessions
      WHERE id=@id
    `);
    stmt.run(user);
  },

  delete(id: number) {
    db.prepare("DELETE FROM Users WHERE id = ?").run(id);
  },
};
