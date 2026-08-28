import { describe, expect, it, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import { openDatabase, closeDatabase, db } from "./connection";
import { UserModel } from "./models/UserModel";
import { CourseModel } from "./models/CourseModel";
import { SessionModel } from "./models/SessionModel";
import { ClassGroupModel } from "./models/ClassGroupModel";
import { HolidayModel } from "./models/HolidayModel";

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

  it("builds the same hour for every named-group member", () => {
    const a = UserModel.create({
      firstName: "ندا",
      lastName: "گروهی",
      phone: "09126666666",
      nationalId: "7777777777",
      uidCart: "",
    })!;
    const b = UserModel.create({
      firstName: "مینا",
      lastName: "گروهی",
      phone: "09127777777",
      nationalId: "8888888888",
      uidCart: "",
    })!;
    const group = ClassGroupModel.save({
      name: "پیانو کودکان",
      roomId: 1,
      weekdays: [0],
      hour: 16,
      sessions: 2,
      cost: 0,
    });
    ClassGroupModel.addMember(group.id, a.id, false);
    ClassGroupModel.addMember(group.id, b.id, false);
    const result = ClassGroupModel.generate({
      groupId: group.id,
      startDate: "2026-08-29",
    });
    expect(result.created).toBe(4);
    const again = ClassGroupModel.generate({
      groupId: group.id,
      startDate: "2026-08-29",
    });
    expect(again.created).toBe(0);
  });

  it("skips a named holiday when generating group sessions", () => {
    const user = UserModel.create({
      firstName: "رها",
      lastName: "تعطیل",
      phone: "09128888888",
      nationalId: "9999999999",
      uidCart: "",
    })!;
    HolidayModel.save({ dayKey: "2026-08-29", title: "تعطیل تست" });
    const group = ClassGroupModel.save({
      name: "گروه تعطیل",
      roomId: 1,
      weekdays: [0],
      hour: 16,
      sessions: 2,
      cost: 0,
    });
    ClassGroupModel.addMember(group.id, user.id, false);
    const result = ClassGroupModel.generate({
      groupId: group.id,
      startDate: "2026-08-29",
    });
    expect(result.created).toBe(2);
    const dates = db
      .prepare(
        `SELECT s.date FROM Sessions s JOIN Courses c ON c.id = s.courseId WHERE c.userId = ? ORDER BY s.date`
      )
      .all(user.id) as Array<{ date: string }>;
    expect(dates).toHaveLength(2);
    expect(new Date(dates[0].date).getDate()).toBe(5);
    expect(new Date(dates[0].date).getMonth()).toBe(8);
  });

  it("does not generate group sessions on a weekly closed day", () => {
    const user = UserModel.create({
      firstName: "یاس",
      lastName: "جمعه",
      phone: "09120001111",
      nationalId: "1212121212",
      uidCart: "",
    })!;
    HolidayModel.setClosedWeekdays([0]);
    const group = ClassGroupModel.save({
      name: "گروه شنبه بسته",
      roomId: 1,
      weekdays: [0],
      hour: 16,
      sessions: 2,
      cost: 0,
    });
    ClassGroupModel.addMember(group.id, user.id, false);
    expect(() =>
      ClassGroupModel.generate({
        groupId: group.id,
        startDate: "2026-08-29",
      })
    ).toThrow(/تعطیل/);
  });

  it("rejects a new session on a named holiday and keeps an existing one", () => {
    const user = UserModel.create({
      firstName: "کیان",
      lastName: "رزرو",
      phone: "09129999999",
      nationalId: "1010101010",
      uidCart: "",
    })!;
    const course = CourseModel.create({
      userId: user.id,
      cost: 0,
      sessions: 1,
      roomId: 1,
    });
    const holidayDate = new Date(2026, 7, 29, 16, 0, 0).toISOString();
    SessionModel.create({
      courseId: course.id,
      date: holidayDate,
      used: 0,
      usedAt: null,
    });
    HolidayModel.save({ dayKey: "2026-08-29", title: "تعطیل تست" });
    expect(() =>
      SessionModel.assertSlotAvailable([holidayDate], { roomId: 1 })
    ).toThrow(/تعطیل/);
    SessionModel.update(course.id, [
      {
        id: -1,
        courseId: course.id,
        date: holidayDate,
        used: 0,
        usedAt: null,
        status: "scheduled",
      },
    ]);
    expect(() =>
      SessionModel.update(course.id, [
        {
          id: -1,
          courseId: course.id,
          date: new Date(2026, 7, 29, 17, 0, 0).toISOString(),
          used: 0,
          usedAt: null,
          status: "scheduled",
        },
      ])
    ).toThrow(/تعطیل/);
  });
});
