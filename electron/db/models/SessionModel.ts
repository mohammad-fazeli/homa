import { Session } from "./Session";
import { Course } from "./Course";
import {
  SessionCreateInput,
  SessionUpdateInput,
  SessionResult,
} from "../types";

export const SessionModel = {
  // -------------------------
  // CREATE
  // -------------------------
  async create(data: SessionCreateInput): Promise<SessionResult> {
    const s = await Session.create(data);
    return s.toJSON() as SessionResult;
  },

  // -------------------------
  // FIND BY ID
  // -------------------------
  async findById(id: number): Promise<SessionResult | null> {
    const s = await Session.findByPk(id);
    return s ? (s.toJSON() as SessionResult) : null;
  },

  // -------------------------
  // FIND BY COURSE
  // -------------------------
  async findByCourse(courseId: number): Promise<SessionResult[]> {
    const sessions = await Session.findAll({
      where: { courseId },
      order: [["date", "ASC"]],
    });

    return sessions.map((s) => s.toJSON() as SessionResult);
  },

  // -------------------------
  // FIND BY USER
  // (Sessions JOIN Courses)
  // -------------------------
  async findByUser(userId: number): Promise<SessionResult[]> {
    const sessions = await Session.findAll({
      include: [
        {
          model: Course,
          where: { userId },
          required: true,
        },
      ],
      order: [["date", "ASC"]],
    });

    return sessions.map((s) => s.toJSON() as SessionResult);
  },

  // -------------------------
  // FIND UNUSED (used = false)
  // -------------------------
  async findUnused(): Promise<SessionResult[]> {
    const sessions = await Session.findAll({
      where: { used: false },
      order: [["date", "ASC"]],
    });

    return sessions.map((s) => s.toJSON() as SessionResult);
  },

  // -------------------------
  // FIND UNUSED BY USER
  // -------------------------
  async findUnusedByUser(userId: number): Promise<SessionResult[]> {
    const sessions = await Session.findAll({
      where: { used: false },
      include: [
        {
          model: Course,
          where: { userId },
          required: true,
        },
      ],
      order: [["date", "ASC"]],
    });

    return sessions.map((s) => s.toJSON() as SessionResult);
  },

  // -------------------------
  // MARK AS USED
  // -------------------------
  async markUsed(id: number): Promise<SessionResult | null> {
    const s = await Session.findByPk(id);
    if (!s) return null;

    await s.update({
      used: true,
      usedAt: new Date(),
    });

    return s.toJSON() as SessionResult;
  },

  // -------------------------
  // UPDATE (partial)
  // -------------------------
  async update(
    id: number,
    data: SessionUpdateInput
  ): Promise<SessionResult | null> {
    const s = await Session.findByPk(id);
    if (!s) return null;

    await s.update(data);
    return s.toJSON() as SessionResult;
  },

  // -------------------------
  // DELETE
  // -------------------------
  async delete(id: number): Promise<void> {
    await Session.destroy({ where: { id } });
  },

  // -------------------------
  // ALL SESSIONS
  // -------------------------
  async all(): Promise<SessionResult[]> {
    const sessions = await Session.findAll({
      order: [["date", "ASC"]],
    });

    return sessions.map((s) => s.toJSON() as SessionResult);
  },
};
