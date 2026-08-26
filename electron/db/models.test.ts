import { describe, expect, it, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { openDatabase, closeDatabase, db } from "./connection";
import { UserModel } from "./models/UserModel";
import { CourseModel } from "./models/CourseModel";
import { SessionModel } from "./models/SessionModel";

function sqliteAvailable() {
  try {
    const memory = new Database(":memory:");
    memory.close();
    return true;
  } catch {
    return false;
  }
}

describe.skipIf(!sqliteAvailable())("sqlite models", () => {
  beforeEach(() => {
    openDatabase(":memory:");
  });

  afterEach(() => {
    closeDatabase();
  });

  it("creates a user and finds by id", () => {
    const user = UserModel.create({
      firstName: "علی",
      lastName: "تستی",
      phone: "09121111111",
      nationalId: "1111111111",
      uidCart: "ABCDEF1234",
    });
    expect(user?.id).toBeTruthy();
    expect(UserModel.findById(user!.id)?.firstName).toBe("علی");
  });

  it("rejects duplicate phone", () => {
    UserModel.create({
      firstName: "یکی",
      lastName: "دو",
      phone: "09120000000",
      nationalId: "2222222222",
      uidCart: "1111111111",
    });
    expect(() =>
      UserModel.create({
        firstName: "سه",
        lastName: "چهار",
        phone: "09120000000",
        nationalId: "3333333333",
        uidCart: "2222222222",
      })
    ).toThrow();
  });

  it("creates a course session", () => {
    const user = UserModel.create({
      firstName: "سارا",
      lastName: "جلسه",
      phone: "09123333333",
      nationalId: "4444444444",
      uidCart: "3333333333",
    })!;
    const course = CourseModel.create({
      userId: user.id,
      cost: 1000,
      sessions: 1,
    });
    const session = SessionModel.create({
      courseId: course.id,
      date: new Date(2026, 7, 25, 10, 0, 0).toISOString(),
      used: 0,
      usedAt: null,
    });
    expect(session.id).toBeTruthy();
    SessionModel.useSession(session.id, new Date().toISOString());
    const used = db
      .prepare(`SELECT used FROM Sessions WHERE id = ?`)
      .get(session.id) as { used: number };
    expect(used.used).toBe(1);
    SessionModel.unuseSession(session.id);
    const unused = db
      .prepare(`SELECT used, usedAt FROM Sessions WHERE id = ?`)
      .get(session.id) as { used: number; usedAt: string | null };
    expect(unused.used).toBe(0);
    expect(unused.usedAt).toBeNull();
  });

  it("filters users without a card", () => {
    UserModel.create({
      firstName: "با",
      lastName: "کارت",
      phone: "09124444444",
      nationalId: "5555555555",
      uidCart: "CARD123456",
    });
    UserModel.create({
      firstName: "بی",
      lastName: "کارت",
      phone: "09125555555",
      nationalId: "6666666666",
      uidCart: "",
    });
    const none = UserModel.findAll(1, 10, "", "no_card");
    expect(none.data.some((u) => u.lastName === "کارت" && !u.hasCard)).toBe(
      true
    );
    expect(none.data.every((u) => !u.hasCard)).toBe(true);
    const byUid = UserModel.findAll(1, 10, "CARD123456");
    expect(byUid.data[0]?.firstName).toBe("با");
  });
});
