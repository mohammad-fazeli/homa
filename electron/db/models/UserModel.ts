import { Op } from "sequelize";
import { User } from "./User";
import { Course } from "./Course";
import { Session } from "./Session";
import {
  UserCreateInput,
  UserUpdateInput,
  UserFindAllItem,
  UserFindAllResult,
  UserFindByIdResult,
} from "../types";

export const UserModel = {
  async findAll(page = 1, limit = 15, search = ""): Promise<UserFindAllResult> {
    const offset = (page - 1) * limit;

    let where: any = {};
    if (search.trim()) {
      where = {
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { phone: { [Op.like]: `%${search}%` } },
          { nationalId: { [Op.like]: `%${search}%` } },
        ],
      };
    }

    const total = await User.count({ where });

    const users = await User.findAll({
      where,
      limit,
      offset,
      order: [["id", "DESC"]],
      include: [
        {
          model: Course,
          limit: 1,
          order: [["id", "DESC"]],
          include: [
            {
              model: Session,
              limit: 1,
              order: [["date", "ASC"]],
            },
          ],
        },
      ],
    });

    const data: UserFindAllItem[] = users.map((u: any) => {
      const course = u.Courses?.[0];

      return {
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        nationalId: u.nationalId,
        course: course
          ? {
              id: course.id,
              userId: course.userId,
              cost: course.cost,
              totalSessions: course.sessions,
              nextSessionDate: course.Sessions?.[0]?.date ?? null,
            }
          : null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findById(id: number): Promise<UserFindByIdResult | null> {
    const user = await User.findByPk(id);
    if (!user) return null;

    const course: any = await Course.findOne({
      where: { userId: id },
      order: [["id", "DESC"]],
      include: [{ model: Session, order: [["date", "ASC"]] }],
    });

    if (!course) {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        nationalId: user.nationalId,
        course: null,
      };
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      nationalId: user.nationalId,
      course: {
        id: course.id,
        cost: course.cost,
        totalSessions: course.sessions,
        sessions: course.Sessions.map((s: any) => ({
          id: s.id,
          date: s.date,
          used: !!s.used,
          usedAt: s.usedAt,
        })),
      },
    };
  },

  async create(data: UserCreateInput) {
    return await User.create(data);
  },

  async update(data: UserUpdateInput) {
    const user = await User.findByPk(data.id);
    if (!user) return null;

    return user.update(data);
  },

  async delete(id: number) {
    return User.destroy({ where: { id } });
  },
};
